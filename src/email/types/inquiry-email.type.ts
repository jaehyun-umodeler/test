import { Qna } from 'src/etc/entities/qna.entity';

/**
 * 문의 이메일 데이터
 */
export interface InquiryEmailData {
  name?: string;
  email: string;
  affiliation?: string;
  position?: string;
  message?: string;
  qna: Qna[];
  attachment: Express.Multer.File;
}
