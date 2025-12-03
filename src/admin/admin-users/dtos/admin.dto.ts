/**
 * 관리자 정보 응답 DTO
 */
export class AdminDto {
    /** 관리자 ID */
    id: number;
    
    /** 사용자 ID */
    userId: number;
    
    /** 이메일 주소 */
    email: string;
    
    /** 관리자 이름 */
    name: string;
    
    /** 부서 */
    department: string;
    
    /** 권한 레벨 */
    authority: number;
    
    /** 생성 일시 */
    createdAt: Date;
    
    /** 수정 일시 */
    updatedAt: Date;
}
