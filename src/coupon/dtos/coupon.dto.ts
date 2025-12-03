export type CouponDto = {
  status: number;
  validityDate: Date | null;
  discount?: string;
  issueDate?: Date | null;
  couponCode?: string;
};
