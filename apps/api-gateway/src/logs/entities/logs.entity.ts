import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

// Import enums.
import { LogCode, ReferenceType } from '@app/common/enums/logEnums.enum';
import { Role } from '@app/common/enums/role.enum';

@Entity('logs')
export class LogsEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'role', type: 'enum', enum: Role })
    role: Role;

    @Column({ name: 'action_user_id', type: 'uuid', nullable: true })
    actionUserId: string | null;

    @Column({ name: 'action', type: 'enum', enum: LogCode })
    action: LogCode;

    @Column({ name: 'reference_type', type: 'enum', enum: ReferenceType, nullable: true })
    referenceType: ReferenceType | null;

    @Column({ name: 'reference_id', type: 'uuid', nullable: true })
    referenceId: string | null;

    @Column({ name: 'metadata', type: 'json', nullable: true })
    metadata: Record<string, any> | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
