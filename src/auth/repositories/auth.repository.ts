import { Injectable } from '@nestjs/common';

// Imports TypeORM.
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, MoreThan, Repository } from 'typeorm';

// Imports Redis.
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

// Import entity.
import { RefreshTokenEntity } from '../entities/refreshToken.entity';

export type RefreshTokenRevokeRedisCleanup = { redisKeys: string[]; redisIdKeys: string[] };

@Injectable()
export class AuthRepository {
    constructor(
        @InjectRepository(RefreshTokenEntity) private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
        @InjectRedis() private readonly redisClient: Redis
    ) { }

    // --- Private variables and methods ---
    private readonly RefreshTokenPrefix: string = 'auth:RT:'; // seikyu:auth:RT
    private readonly RefreshTokenIdPrefix: string = 'auth:RTID:'; // seikyu:auth:RTID
    private readonly RefreshTokenRateLimitPrefix: string = 'auth:RTRL:'; // seikyu:auth:RTRL
    private readonly RateLimitRefreshTokenDuration: number = 10 * 60; // 10 minutes
    private readonly MaxRefreshTokensPerUser: number = 5;

    // --- Public methods ---
    // Store a refresh token.
    async storeRefreshToken(id: string, userId: string, refreshToken: string, expiresAt: Date, manager: EntityManager): Promise<RefreshTokenEntity> {

        // Create the refresh token entity.
        const savedToken: RefreshTokenEntity = await manager.save(RefreshTokenEntity, { id, userId, refreshToken, expiresAt });

        // Save the refresh token to the redis.
        const ttl: number = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
        await this.redisClient.hset(
            `${this.RefreshTokenPrefix}${refreshToken}`,
            'id', savedToken.id,
            'userId', savedToken.userId,
            'expiresAt', savedToken.expiresAt.toISOString(),
        );
        await this.redisClient.expire(`${this.RefreshTokenPrefix}${refreshToken}`, ttl);

        await this.redisClient.setex(`${this.RefreshTokenIdPrefix}${id}`, ttl, id);

        return savedToken;
    }

    // Validate a refresh token.
    async validateRefreshToken(refreshToken: string): Promise<RefreshTokenEntity | null> {

        // Check if the refresh token is in the redis.
        const redisToken: Record<string, string> = await this.redisClient.hgetall(`${this.RefreshTokenPrefix}${refreshToken}`);
        if (Object.keys(redisToken).length > 0) {
            return {
                id: redisToken.id,
                userId: redisToken.userId,
                refreshToken: refreshToken,
                expiresAt: new Date(redisToken.expiresAt),
            };
        }

        // Check if the refresh token is in the database.
        const databaseToken = await this.refreshTokenRepository.findOne({ where: { refreshToken } });
        if (databaseToken) {
            // Update the refresh token in the redis.
            const ttl = Math.floor((databaseToken.expiresAt.getTime() - Date.now()) / 1000);

            await this.redisClient.hset(
                `${this.RefreshTokenPrefix}${refreshToken}`,
                'id', databaseToken.id,
                'userId', databaseToken.userId,
                'expiresAt', databaseToken.expiresAt.toISOString(),
            );
            await this.redisClient.expire(`${this.RefreshTokenPrefix}${refreshToken}`, ttl);

            // Check if the RefreshTokenIdPrefix is valid.
            const redisId = await this.redisClient.get(`${this.RefreshTokenIdPrefix}${databaseToken.id}`);
            if (!redisId) await this.redisClient.setex(`${this.RefreshTokenIdPrefix}${databaseToken.id}`, ttl, databaseToken.id);

            return {
                id: databaseToken.id,
                userId: databaseToken.userId,
                refreshToken: refreshToken,
                expiresAt: databaseToken.expiresAt,
            };
        }
        return null;
    }

    // Validate a refresh token by id.
    async validateRefreshTokenById(refreshTokenId: string): Promise<boolean> {

        // Check if the refresh token exists in the redis.
        const redisId = await this.redisClient.get(`${this.RefreshTokenIdPrefix}${refreshTokenId}`);
        if (redisId) return true;

        // Check if the refresh token exists in the database.
        const databaseToken = await this.refreshTokenRepository.findOne({
            where: { id: refreshTokenId },
        });
        if (databaseToken) {
            // Check if token is not expired.
            if (databaseToken.expiresAt < new Date()) {
                return false;
            }

            // Update the refresh token in the redis.
            const ttl = Math.floor((databaseToken.expiresAt.getTime() - Date.now()) / 1000);
            if (ttl > 0) {
                await this.redisClient.setex(`${this.RefreshTokenIdPrefix}${refreshTokenId}`, ttl, refreshTokenId);
            }

            return true;
        }

        return false;
    }

    // Set rate limit for creating a new access token.
    async setRateLimit(refreshToken: string): Promise<boolean> {
        await this.redisClient.setex(
            `${this.RefreshTokenRateLimitPrefix}${refreshToken}`,
            this.RateLimitRefreshTokenDuration,
            `${refreshToken}`
        );
        return true;
    }

    // Check rate limit of the refresh token.
    async checkRateLimit(refreshToken: string): Promise<boolean> {
        const rateLimit = await this.redisClient.get(`${this.RefreshTokenRateLimitPrefix}${refreshToken}`);
        if (rateLimit) return true;
        return false;
    }

    // Check if the user has too many refresh tokens.
    // Maximum 5 refresh tokens per user.
    async checkUserHasTooManyRefreshTokens(userId: string): Promise<boolean> {
        const count: number = await this.refreshTokenRepository.count({
            where: {
                userId: userId,
                expiresAt: MoreThan(new Date())
            }
        });
        return (count >= this.MaxRefreshTokensPerUser) ? true : false;
    }

    // Remove a refresh token from the redis and database.
    async removeRefreshToken(refreshToken: RefreshTokenEntity): Promise<boolean> {
        // Remove from the redis.
        await this.redisClient.del(`${this.RefreshTokenPrefix}${refreshToken.refreshToken}`);
        await this.redisClient.del(`${this.RefreshTokenIdPrefix}${refreshToken.id}`);

        // Remove from the database.
        await this.refreshTokenRepository.delete(refreshToken.id);

        return true;
    }

    // Remove all refresh tokens of a user.
    async removeAllRefreshTokens(userId: string, manager: EntityManager): Promise<boolean> {

        // Find all refresh tokens of the user in database.
        const userTokens = await manager.find(RefreshTokenEntity, { where: { userId } });

        // Remove all refresh tokens of the user in redis.
        if (userTokens.length > 0) {
            const redisKeys = userTokens.map(token => `${this.RefreshTokenPrefix}${token.refreshToken}`);
            const redisIds = userTokens.map(token => `${this.RefreshTokenIdPrefix}${token.id}`);

            const pipeline = this.redisClient.pipeline();
            redisKeys.forEach(key => pipeline.del(key));
            redisIds.forEach(key => pipeline.del(key));
            await pipeline.exec();
        }

        // Remove all refresh tokens of the user in database.
        await manager.delete(RefreshTokenEntity, { userId });

        return true;
    }

    // Remove all expired refresh tokens from database.
    async removeAllExpiredRefreshTokens(): Promise<number> {
        const result = await this.refreshTokenRepository
            .createQueryBuilder()
            .delete()
            .from(RefreshTokenEntity)
            .where('expires_at < :now', { now: new Date() })
            .execute();

        return result.affected || 0;
    }
}