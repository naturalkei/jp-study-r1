# 🇯🇵 JP Study R1 (도쿄·후지산 3박 4일 속성 일본어 과외 & 테스트 웹)

[![Deploy Website to GitHub Pages](https://github.com/naturalkei/jp-study-r1/actions/workflows/deploy.yml/badge.svg)](https://github.com/naturalkei/jp-study-r1/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deploy Platform](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-brightgreen)](https://naturalkei.github.io/jp-study-r1/)
[![Privacy: 100% PII Free](https://img.shields.io/badge/Privacy-100%25%20PII%20Free-success)](docs/05_PRIVACY_AND_CONTRIBUTION.md)

> **🌐 실전 웹사이트 바로가기 (GitHub Pages)**:  
> **👉 [https://naturalkei.github.io/jp-study-r1/](https://naturalkei.github.io/jp-study-r1/)**

---

## ✈️ 프로젝트 배경 및 골든 루트 (Trip Itinerary)

본 프로젝트는 **도쿄·후지산 3박 4일 골든루트**를 여행하는 대한민국 여행객을 위한 **일본어 시작 레벨 맞춤형 초단기 속성 회화 트레이닝 & 테스트 웹 플랫폼**입니다.

```
[Day 1 (출국일)] 인천공항 ➔ 나리타 국제공항 입국심사 ➔ 가와구치코 파크 호텔 (체크인 전 짐 보관) ➔ 로손 편의점
[Day 2] 가와구치코 후지산 관광 ➔ 명물 호우토우(ほうとう) 나베 맛집 ➔ 텐조야마 로프웨이
[Day 3] 가와구치코 ➔ 도쿄 이동 ➔ 칸데오 호텔즈 우에노코엔 (스카이스파 대욕장) ➔ 우에노 아메요코 & 심야 이자카야
[Day 4 (귀국일)] 우에노 돈키호테 면세 쇼핑 ➔ 게이세이 스카이라이너 직통 ➔ 나리타 공항 귀국 보안검사
```

---

## 🛡️ 공개 프로젝트(Public) 및 개인정보 & 일정 보호 서약

본 저장소는 **완전한 오픈소스(Public)** 프로젝트로 운영됩니다:
1. **개인 식별 및 여행 일정 정보(PII) 절대 배제**: 실제 여행자의 실명, 구체적인 출국 일자 및 항공편 시간, 여권번호, 예약 확정 번호 등 일체의 개인정보가 포함되지 않으며, `D-8 ~ D-Day`, `Day 1 ~ Day 4` 등의 상대적 타임라인과 표준 플레이스홀더를 사용합니다.
2. **범용 템플릿화**: 대한민국 여행객이 가장 많이 찾는 도쿄-후지산 골든루트를 누구나 클론하여 자신만의 여행 회화 앱으로 커스터마이징할 수 있습니다.
3. **상세 가이드**: [docs/05_PRIVACY_AND_CONTRIBUTION.md](docs/05_PRIVACY_AND_CONTRIBUTION.md)

---

## 🌟 핵심 기능 (Web Features)

### 1. 📅 일자별 전용 학습실 (Dedicated Daily Studio)
- **D-8부터 D-Day까지 날짜별 전용 학습 뷰** 제공
- 아침(10분 발음), 점심(10분 퀴즈), 저녁(10분 복습) 3단계 루틴 체크리스트 (브라우저 로컬 자동 저장)
- 일자별 핵심 문장 부스터, 실전 미니 대화문, 1분 확인 미니 퀴즈 및 이전/다음 날 네비게이션

### 2. ✈️ 공항 입출국심사 & 세관검사 특강 (Immigration Clinic)
- **입국 심사대**: 지문인식/얼굴촬영 안내 음성, 심사관 4대 질문(목적, 기간, 숙소, 리턴티켓)과 0.1초 답변
- **세관 검사대**: Visit Japan Web QR 스캔, 짐 검사 대응 요령
- **보안 검색대 & 출국**: 액체류 100ml 규정, 전자기기 분리 배출, 탑승구 확인
- **인터랙티브 입국심사 시뮬레이션 게임**: 선택지에 따라 심사 통과 여부가 갈리는 실전 대화 연습

### 3. ⚡ 1초 만능 생존 치트시트
- **3대 마법 단어**: `すみません` (저기요/감사합니다), `これ、ください` (이거 주세요), `大丈夫です` (괜찮습니다)
- **5대 만능 공식**: `~는 어디인가요?`, `~부탁합니다`, `~되나요?`, `~있나요?`, `얼마인가요?`
- **엔화 계산기**: 100엔부터 10,000엔까지 터치 시 네이티브 일본어 음성(`ja-JP`) 발음 재생

### 4. 🗂️ 상황별 플래시 암기장 (Web Speech API TTS 내장)
- 카테고리별 분류: ✈️ 입출국/세관 | 🛫 공항/교통 | 🏨 호텔/숙소 | 🍜 식당/맛집 | 🛍️ 쇼핑/편의점 | 🚨 응급/긴급
- 자연스러운 한국어 독음 표기 및 "외웠어요 🌟" 암기 상태 체크
- 0.85배속(학습용) / 1.0배속(일반) TTS 발음 청취 기능

### 5. 📝 종합 실전 테스트 (상황 대처 & 청취 퀴즈)
- 공항 입국심사, 버스 발권, 호텔 짐 맡기기, 호우토우 주문, 스카이스파 등 12개 실전 문항
- 음성 청취 문항, 즉시 피드백 및 오답 해설 제공

### 6. 🎭 상황극 롤플레잉 시뮬레이션
- 매표원, 호텔리어, 식당 점원과의 4가지 씬별 대화 분기 훈련

### 7. 🎒 여행자 포켓 모드 (점원에게 직접 보여주기)
- 현지에서 말이 입 밖으로 잘 안 나올 때 스마트폰 화면을 직원에게 즉시 보여줄 수 있는 대형 카드

---

## 📚 상세 교재 및 문서 (Documentation)

- [01. 마일스톤 및 30분 데일리 루틴 가이드](docs/01_CURRICULUM_AND_ROUTINE.md)
- [02. 1초 만능 속성 회화 치트시트](docs/02_SURVIVAL_CHEATSHEET.md)
- [03. 상황별 필수 단어 및 문장 암기장](docs/03_VOCAB_AND_PHRASEBOOK.md)
- [04. 4대 핵심 롤플레잉 시뮬레이션 대화집](docs/04_TRAVEL_SIMULATION_GUIDE.md)
- [05. 개인정보 보호 및 오픈소스 가이드](docs/05_PRIVACY_AND_CONTRIBUTION.md)
- [06. 공항 입출국심사 & 세관검사 완전 정복](docs/06_IMMIGRATION_CUSTOMS_GUIDE.md)

---

## 💻 로컬 실행 방법 (Local Development)

```bash
# 1. 저장소 클론
git clone https://github.com/naturalkei/jp-study-r1.git
cd jp-study-r1

# 2. 패키지 설치
npm install

# 3. 개발 서버 실행
npm run dev

# 4. 프로덕션 빌드 테스트
npm run build
```

---

## 🚀 GitHub Pages 자동 배포 (Deployment)

본 저장소의 `.github/workflows/deploy.yml` 워크플로우를 통해 `main` 브랜치에 코드가 푸시되면 자동으로 GitHub Pages에 빌드 및 배포됩니다.

---

## 📄 라이선스 (License)

This project is open-sourced under the [MIT License](LICENSE).
