import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {

    // Uses AES-128-GCM for better performance.
    private readonly algorithm = 'aes-128-gcm';
    private readonly keyLength = 16; 
    private readonly ivLength = 12; 
    private readonly tagLength = 16; 

    constructor(private readonly configService: ConfigService) { }


    private getEncryptionKey(): Buffer {
        const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
        return crypto.pbkdf2Sync(secret, 'access-token-encryption-salt', 50000, this.keyLength, 'sha256');
    }

    // Convert base64 to base64url.
    private base64UrlEncode(buffer: Buffer): string {
        return buffer.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    // Convert base64url back to base64.
    private base64UrlDecode(str: string): Buffer {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
            str += '=';
        }
        return Buffer.from(str, 'base64');
    }


    // Encrypt data using AES-128-GCM.
    encrypt(data: string): string {
        const key = this.getEncryptionKey();
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);

        let encrypted = cipher.update(data, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const tag = cipher.getAuthTag();

        return `${this.base64UrlEncode(iv)}:${this.base64UrlEncode(tag)}:${this.base64UrlEncode(encrypted)}`;
    }

    // Decrypt data encrypted with encrypt() method.
    decrypt(encryptedData: string): string {
        const key = this.getEncryptionKey();
        const parts = encryptedData.split(':');

        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = this.base64UrlDecode(parts[0]);
        const tag = this.base64UrlDecode(parts[1]);
        const encrypted = this.base64UrlDecode(parts[2]);

        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    }
}
