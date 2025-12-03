// src/util.ts
import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import {
  LicenseCategory,
  LicenseCode,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from './constants';

/**
 * 이메일 형식 검증
 * @param email - 이메일
 * @returns 이메일 형식 검증 결과
 */
export function validateEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

/**
 * 비밀번호 형식 검증
 * @param password - 비밀번호
 * @returns 비밀번호 형식 검증 결과
 */
export function validatePassword(password: string): boolean {
  // 8-15자리, 영문자, 숫자, 특수문자 혼용 필수
  return /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/.test(password);
}

export function decryptEmail(encryptedEmail: string): string {
  const ciphertext = CryptoJS.enc.Base64.parse(encryptedEmail);
  const key = CryptoJS.enc.Utf8.parse('TRIPOLYGON-KEY09');
  const decrypted = CryptoJS.AES.decrypt(
    CryptoJS.lib.CipherParams.create({ ciphertext }),
    key,
    {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    },
  );
  return decrypted.toString(CryptoJS.enc.Utf8);
}

export function encryptEmail(email: string): string {
  const lowerEmail = email.toLowerCase();
  const key = CryptoJS.enc.Utf8.parse('TRIPOLYGON-KEY09');
  const encrypted = CryptoJS.AES.encrypt(lowerEmail, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  // encrypted.ciphertext는 WordArray이므로, 이를 Base64 문자열로 변환
  return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}

export function encryptPassword(password: string): string {
  const hash = CryptoJS.SHA1(password);
  return hash.toString(CryptoJS.enc.Hex);
}

/**
 * 언어 코드 유효성 검증
 * @param language - 검증할 언어 코드
 * @returns 유효한 언어인지 여부
 */
export function isValidLanguage(
  language: string,
): language is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
}

/**
 * 언어 코드 유효성 검증 및 정규화
 * @param language - 검증할 언어 코드
 * @param fallback - 유효하지 않을 경우 사용할 기본 언어 (기본값: 'en')
 * @returns 유효한 언어 코드 또는 fallback 값
 */
export function normalizeLanguage(
  language?: string,
  fallback: SupportedLanguage = 'en',
): SupportedLanguage {
  if (!language || !isValidLanguage(language)) {
    return fallback;
  }

  return language as SupportedLanguage;
}

export function licenseCategoryToCode(
  licenseCategory: LicenseCategory,
): LicenseCode {
  switch (licenseCategory) {
    case LicenseCategory.PRO:
      return LicenseCode.PRO;
    case LicenseCategory.ART:
      return LicenseCode.ART;
    case LicenseCategory.ALL:
      return LicenseCode.ALL;
    case LicenseCategory.EDU:
      return LicenseCode.EDU;
    case LicenseCategory.ENT:
      return LicenseCode.ENT;
    case LicenseCategory.PER:
      return LicenseCode.PER;
    default:
      return LicenseCode.EDU;
  }
}

/* async function sendMailInner(
  sender: string,
  title: string,
  body: string,
  receivers: string,
  file?: Express.Multer.File,
): Promise<nodemailer.SentMessageInfo> {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.gmail.com',
    port: 587,
    secure: false,
    name: 'umodeler.com',
    tls: {},
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: sender || `"UModelerX-Team" <noreply@umodeler.com>`,
    to: receivers,
    subject: title,
    html: body,
  };

  if (file) {
    const attachment: Mail.Attachment = {
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype,
    };
    mailOptions.attachments = [attachment];
  }

  const info = await transporter.sendMail(mailOptions);
  return info;
}

async function sendEmailWithRetry(
  sender: string | undefined,
  title: string,
  body: string,
  receivers: string,
  file?: Express.Multer.File,
): Promise<boolean> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const info = await sendMailInner(sender, title, body, receivers, file);
      console.log(`Attempt ${attempt} - info:`, info);
      if (
        info &&
        info.accepted &&
        info.accepted.length > 0 &&
        (!info.rejected || info.rejected.length === 0)
      ) {
        return true;
      } else {
        console.warn(
          `Attempt ${attempt}: Email not sent properly. Retrying...`,
        );
      }
    } catch (error) {
      console.error(`Attempt ${attempt}: Error sending email:`, error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

export async function sendEmail(
  title: string,
  body: string,
  receivers: string,
  sender?: string,
  file?: Express.Multer.File,
): Promise<boolean> {
  console.log('send, title : ', title, ', receivers : ', receivers);
  body = body.replace('*|MC:SUBJECT|*', title);
  body = body.replace('*|MC_PREVIEW_TEXT|*', title);

  // console.log("process.env.USE_LOCAL_CORS : ", process.env.USE_LOCAL_CORS);

  if (process.env.NODE_ENV === 'local') {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('body', body);
    formData.append('receivers', receivers);
    if (sender) {
      formData.append('sender', sender);
    }
    console.log('file : ', file);
    if (file) {
      const blob = new Blob([file.buffer as unknown as ArrayBuffer], {
        type: file.mimetype,
      });
      console.log('blob : ', blob);
      formData.append('attachment', blob, file.originalname);
    }

    const response = await axios.post(
      `https://saas-dev-api.umodeler.com/etc/sendemail`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      },
    );

    return response.data.msg === 'success';
  } else {
    try {
      return sendEmailWithRetry(sender, title, body, receivers, file);
    } catch (error) {
      console.error('Error sending email, ', error);
      return false;
    }
  }
} */
