import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, BaseEntity, ManyToOne, OneToMany } from 'typeorm';

@Entity({ name: 'card_tb', synchronize: false })
export class Cardentity {
    @PrimaryGeneratedColumn({ comment: '고유번호' })
    idx: number;

    @Column({ type: 'int', precision: 11, comment: '유저 고유번호' })
    accountId: number;

    @Column({ type: 'tinyint', precision: 1, comment: '타입 0: 사용가능, 1: 만료 또는 사용불가 등등' })
    status: number;

    @Column({ type: 'varchar', length: 255, comment: '카드명' })
    cardName: string;

    @Column({ type: 'int', precision: 11, comment: '카드 유저 아이디' })
    carduserid: string;

    @CreateDateColumn({ type: 'datetime', precision: 0, comment: '생성일', default: () => "CURRENT_TIMESTAMP" })
    create_dt: Date;
}