import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Terms } from 'src/etc/entities/terms.entity';
import { Qna } from 'src/etc/entities/qna.entity';
import { Partner } from 'src/etc/entities/partner.entity';
import { Youtube } from 'src/etc/entities/youtube.entity';

@Injectable()
export class EtcService {
  constructor(
    @InjectRepository(Terms)
    private termsRepository: Repository<Terms>,
    @InjectRepository(Qna)
    private readonly qnaRepository: Repository<Qna>,
    @InjectRepository(Partner)
    private readonly partnerRepository: Repository<Partner>,
    @InjectRepository(Youtube)
    private readonly youtubeRepository: Repository<Youtube>,
  ) { }

  // 전체 약관(모든 항목 및 언어)을 불러오기
  async getTerms(): Promise<Terms[]> {
    return this.termsRepository.find();
  }

  /**
   * 특정 약관(탭)과 언어에 해당하는 데이터를 저장(업데이트 또는 생성)
   * 예시 요청 데이터:
   * {
   *   term: "이용약관",
   *   lang: "ko",
   *   subTitle: "서브 타이틀 내용",
   *   content: "본문 내용"
   * }
   */
  async saveTerm(data: { term: string; lang: string; subTitle: string; content: string }): Promise<Terms> {
    let termEntry = await this.termsRepository.findOne({
      where: { term: data.term, lang: data.lang },
    });
    if (termEntry) {
      // 이미 존재하면 업데이트
      termEntry.subTitle = data.subTitle;
      termEntry.content = data.content;
    } else {
      // 없으면 새로 생성
      termEntry = this.termsRepository.create(data);
    }
    return this.termsRepository.save(termEntry);
  }

  // 전체 QNA 항목을 조회
  async getQNA(): Promise<Qna[]> {
    return this.qnaRepository.find();
  }

  /**
   * 전달받은 { [name]: email } 형태의 데이터를
   * 기존 데이터 전부를 대체하도록 저장 (전체 갱신)
   */
  async patchQNA(data: Qna[]): Promise<Qna[]> {
    // 기존 데이터 삭제 (전체 갱신)
    await this.qnaRepository.clear();
    console.log("data : ", data);
    // 새로운 데이터 생성
    const newEntries = data.map(qna => {
      return this.qnaRepository.create({ name: qna.name, email: qna.email, eng: qna.eng });
    });
    await this.qnaRepository.save(newEntries);
    return data;
  }

  // 전체 Partner 항목을 조회
  async getPartner(): Promise<Partner[]> {
    return this.partnerRepository.find();
  }

  /**
   * 전달받은 { [name]: email } 형태의 데이터를
   * 기존 데이터 전부를 대체하도록 저장 (전체 갱신)
   */
  async patchPartner(data: { [key: string]: string }): Promise<{ [key: string]: string }> {
    // 기존 데이터 삭제 (전체 갱신)
    await this.partnerRepository.clear();
    // 새로운 데이터 생성
    const newEntries = Object.entries(data).map(([name, email]) => {
      return this.partnerRepository.create({ name, email });
    });
    await this.partnerRepository.save(newEntries);
    return data;
  }

  // GET /etc/youtube - 전체 유튜브 링크 조회
  async getYoutube(): Promise<Youtube[]> {
    return this.youtubeRepository.find();
  }

  // PATCH /etc/youtube
  async patchYoutube(data: Youtube): Promise<Youtube> {
    return await this.youtubeRepository.save(data);
  }

  // DELETE /etc/youtube/:id - 특정 유튜브 링크 삭제 (옵션)
  async deleteYoutube(id: number): Promise<void> {
    await this.youtubeRepository.delete(id);
  }

  
}