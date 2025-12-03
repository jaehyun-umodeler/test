import { ValueTransformer } from 'typeorm';
import { Buffer } from 'buffer';

export class UuidTransformer implements ValueTransformer {
  to(value: string): Buffer {
    if (!value) {
      return null;
    }
    return Buffer.from(value.replace(/-/g, ''), 'hex');
  }

  from(value: Buffer): string {
    if (!value) {
      return null;
    }
    const hex = value.toString('hex');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(
      12,
      16,
    )}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
  }
}
