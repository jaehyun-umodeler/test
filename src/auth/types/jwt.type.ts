import { Role } from 'src/auth/types/role.type';
import { Provider } from 'src/auth/types/provider.type';

/**
 * 토큰 페이로드
 */
export interface Payload {
  /** 사용자 ID */
  sub: number;
  /** 이메일 주소 */
  email: string;
  /** 사용자 역할 */
  role: Role;
  /** 인증 제공자 */
  provider?: Provider;
  /** 인증 제공자 ID */
  providerId?: string;
}

/**
 * 액세스, 리프레시 토큰 쌍
 */
export interface TokenPair {
  /** 액세스 토큰 */
  accessToken: string;
  /** 리프레시 토큰 */
  refreshToken: string;
}
