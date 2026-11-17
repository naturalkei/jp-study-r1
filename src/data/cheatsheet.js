export const cheatsheetData = {
  magicWords: [
    {
      id: 'sumimasen',
      jp: 'すみません',
      pronounce: '스미마센',
      ko: '저기요 / 죄송합니다 / 감사합니다',
      en: "Excuse me / I'm sorry / Thank you",
      tip: '식당에서 직원 부를 때, 지나가는 사람에게 길 물을 때, 좁은 통로를 지나갈 때, 물건을 건네받을 때 모두 쓰는 만능 1등 단어!',
      audio: 'すみません',
    },
    {
      id: 'kore_kudasai',
      jp: 'これ、ください',
      pronounce: '코레, 쿠다사이',
      ko: '이거 주세요',
      en: 'This one, please.',
      tip: '메뉴판, 진열장, 스마트폰 사진을 손가락으로 가리키며 말하면 주문/쇼핑의 90%가 끝납니다.',
      audio: 'これ、ください',
    },
    {
      id: 'daijoubu',
      jp: '大丈夫です',
      pronounce: '다이죠-부데스',
      ko: '괜찮습니다 (정중한 거절 / OK)',
      en: "It's fine / No, thank you.",
      tip: '편의점에서 봉투나 영수증 필요 없냐고 물을 때 손을 가볍게 내저으며 말하세요. "No thank you"의 가장 부드러운 일본어!',
      audio: '大丈夫です',
    },
  ],

  formulas: [
    {
      id: 'formula-doko',
      pattern: '【장소 / 대상】 + は どこですか？',
      pronounce: '~와 도코데스카?',
      meaning: '~은/는 어디인가요?',
      meaningEn: 'Where is [place / item]?',
      examples: [
        { jp: 'トイレはどこですか？', pronounce: '토이레와 도코데스카?', ko: '화장실은 어디인가요?', en: 'Where is the restroom?' },
        { jp: 'バス乗り場はどこですか？', pronounce: '바스 노리바와 도코데스카?', ko: '버스 타는 곳은 어디인가요?', en: 'Where is the bus stop?' },
        { jp: '免税カウンターはどこですか？', pronounce: '멘제- 카운타-와 도코데스카?', ko: '면세 카운터는 어디인가요?', en: 'Where is the tax-free counter?' },
        { jp: 'スカイライナーの乗り場はどこですか？', pronounce: '스카이라이나-노 노리바와 도코데스카?', ko: '스카이라이너 승강장은 어디인가요?', en: 'Where is the Skyliner platform?' },
      ],
    },
    {
      id: 'formula-onegaishimasu',
      pattern: '【명사】 + お願いします',
      pronounce: '~ 오네가이시마스',
      meaning: '~ 부탁합니다 / 주세요',
      meaningEn: '[Noun], please.',
      examples: [
        { jp: 'チェックイン、お願いします', pronounce: '체크인, 오네가이시마스', ko: '체크인 부탁합니다', en: 'Check-in, please.' },
        { jp: '荷物、お願いします', pronounce: '니모츠, 오네가이시마스', ko: '(체크인 전후) 짐 좀 부탁합니다', en: 'Luggage storage, please.' },
        { jp: 'お会計、お願いします', pronounce: '오카이케이, 오네가이시마스', ko: '계산서 부탁합니다', en: 'Check, please.' },
        { jp: '生ビール2つ、お願いします', pronounce: '나마비-루 후타츠, 오네가이시마스', ko: '생맥주 2잔 부탁합니다', en: 'Two draft beers, please.' },
        { jp: 'お水、お願いします', pronounce: '오미즈, 오네가이시마스', ko: '물 좀 주세요', en: 'Water, please.' },
      ],
    },
    {
      id: 'formula-dekimasuka',
      pattern: '【명사 / 행동】 + できますか？',
      pronounce: '~ 데키마스카?',
      meaning: '~ 되나요? / 할 수 있나요?',
      meaningEn: 'Can I [action] / Is [item] available?',
      examples: [
        { jp: 'カード、できますか？', pronounce: '카-도, 데키마스카?', ko: '카드 결제 되나요?', en: 'Can I pay by credit card?' },
        { jp: '免税、できますか？', pronounce: '멘제-, 데키마스카?', ko: '면세 되나요?', en: 'Is tax-free available?' },
        { jp: 'Suicaチャージ、できますか？', pronounce: '스이카 챠-지, 데키마스카?', ko: '스이카(교통카드) 충전 되나요?', en: 'Can I charge my Suica card?' },
        { jp: 'テイクアウト、できますか？', pronounce: '테이쿠아우토, 데키마스카?', ko: '포장 되나요?', en: 'Is takeout available?' },
      ],
    },
    {
      id: 'formula-arimasuka',
      pattern: '【대상】 + ありますか？',
      pronounce: '~ 아리마스카?',
      meaning: '~ 있나요?',
      meaningEn: 'Do you have [item]?',
      examples: [
        { jp: '英語のメニューはありますか？', pronounce: '에-고노 메뉴-와 아리마스카?', ko: '영어 메뉴판 있나요?', en: 'Do you have an English menu?' },
        { jp: '韓国語のメニューはありますか？', pronounce: '캉코쿠고노 메뉴-와 아리마스카?', ko: '한국어 메뉴판 있나요?', en: 'Do you have a Korean menu?' },
        { jp: 'これ、在庫ありますか？', pronounce: '코레, 자이코 아리마스카?', ko: '(사진 보여주며) 이거 재고 있나요?', en: 'Do you have this in stock?' },
        { jp: '違うサイズはありますか？', pronounce: '치가우 사이즈와 아리마스카?', ko: '다른 사이즈 있나요?', en: 'Do you have another size?' },
      ],
    },
    {
      id: 'formula-ikura',
      pattern: 'いくらですか？ / 全部でいくらですか？',
      pronounce: '이쿠라데스카? / 젠부데 이쿠라데스카?',
      meaning: '얼마인가요? / 전부 해서 얼마인가요?',
      meaningEn: 'How much is it? / How much is it in total?',
      examples: [
        { jp: 'これ、いくらですか？', pronounce: '코레, 이쿠라데스카?', ko: '이거 얼마인가요?', en: 'How much is this?' },
        { jp: '全部でいくらですか？', pronounce: '젠부데 이쿠라데스카?', ko: '전부 합쳐서 얼마인가요?', en: 'How much is it altogether?' },
      ],
    },
  ],

  numbers: [
    { num: 1, jp: '一 (いち)', pronounce: '이치', en: 'One (1)' },
    { num: 2, jp: '二 (に)', pronounce: '니', en: 'Two (2)' },
    { num: 3, jp: '三 (さん)', pronounce: '산', en: 'Three (3)' },
    { num: 4, jp: '四 (よん / し)', pronounce: '욘', en: 'Four (4)' },
    { num: 5, jp: '五 (ご)', pronounce: '고', en: 'Five (5)' },
    { num: 6, jp: '六 (ろく)', pronounce: '로쿠', en: 'Six (6)' },
    { num: 7, jp: '七 (なな / しち)', pronounce: '나나', en: 'Seven (7)' },
    { num: 8, jp: '八 (はち)', pronounce: '하치', en: 'Eight (8)' },
    { num: 9, jp: '九 (きゅう)', pronounce: '큐-', en: 'Nine (9)' },
    { num: 10, jp: '十 (じゅう)', pronounce: '쥬-', en: 'Ten (10)' },
  ],

  money: [
    { amount: 100, jp: '100円 (ひゃくえん)', pronounce: '햐쿠엔', krw: '약 900원', en: '~0.65 USD' },
    { amount: 500, jp: '500円 (ごひゃくえん)', pronounce: '고햐쿠엔', krw: '약 4,500원', en: '~3.25 USD' },
    { amount: 1000, jp: '1,000円 (せんえん)', pronounce: '센엔', krw: '약 9,000원', en: '~6.50 USD' },
    { amount: 2000, jp: '2,000円 (にせんえん)', pronounce: '니센엔', krw: '약 18,000원', en: '~13.00 USD' },
    { amount: 5000, jp: '5,000円 (ごせんえん)', pronounce: '고센엔', krw: '약 45,000원', en: '~32.50 USD' },
    { amount: 10000, jp: '10,000円 (いちまんえん)', pronounce: '이치만엔', krw: '약 90,000원', en: '~65.00 USD' },
  ],

  situations: [
    {
      title: '편의점 3대 질문 완벽 방어',
      badge: '편의점 필수',
      items: [
        {
          q: '직원: 袋はお付けしますか？ (봉투 필요하신가요?)',
          q_en: 'Staff: Would you like a plastic bag?',
          a: '괜찮을 때: 「大丈夫です (다이죠-부데스)」 / 필요할 때: 「袋お願いします (후쿠로 오네가이시마스)」',
          a_en: 'No thanks: "No bag needed, thank you." / Need bag: "One bag, please."',
        },
        {
          q: '직원: 温めますか？ (데워드릴까요?)',
          q_en: 'Staff: Would you like this heated up?',
          a: '데울 때: 「はい、お願いします (하이, 오네가이시마스)」 / 괜찮을 때: 「大丈夫です」',
          a_en: 'Yes: "Yes, please." / No: "No, thank you."',
        },
        {
          q: '직원: お箸はお付けしますか？ (젓가락 드릴까요?)',
          q_en: 'Staff: Would you like chopsticks?',
          a: '받을 때: 「2膳お願いします (니젠 오네가이시마스)」 / 괜찮을 때: 「大丈夫です」',
          a_en: 'Yes: "Two pairs, please." / No: "No, thank you."',
        },
      ],
    },
    {
      title: '식당 & 이자카야 주문',
      badge: '식당/맛집',
      items: [
        {
          q: '착석 시 인원수 말하기',
          q_en: 'Entering restaurant & party size',
          a: '「2人です (후타리데스)」 (1명이면 「1人です (히토리데스)」)',
          a_en: '"Table for two, please." (If alone: "Table for one, please.")',
        },
        {
          q: '첫 주문으로 생맥주 시키기',
          q_en: 'First order: draft beers',
          a: '「とりあえず生ビール2つお願いします (토리아에즈 나마비-루 후타츠 오네가이시마스)」',
          a_en: '"Two draft beers to start, please!"',
        },
        {
          q: '추천 요리 묻기',
          q_en: 'Asking for chef recommendation',
          a: '「おすすめは何ですか？ (오스스메와 난데스카?)」',
          a_en: '"What do you recommend here?"',
        },
        {
          q: '계산하기',
          q_en: 'Asking for the bill / check',
          a: '「お会計お願いします (오카이케이 오네가이시마스)」',
          a_en: '"Check, please. / Bill, please."',
        },
      ],
    },
    {
      title: '호텔 체크인 & 짐 보관',
      badge: '호텔/숙소',
      items: [
        {
          q: '체크인 전 짐 맡기기',
          q_en: 'Leaving luggage before check-in',
          a: '「チェックイン前に、荷物を預けることはできますか？ (체크인 마에니 니모츠오 아즈케루 코토와 데키마스카?)」',
          a_en: '"Could I leave my luggage before check-in, please?"',
        },
        {
          q: '대욕장/스파 시간 확인',
          q_en: 'Asking for spa / public bath hours',
          a: '「スパは何時から何時までですか？ (스파와 난지카라 난지마데데스카?)」',
          a_en: '"What are the spa opening hours?"',
        },
        {
          q: '수건 추가 요청',
          q_en: 'Requesting an extra towel',
          a: '「タオルをもう1枚お願いします (타오루오 모- 이치마이 오네가이시마스)」',
          a_en: '"Could I have one more towel, please?"',
        },
      ],
    },
  ],
};
