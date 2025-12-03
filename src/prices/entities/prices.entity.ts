import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Price {
  @PrimaryColumn()
  name: string; // 'Pro', 'ArtPass', 'All-In-One', 'Enterprise', 'Personal'

  @Column({ type: 'int', default: 0 })
  monthly: number;

  @Column({ type: 'int', default: 0 })
  monthlyUSD: number;

  @Column({ type: 'int', default: 0 })
  yearly: number;

  @Column({ type: 'int', default: 0 })
  yearlyUSD: number;

  @Column({ type: 'int', default: 0 })
  discount: number;

  @Column({ type: 'int', default: 0 })
  freedays: number;
}