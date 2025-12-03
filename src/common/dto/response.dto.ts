export class ResponseDto<T> {
  success: boolean;
  data: T;
  totalCount: number;

  constructor(data?: T, totalCount?: number) {
    this.success = true;
    this.data = data;
    this.totalCount = totalCount;
  }
}
