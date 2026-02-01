/**
 * 태그 시스템 상수 (대장르/부장르)
 * 
 * 분리 날짜: 2025-01-28
 * 원본 위치: App.jsx 라인 3704-3738
 * 
 * 사용법:
 * import { MAJOR_GENRES, SUB_GENRES } from './src/constants';
 */

// ═══════════════════════════════════════════════════════════════
// 🏷️ 대장르 (작품의 주 배경/세계관)
// ═══════════════════════════════════════════════════════════════
export const MAJOR_GENRES = [
  "판타지", "현대판타지", "무협", "선협", "로맨스", "로맨스판타지", 
  "게임판타지", "퓨전", "SF", "미스터리", "공포/스릴러", "호러",
  "대체역사", "라이트노벨", "현대", "현대물", "사극", "시대물",
  "BL", "GL", "백합", "하이판타지", "다크판타지", "스팀펑크",
  "사이버펑크", "포스트아포칼립스", "밀리터리", "스포츠물", "일상물",
  // 추가
  "퓨전판타지", "퓨전펑크", "디젤펑크", "스페이스오페라", "동양판타지",
  "한국식이세계물", "코즈믹호러", "피카레스크"
];

// ═══════════════════════════════════════════════════════════════
// 🏷️ 부장르 (핵심 소재/클리셰)
// ═══════════════════════════════════════════════════════════════
export const SUB_GENRES = [
  // 시작 소재
  "회귀", "환생", "빙의", "전생", "차원이동", "귀환", "타임슬립", "타임루프",
  "평행세계", "리셋", "각성", "무한회귀", "무한환생", "기억상실",
  // 세계관/배경
  "헌터", "아카데미", "던전", "게이트", "탑", "길드", "영지경영", "내정",
  "아포칼립스", "좀비", "가상현실", "이세계", "게임세계", "소설속세계",
  "랜덤박스", "가챠", "클리어조건", "탑등반", "미궁", "영지물",
  // 클리셰/소재
  "성장", "먼치킨", "천재", "사이다", "복수", "하렘", "역하렘", "궁극기",
  "성좌", "시스템", "스탯창", "레이드", "솔플", "착각물", "오해물",
  "숨겨진실력", "약빨", "사기스킬", "유일무이", "최초", "전설급",
  "생존", "모험", "지략싸움", "정치싸움", "경영",
  // 직업/신분
  "재벌", "연예계", "아이돌", "스포츠", "요리", "의사", "마법사",
  "검사", "궁수", "힐러", "소환사", "넥서맨서", "천마", "망나니", "황녀/황자",
  "공작/후작", "기사", "용사", "마왕", "마검사", "만능형", "서포터",
  "탱커", "딜러", "암살자", "도적", "연금술사", "대장장이", "상인",
  "사역마", "신의사도", "종교인", "전문가", "스승", "제자", "귀부인",
  // 특수 소재
  "육아", "메카", "특촬", "패러디", "오마쥬요소", "작중작", "괴이", "괴담",
  "기믹", "암타"
];

// ═══════════════════════════════════════════════════════════════
// 📁 인물 태그 카테고리 (조합 가능)
// ═══════════════════════════════════════════════════════════════
export const CHARACTER_CATEGORIES = {
  // 인물 대상 (조합 prefix)
  "대상": [
    "주인공", "히로인", "조연", "악역", "빌런", "엑스트라", "NPC", 
    "여주인공", "더블주인공", "라이벌"
  ],
  // 인물 특성 (조합 suffix)
  "성향/성격": [
    "먼치킨", "천재", "둔재", "강캐", "약캐", "성장형", "사기캐", "만능캐",
    "다정남", "츤데레", "냉철남", "쿨남", "상남자", "플레이보이", "하남자",
    "얀데레", "메가데레", "쿨데레", "보이시", "청순", "도도", "상처녀",
    "4차원", "천연", "완벽남", "차도남", "훈남",
    "비련의주인공", "고뇌형", "낙천형", "복수귀", "광기", "이중인격",
    "똑똑한", "묵직한", "가벼운", "약한"
  ],
  // 인물 상태/배경
  "상태/배경": [
    "병약", "시한부", "입양된", "입양한", "사생아", "재혼", "약혼", "계약"
  ]
};

// 조합식 태그 생성 헬퍼 (v2.8: 공백으로 자연스럽게 연결)
export const COMBO_TAG_TARGETS = CHARACTER_CATEGORIES["대상"];
export const COMBO_TAG_TRAITS = CHARACTER_CATEGORIES["성향/성격"];

// ═══════════════════════════════════════════════════════════════
// 🎭 태그 속성 시스템 (긍정/부정/중립)
// ═══════════════════════════════════════════════════════════════
export const TAG_SENTIMENT = {
  POSITIVE: "positive",   // 👍 긍정적 (선호하는 요소)
  NEGATIVE: "negative",   // 👎 부정적 (기피하는 요소)
  NEUTRAL: "neutral",     // ⚖️ 중립 (판단 유보)
};

// ═══════════════════════════════════════════════════════════════
// 📚 태그 alias 맵핑 (약어 → 정식명)
// ═══════════════════════════════════════════════════════════════
export const TAG_ALIASES = {
  // 장르 약어
  "현판": "현대판타지",
  "로판": "로맨스판타지",
  "무회": "무한회귀",
  "정판": "판타지",        // 정통 판타지
  "하판": "하이판타지",
  "다판": "다크판타지",
  "퓨판": "퓨전판타지",
  "게판": "게임판타지",
  
  // 클리셰 약어  
  "빙회": "빙의회귀",
  "환회": "환생회귀",
  "무한환생": "무한회귀",
  
  // 캐릭터 약어
  "성장형주인공": "성장형 주인공",
  "먼치킨주인공": "먼치킨 주인공",
  
  // 평가 약어
  "갓작": "명작",
  "인생작": "레전드",
};

// 역방향 alias 맵 생성 (정식명 → [약어들])
export const TAG_REVERSE_ALIASES = {};
for (const [alias, canonical] of Object.entries(TAG_ALIASES)) {
  if (!TAG_REVERSE_ALIASES[canonical]) {
    TAG_REVERSE_ALIASES[canonical] = [];
  }
  TAG_REVERSE_ALIASES[canonical].push(alias);
}

// ═══════════════════════════════════════════════════════════════
// 📊 스펙트럼 그룹 정의
// ═══════════════════════════════════════════════════════════════
export const TAG_SPECTRUM_GROUPS = {
  // 주인공 강함 스펙트럼
  "protagonist_power": {
    name: "주인공 강함",
    description: "주인공의 능력 수준",
    tags: ["약한주인공", "성장형", "천재", "먼치킨", "만능캐"],
  },
  
  // 분위기 스펙트럼
  "mood_tone": {
    name: "분위기",
    description: "작품의 전반적인 톤",
    tags: ["피폐", "무거운분위기", "시리어스", "가벼운분위기", "따뜻함", "라이트함"],
  },
  
  // 로맨스 강도 스펙트럼
  "romance_level": {
    name: "로맨스 강도",
    description: "로맨스 요소의 비중",
    tags: ["노맨스", "순애", "러브라인강함", "하렘", "역하렘"],
  },
  
  // 전개 속도 스펙트럼
  "pacing": {
    name: "전개 속도",
    description: "스토리 진행 속도",
    tags: ["느린템포", "슬로우번", "안정전개", "페이스빠름", "속전속결"],
  },
  
  // 평가 스펙트럼
  "quality": {
    name: "평가",
    description: "작품 완성도 평가",
    tags: ["졸작", "가작", "수작", "명작", "레전드"],
  },
  
  // 결말 만족도 스펙트럼
  "ending_satisfaction": {
    name: "결말 만족도",
    description: "결말의 완성도",
    tags: ["후반부붕괴", "사두용미", "용두용미", "결말아쉬움", "해피엔딩", "트루엔딩"],
  },
};

// ═══════════════════════════════════════════════════════════════
// 📛 작품 식별자 (태그가 아닌 별명)
// ═══════════════════════════════════════════════════════════════
export const WORK_IDENTIFIERS = [
  "하늑", "전독시", "죽사헌", "배본블", "멸세사", "멸이세",
  "회수선", "광마", "나혼렙", "템빨", "오메르", "소오강호",
  "화무십", "삼검", "어바등", "무회썰", "변경검성", "회모장",
  "시불", "말영회", "시하",
];

// ═══════════════════════════════════════════════════════════════
// 📐 태그 좌표계 시스템 (v3.2.0)
// - x축: 의미적 위치 (상반 스펙트럼) 0~1
// - y축: 뉘앙스 강도 (표현의 세기) 0~1
// ═══════════════════════════════════════════════════════════════
export const DEFAULT_COORDINATE_SYSTEMS = {
  // 주인공 강함 좌표계
  "coord_strength": {
    id: "coord_strength",
    name: "주인공 강함",
    xAxis: { negative: "약함", positive: "강함" },
    yAxis: { negative: "순한 표현", positive: "강한 표현" },
    tags: {
      "약한주인공": { x: 0.0, y: 0.5 },
      "약골": { x: 0.0, y: 0.7 },
      "찐따": { x: 0.0, y: 0.9 },
      "성장형": { x: 0.25, y: 0.5 },
      "평범": { x: 0.3, y: 0.4 },
      "유능": { x: 0.5, y: 0.5 },
      "천재": { x: 0.6, y: 0.5 },
      "능력자": { x: 0.65, y: 0.5 },
      "강함": { x: 0.75, y: 0.5 },
      "강캐": { x: 0.75, y: 0.6 },
      "먼치킨": { x: 1.0, y: 0.5 },
      "사기캐": { x: 1.0, y: 0.7 },
      "치트키": { x: 1.0, y: 0.85 },
      "만능캐": { x: 1.0, y: 0.9 },
    },
    isDefault: true,
    createdAt: 0,
  },
  
  // 분위기 좌표계
  "coord_mood": {
    id: "coord_mood",
    name: "분위기",
    xAxis: { negative: "어두움", positive: "밝음" },
    yAxis: { negative: "순한 표현", positive: "강한 표현" },
    tags: {
      "피폐": { x: 0.0, y: 0.9 },
      "암울": { x: 0.1, y: 0.7 },
      "우울": { x: 0.15, y: 0.5 },
      "무거운분위기": { x: 0.2, y: 0.6 },
      "시리어스": { x: 0.35, y: 0.6 },
      "잔잔": { x: 0.5, y: 0.3 },
      "담백": { x: 0.5, y: 0.4 },
      "가벼운분위기": { x: 0.65, y: 0.5 },
      "따뜻함": { x: 0.75, y: 0.4 },
      "밝음": { x: 0.8, y: 0.5 },
      "라이트함": { x: 0.85, y: 0.5 },
      "유쾌": { x: 0.9, y: 0.6 },
      "개그": { x: 1.0, y: 0.8 },
      "코믹": { x: 1.0, y: 0.7 },
    },
    isDefault: true,
    createdAt: 0,
  },
  
  // 로맨스 좌표계
  "coord_romance": {
    id: "coord_romance",
    name: "로맨스",
    xAxis: { negative: "없음/약함", positive: "강함/중심" },
    yAxis: { negative: "순한 표현", positive: "강한 표현" },
    tags: {
      "노맨스": { x: 0.0, y: 0.5 },
      "노로맨스": { x: 0.0, y: 0.5 },
      "순애": { x: 0.4, y: 0.4 },
      "서브로맨스": { x: 0.45, y: 0.5 },
      "로맨스": { x: 0.6, y: 0.5 },
      "러브라인강함": { x: 0.75, y: 0.6 },
      "달달": { x: 0.7, y: 0.5 },
      "역하렘": { x: 0.9, y: 0.7 },
      "하렘": { x: 1.0, y: 0.7 },
    },
    isDefault: true,
    createdAt: 0,
  },
  
  // 전개 속도 좌표계
  "coord_pacing": {
    id: "coord_pacing",
    name: "전개 속도",
    xAxis: { negative: "느림", positive: "빠름" },
    yAxis: { negative: "순한 표현", positive: "강한 표현" },
    tags: {
      "느린템포": { x: 0.1, y: 0.5 },
      "슬로우번": { x: 0.15, y: 0.6 },
      "안정전개": { x: 0.5, y: 0.5 },
      "적당함": { x: 0.5, y: 0.4 },
      "페이스빠름": { x: 0.8, y: 0.6 },
      "빠른전개": { x: 0.85, y: 0.5 },
      "속전속결": { x: 1.0, y: 0.75 },
      "사이다": { x: 0.9, y: 0.7 },
    },
    isDefault: true,
    createdAt: 0,
  },
};

// ═══════════════════════════════════════════════════════════════
// 📁 일반 태그 (카테고리별 정리) - 확장 버전
// ═══════════════════════════════════════════════════════════════
export const GENERAL_TAGS = {
  "📖 시점/인칭": [
    "1인칭", "3인칭", "전지적시점", "제한적시점", "다중시점", "옴니버스시점",
    "관찰자시점", "주인공시점", "조연시점", "회상형식", "주인공미등장에피있음"
  ],
  "🎭 분위기/톤": [
    "힐링", "일상", "코미디", "진지", "다크", "피폐", "감동", "잔잔함",
    "긴장감", "스릴", "웃김", "달달", "설렘", "애절", "우울", "공포",
    "그로테스크", "잔인", "따뜻함", "훈훈", "시리어스", "라이트함",
    "몰입감", "페이스빠름", "호쾌함", "통쾌함", "씁쓸함", "여운",
    "가벼운분위기", "무거운분위기", "무거운깊이감", "가벼운깊이감",
    "철학적", "도파민", "고구마", "딸깍", "B급감성", "B급감성약간"
  ],
  "📝 문체/서술": [
    "유려한문체", "깔끔한문체", "감성적인문체", "재치있는서술",
    "전투씬좋음", "설정좋음", "연출", "주인공중심"
  ],
  "⚡ 전개/구성": [
    "슬로우번", "속전속결", "장편", "단편", "옴니버스", "옴니버스식구성", "군상극", 
    "회차많음", "완결", "연재중", "휴재", "드롭", "급전개", "안정전개",
    "반전", "복선", "떡밥회수", "열린결말", "해피엔딩", "새드엔딩",
    "트루엔딩", "멀티엔딩", "루트분기", "본편완결", "시즌제",
    "외전有", "외전연재중", "외전완결", "장편외전", "단편외전", "에필로그",
    "느린템포", "루즈구간있음", "파워인플레이션",
    "작은스케일", "큰스케일", "방대한세계관"
  ],
  "💕 로맨스": [
    "순애", "삼각관계", "짝사랑", "계약결혼", "정략결혼", "재회",
    "첫사랑", "연상", "연하", "밀당", "집착", "러브라인강함", "노맨스",
    "소꿉친구", "원수커플", "주종관계", "선후배", "동료", "라이벌",
    "츤데레공략", "냉미남공략", "흑화", "구원서사", "치유서사",
    "비밀연애", "신분차이", "불륜", "NTR주의", "순정", "성인씬",
    "페어", "히로인유기", "히로인분양", "캣파이트", "후회", "오해",
    "히로인2명이상", "히로인3명이상", "히로인4명이상", "히로인5명이상",
    "하렘엔딩", "순애엔딩", "정실있음"
  ],
  "👤 캐릭터(기본)": [
    "여주", "남주", "조연", "악역", "빌런", "엑스트라", "NPC",
    "강캐", "약캐", "먼치킨", "성장형", "천재", "둔재", "사기캐",
    "다정남", "츤데레", "냉철남", "쿨남", "상남자", "플레이보이",
    "얀데레", "메가데레", "쿨데레", "보이시", "청순", "도도",
    "4차원", "천연", "완벽남", "차도남", "훈남", "만능캐",
    "비련의주인공", "고뇌형", "낙천형", "복수귀", "광기", "이중인격",
    "인외", "하남자", "상처녀", "똑똒한주인공", "똑똒한등장인물",
    "약한주인공", "묵직한주인공", "가벼운주인공",
    "여주인공", "더블주인공", "내면성장", "능력성장"
  ],
  "🌍 세계관": [
    "중세", "근대", "현대", "미래", "동양풍", "서양풍", "한국배경",
    "일본배경", "중국배경", "서양배경", "학교", "회사", "군대",
    "왕국", "제국", "공화국", "무림", "강호", "마탑", "교회",
    "우주", "행성", "함선", "지하도시", "폐허", "섬", "바다",
    "하늘", "이계", "지옥", "천국", "신계", "마계", "요정계"
  ],
  "✨ 판타지요소": [
    "마법", "검술", "무공", "내공", "기공", "오러", "마나",
    "스킬", "능력", "초능력", "정령", "소환수", "드래곤", "엘프",
    "드워프", "오크", "언데드", "뱀파이어", "수인", "신", "악마",
    "요정", "인어", "거인", "고블린", "트롤", "늑대인간", "리치",
    "골렘", "호문클루스", "키메라", "불사조", "유니콘", "그리폰",
    "슬라임", "미믹", "보스몬스터", "레이드보스", "월드보스"
  ],
  "⚔️ 무협요소": [
    "사파", "정파", "마교", "문파", "세가", "방파", "표국",
    "협객", "검객", "도사", "비급", "내공", "경공", "암기",
    "독공", "혈공", "기문둔갑", "의선", "협녀", "무당", "소림",
    "화산", "개방", "천하제일", "무림맹", "흑도", "백도", "중원",
    "강북", "강남", "관외", "마두", "교주", "장문인", "장로"
  ],
  "🏙️ 현대요소": [
    "재벌", "대기업", "스타트업", "연예계", "방송", "유튜버", "스트리머",
    "e스포츠", "축구", "야구", "농구", "격투기", "요리", "예술",
    "음악", "밴드", "아이돌", "배우", "모델", "작가", "웹툰작가",
    "프로게이머", "투자", "주식", "코인", "부동산", "도박", "카지노",
    "조폭", "범죄", "형사", "검사", "변호사", "정치", "군인", "용병",
    "경영", "갤러리"
  ],
  "🔞 특수태그": [
    "TS", "오메가버스", "하렘", "역하렘", "폴리아모리",
    "성인", "15금", "전연령", "노로맨스", "브로맨스",
    "ABO", "알파", "베타", "오메가", "페이크", "진성",
    "동성애", "이성애", "무성애", "젠더리스", "논바이너리",
    "수인화", "의인화", "인외", "로봇", "안드로이드", "AI", "클론",
    "남존여비", "여존남비", "근친"
  ],
  "⭐ 퀄리티/평가": [
    "명작", "수작", "가작", "졸작", "호불호", "취향타는", "대중적",
    "마니아", "컬트", "레전드", "인생작", "재탕", "표절의혹",
    "문체좋음", "전개좋음", "캐릭터좋음", "설정좋음", "세계관좋음",
    "후반부붕괴", "용두사미", "떡밥미회수", "결말아쉬움", "정주행각",
    "캐빨", "사두용미", "용두용미"
  ],
  "📅 연도/시기": [
    "2024", "2025", "2026"
  ]
};

// ═══════════════════════════════════════════════════════════════
// 🎭 기본 태그 속성 분류 (사용자가 설정에서 변경 가능)
// ═══════════════════════════════════════════════════════════════
export const DEFAULT_TAG_SENTIMENTS = {
  // 🎯 기준: 작품 완성도를 올리느냐/깎느냐만 판단
  
  // ═══ 긍정적 태그 (작품 완성도 UP) ═══
  "명작": TAG_SENTIMENT.POSITIVE,
  "수작": TAG_SENTIMENT.POSITIVE,
  "가작": TAG_SENTIMENT.POSITIVE,
  "레전드": TAG_SENTIMENT.POSITIVE,
  "인생작": TAG_SENTIMENT.POSITIVE,
  "정주행각": TAG_SENTIMENT.POSITIVE,
  "대중적": TAG_SENTIMENT.POSITIVE,
  "문체좋음": TAG_SENTIMENT.POSITIVE,
  "전개좋음": TAG_SENTIMENT.POSITIVE,
  "캐릭터좋음": TAG_SENTIMENT.POSITIVE,
  "설정좋음": TAG_SENTIMENT.POSITIVE,
  "세계관좋음": TAG_SENTIMENT.POSITIVE,
  "유려한문체": TAG_SENTIMENT.POSITIVE,
  "깔끔한문체": TAG_SENTIMENT.POSITIVE,
  "전투씬좋음": TAG_SENTIMENT.POSITIVE,
  "재치있는서술": TAG_SENTIMENT.POSITIVE,
  "방대한세계관": TAG_SENTIMENT.POSITIVE,
  "몰입감": TAG_SENTIMENT.POSITIVE,
  "떡밥회수": TAG_SENTIMENT.POSITIVE,
  "반전": TAG_SENTIMENT.POSITIVE,
  "복선": TAG_SENTIMENT.POSITIVE,
  "여운": TAG_SENTIMENT.POSITIVE,
  "사두용미": TAG_SENTIMENT.POSITIVE,
  "용두용미": TAG_SENTIMENT.POSITIVE,
  
  // ═══ 부정적 태그 (작품 완성도 DOWN) ═══
  "졸작": TAG_SENTIMENT.NEGATIVE,
  "후반부붕괴": TAG_SENTIMENT.NEGATIVE,
  "용두사미": TAG_SENTIMENT.NEGATIVE,
  "떡밥미회수": TAG_SENTIMENT.NEGATIVE,
  "결말아쉬움": TAG_SENTIMENT.NEGATIVE,
  "표절의혹": TAG_SENTIMENT.NEGATIVE,
  "캐빨": TAG_SENTIMENT.NEGATIVE,
  "루즈구간있음": TAG_SENTIMENT.NEGATIVE,
  "파워인플레이션": TAG_SENTIMENT.NEGATIVE,
  
  // 언급 없는 태그들은 중립(neutral)으로 처리됨
};

// ═══════════════════════════════════════════════════════════════
// 🎨 태그 속성별 색상/라벨
// ═══════════════════════════════════════════════════════════════
export const SENTIMENT_COLORS = {
  [TAG_SENTIMENT.POSITIVE]: { bg: "#dcfce7", text: "#166534", border: "#22c55e", emoji: "👍", label: "긍정" },
  [TAG_SENTIMENT.NEGATIVE]: { bg: "#fee2e2", text: "#991b1b", border: "#ef4444", emoji: "👎", label: "부정" },
  [TAG_SENTIMENT.NEUTRAL]: { bg: "#f3f4f6", text: "#374151", border: "#9ca3af", emoji: "⚖️", label: "중립" },
};

// ═══════════════════════════════════════════════════════════════
// 🔧 태그 헬퍼 함수들
// ═══════════════════════════════════════════════════════════════
export function getTagSentiment(tag, customSentiments = {}) {
  if (customSentiments[tag]) return customSentiments[tag];
  if (DEFAULT_TAG_SENTIMENTS[tag]) return DEFAULT_TAG_SENTIMENTS[tag];
  return TAG_SENTIMENT.NEUTRAL;
}

export function isTagMajor(tag, tagAttributes = {}, userMajorGenres = []) {
  if (tagAttributes[tag]?.isMajor !== undefined) return tagAttributes[tag].isMajor;
  return MAJOR_GENRES.includes(tag) || userMajorGenres.includes(tag);
}

export function isTagSub(tag, tagAttributes = {}, userSubGenres = []) {
  if (tagAttributes[tag]?.isSub !== undefined) return tagAttributes[tag].isSub;
  return SUB_GENRES.includes(tag) || userSubGenres.includes(tag);
}

export function getAllMajorTags(tagAttributes = {}, userMajorGenres = []) {
  const result = new Set();
  MAJOR_GENRES.forEach(t => result.add(t));
  userMajorGenres.forEach(t => result.add(t));
  for (const [tag, attrs] of Object.entries(tagAttributes)) {
    if (attrs.isMajor === true) result.add(tag);
    else if (attrs.isMajor === false) result.delete(tag);
  }
  return Array.from(result);
}

export function getAllSubTags(tagAttributes = {}, userSubGenres = []) {
  const result = new Set();
  SUB_GENRES.forEach(t => result.add(t));
  userSubGenres.forEach(t => result.add(t));
  for (const [tag, attrs] of Object.entries(tagAttributes)) {
    if (attrs.isSub === true) result.add(tag);
    else if (attrs.isSub === false) result.delete(tag);
  }
  return Array.from(result);
}

// ═══════════════════════════════════════════════════════════════
// 🔧 조합식 태그 관리
// ═══════════════════════════════════════════════════════════════
export function isComboTag(tag) {
  if (!tag) return false;
  return tag.includes("+") || (tag.includes(" ") && COMBO_TAG_TRAITS.some(t => tag.startsWith(t)));
}

export function parseComboTag(tag) {
  if (!tag || !tag.includes("+")) return null;
  const parts = tag.split("+");
  if (parts.length !== 2) return null;
  return { trait: parts[0].trim(), target: parts[1].trim() };
}

export function createComboTag(trait, target) {
  if (!trait || !target) return null;
  return \`\${trait}+\${target}\`;
}

export function deduplicateTags(tags) {
  const seen = new Set();
  const result = [];
  for (const tag of tags) {
    const normalized = tag.trim().toLowerCase();
    if (!seen.has(normalized) && tag.trim()) {
      seen.add(normalized);
      result.push(tag.trim());
    }
  }
  return result;
}

export function getAllDefaultTagsDeduped() {
  const all = [...MAJOR_GENRES, ...SUB_GENRES];
  for (const categoryTags of Object.values(GENERAL_TAGS)) {
    all.push(...categoryTags);
  }
  return deduplicateTags(all);
}

// 평탄화된 태그 배열
export const ALL_GENERAL_TAGS = Object.values(GENERAL_TAGS).flat();
export const ALL_DEFAULT_TAGS = [...MAJOR_GENRES, ...SUB_GENRES, ...ALL_GENERAL_TAGS];

// ═══════════════════════════════════════════════════════════════
// 🔧 태그 v5.0 헬퍼 함수들
// ═══════════════════════════════════════════════════════════════

/**
 * 태그 정규화 (alias → canonical)
 */
export function normalizeTag(tag) {
  if (!tag) return "";
  const trimmed = tag.trim();
  return TAG_ALIASES[trimmed] || trimmed;
}

/**
 * 검색어 확장 (canonical + 모든 alias)
 */
export function expandTagForSearch(tag) {
  if (!tag) return [];
  const normalized = normalizeTag(tag);
  const variants = [normalized, tag];
  
  const reverseAliases = TAG_REVERSE_ALIASES[normalized];
  if (reverseAliases) {
    variants.push(...reverseAliases);
  }
  
  return [...new Set(variants.map(v => v.toLowerCase()))];
}

/**
 * tag_data JSON 파싱 (안전)
 */
export function parseTagData(tagDataStr) {
  if (!tagDataStr) return [];
  try {
    const parsed = JSON.parse(tagDataStr);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

/**
 * tag_data → tags 문자열 변환 (동기화용)
 */
export function tagDataToString(tagData) {
  if (!Array.isArray(tagData)) return "";
  return tagData.map(t => t.tag).join(", ");
}

/**
 * tags 문자열 → tag_data 변환 (마이그레이션용)
 */
export function tagsStringToTagData(tagsStr, defaultIntensity = 3) {
  if (!tagsStr) return [];
  const tags = tagsStr.split(",").map(t => t.trim()).filter(Boolean);
  return tags.map(tag => ({
    tag: normalizeTag(tag),
    intensity: defaultIntensity,
  }));
}

/**
 * 스펙트럼 분석
 */
export function analyzeSpectrum(tagData, spectrumId) {
  const spectrum = TAG_SPECTRUM_GROUPS[spectrumId];
  if (!spectrum || !spectrum.tags || spectrum.tags.length === 0) return null;
  
  const matches = tagData.filter(t => 
    spectrum.tags.includes(t.tag) || spectrum.tags.includes(normalizeTag(t.tag))
  );
  
  if (matches.length === 0) return null;
  
  const spectrumLength = spectrum.tags.length;
  
  if (matches.length === 1) {
    const tag = normalizeTag(matches[0].tag);
    const pos = spectrum.tags.indexOf(tag) + 1;
    const normalizedPos = pos / spectrumLength;
    return {
      type: "single",
      score: normalizedPos * matches[0].intensity,
      normalizedScore: normalizedPos * matches[0].intensity,
      tag: matches[0].tag,
      position: pos,
      intensity: matches[0].intensity,
      spectrumName: spectrum.name,
    };
  }
  
  let sumScore = 0, sumWeight = 0;
  const positions = [];
  
  for (const m of matches) {
    const tag = normalizeTag(m.tag);
    const pos = spectrum.tags.indexOf(tag) + 1;
    if (pos > 0) {
      const normalizedPos = pos / spectrumLength;
      sumScore += normalizedPos * m.intensity;
      sumWeight += m.intensity;
      positions.push({ tag: m.tag, pos, normalizedPos, intensity: m.intensity });
    }
  }
  
  return {
    type: "range",
    avgScore: sumWeight > 0 ? sumScore / sumWeight : 0,
    normalizedScore: sumWeight > 0 ? (sumScore / sumWeight) * (sumWeight / matches.length) : 0,
    tags: positions,
    spectrumName: spectrum.name,
  };
}

/**
 * 작품 식별자 여부 확인
 */
export function isWorkIdentifier(tag) {
  return WORK_IDENTIFIERS.includes(tag);
}

/**
 * novel.aliases JSON 파싱
 */
export function parseNovelAliases(aliasesStr) {
  if (!aliasesStr) return [];
  try {
    const parsed = JSON.parse(aliasesStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 태그 농도 가중 유사도 계산
 */
export function calculateTagSimilarity(tagDataA, tagDataB) {
  if (!tagDataA.length || !tagDataB.length) return 0;
  
  const mapA = new Map(tagDataA.map(t => [normalizeTag(t.tag), t.intensity]));
  const mapB = new Map(tagDataB.map(t => [normalizeTag(t.tag), t.intensity]));
  
  let intersection = 0;
  let sumA = 0, sumB = 0;
  
  for (const [tag, intensityA] of mapA) {
    sumA += intensityA;
    if (mapB.has(tag)) {
      const intensityB = mapB.get(tag);
      intersection += Math.min(intensityA, intensityB);
    }
  }
  
  for (const [, intensityB] of mapB) {
    sumB += intensityB;
  }
  
  const union = sumA + sumB - intersection;
  return union > 0 ? intersection / union : 0;
}

// ═══════════════════════════════════════════════════════════════
// 📐 좌표계 시스템 헬퍼 함수들 (v3.2.0)
// ═══════════════════════════════════════════════════════════════

/**
 * 관계 분류
 */
export function categorizeRelation(xDiff, yDiff) {
  if (xDiff < 0.1 && yDiff < 0.15) return "synonym";
  if (xDiff < 0.15) return "nuance";
  if (xDiff < 0.3) return "similar";
  if (xDiff >= 0.7) return "opposite";
  return "related";
}

/**
 * 관계 라벨 (한국어)
 */
export function getRelationLabel(relation) {
  switch (relation) {
    case "synonym": return "동의어";
    case "nuance": return "뉘앙스";
    case "similar": return "유사";
    case "opposite": return "상반";
    case "related": return "관련";
    default: return "기타";
  }
}

/**
 * 두 태그 간 관계 계산
 */
export function getTagRelation(tagA, tagB, coordinateSystems) {
  if (!coordinateSystems) return null;
  
  const normalizedA = normalizeTag(tagA);
  const normalizedB = normalizeTag(tagB);
  
  for (const [sysId, sys] of Object.entries(coordinateSystems)) {
    const posA = sys.tags?.[normalizedA] || sys.tags?.[tagA];
    const posB = sys.tags?.[normalizedB] || sys.tags?.[tagB];
    
    if (!posA || !posB) continue;
    
    const xDiff = Math.abs(posA.x - posB.x);
    const yDiff = Math.abs(posA.y - posB.y);
    const distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    
    return {
      systemId: sysId,
      systemName: sys.name,
      xDiff,
      yDiff,
      distance,
      relation: categorizeRelation(xDiff, yDiff),
      relationLabel: getRelationLabel(categorizeRelation(xDiff, yDiff)),
    };
  }
  return null;
}

/**
 * 태그 정보 통합 조회
 */
export function getTagFullInfo(tag, novel, coordinateSystems) {
  const info = {
    tag,
    normalizedTag: normalizeTag(tag),
    coordinates: [],
    intensity: null,
  };
  
  if (coordinateSystems) {
    for (const [sysId, sys] of Object.entries(coordinateSystems)) {
      const pos = sys.tags?.[info.normalizedTag] || sys.tags?.[tag];
      if (pos) {
        const opposites = [];
        const similars = [];
        
        for (const [otherTag, otherPos] of Object.entries(sys.tags)) {
          if (otherTag === tag || otherTag === info.normalizedTag) continue;
          
          const xDiff = Math.abs(otherPos.x - pos.x);
          const yDiff = Math.abs(otherPos.y - pos.y);
          const dist = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
          
          if (xDiff >= 0.7) {
            opposites.push(otherTag);
          } else if (dist < 0.3) {
            similars.push(otherTag);
          }
        }
        
        info.coordinates.push({
          systemId: sysId,
          systemName: sys.name,
          x: pos.x,
          y: pos.y,
          xLabel: sys.xAxis ? (pos.x < 0.5 ? sys.xAxis.negative : sys.xAxis.positive) : "",
          yLabel: sys.yAxis ? (pos.y < 0.5 ? sys.yAxis.negative : sys.yAxis.positive) : "",
          opposites,
          similars,
        });
      }
    }
  }
  
  if (novel?.tag_data) {
    const tagData = parseTagData(novel.tag_data);
    const found = tagData.find(t => 
      t.tag === tag || t.tag === info.normalizedTag || 
      normalizeTag(t.tag) === info.normalizedTag
    );
    info.intensity = found?.intensity || null;
  }
  
  return info;
}

// ═══════════════════════════════════════════════════════════════
// 📊 태그 유틸리티 함수들
// ═══════════════════════════════════════════════════════════════

/**
 * JSON 배열 또는 단일 문자열을 배열로 파싱
 */
export function parseMajorSub(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return value ? [value] : [];
  }
}

/**
 * 태그 사용 빈도 계산 함수
 */
export function countTagUsage(novels) {
  const counts = {};
  const coOccurrences = {};
  
  for (const n of novels) {
    const tags = (n.tags || "").split(",").map(t => t.trim()).filter(Boolean);
    const majorTags = parseMajorSub(n.major_genre);
    const subTags = parseMajorSub(n.sub_genre);
    
    const allTagsInNovel = [...tags, ...majorTags, ...subTags];
    
    for (const tag of allTagsInNovel) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
    
    for (let i = 0; i < allTagsInNovel.length; i++) {
      const tagA = allTagsInNovel[i];
      if (!coOccurrences[tagA]) coOccurrences[tagA] = {};
      
      for (let j = 0; j < allTagsInNovel.length; j++) {
        if (i === j) continue;
        const tagB = allTagsInNovel[j];
        coOccurrences[tagA][tagB] = (coOccurrences[tagA][tagB] || 0) + 1;
      }
    }
  }
  
  return { counts, coOccurrences };
}

/**
 * 자주 쓰는 태그 정렬 (사용빈도순)
 */
export function sortTagsByUsage(tags, usageCounts) {
  return [...tags].sort((a, b) => {
    const countA = usageCounts[a] || 0;
    const countB = usageCounts[b] || 0;
    if (countB !== countA) return countB - countA;
    return a.localeCompare(b);
  });
}

/**
 * 작품의 대장르/부장르 추출 (태그 기반 자동 감지)
 */
export function detectGenres(tagsStr) {
  const tags = (tagsStr || "").split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
  
  let majorGenre = null;
  let subGenre = null;
  
  for (const tag of tags) {
    const found = MAJOR_GENRES.find(g => g.toLowerCase() === tag || tag.includes(g.toLowerCase()));
    if (found) {
      majorGenre = found;
      break;
    }
  }
  
  for (const tag of tags) {
    const found = SUB_GENRES.find(g => g.toLowerCase() === tag || tag.includes(g.toLowerCase()));
    if (found) {
      subGenre = found;
      break;
    }
  }
  
  return { majorGenre, subGenre };
}

// ═══════════════════════════════════════════════════════════════
// 🎨 장르 색상
// ═══════════════════════════════════════════════════════════════
export const MAJOR_GENRE_COLORS = {
  "판타지": "#6366f1",
  "현대판타지": "#3b82f6", 
  "무협": "#dc2626",
  "선협": "#b91c1c",
  "로맨스": "#ec4899",
  "로맨스판타지": "#f472b6",
  "게임판타지": "#10b981",
  "퓨전": "#8b5cf6",
  "SF": "#06b6d4",
  "미스터리": "#6b7280",
  "공포/스릴러": "#1f2937",
  "호러": "#374151",
  "대체역사": "#b45309",
  "라이트노벨": "#f59e0b",
  "현대": "#64748b",
  "현대물": "#475569",
  "사극": "#a16207",
  "시대물": "#92400e",
  "BL": "#7c3aed",
  "GL": "#be185d",
  "백합": "#db2777",
  "하이판타지": "#4f46e5",
  "다크판타지": "#1e1b4b",
  "스팀펑크": "#78350f",
  "사이버펑크": "#0891b2",
  "포스트아포칼립스": "#57534e",
  "밀리터리": "#4b5563",
  "스포츠물": "#22c55e",
  "일상물": "#34d399"
};

export const SUB_GENRE_COLORS = {
  "회귀": "#0ea5e9",
  "환생": "#14b8a6",
  "빙의": "#8b5cf6",
  "전생": "#6366f1",
  "차원이동": "#7c3aed",
  "귀환": "#0891b2",
  "타임슬립": "#0d9488",
  "타임루프": "#059669",
  "평행세계": "#4f46e5",
  "리셋": "#7c3aed",
  "각성": "#dc2626",
  "헌터": "#ef4444",
  "아카데미": "#f59e0b",
  "던전": "#84cc16",
  "게이트": "#22c55e",
  "탑": "#eab308",
  "길드": "#16a34a",
  "영지경영": "#65a30d",
  "내정": "#4d7c0f",
  "아포칼립스": "#57534e",
  "좀비": "#78716c",
  "가상현실": "#06b6d4",
  "이세계": "#8b5cf6",
  "게임세계": "#10b981",
  "소설속세계": "#d946ef",
  "성장": "#10b981",
  "먼치킨": "#f97316",
  "천재": "#3b82f6",
  "사이다": "#fbbf24",
  "복수": "#dc2626",
  "하렘": "#ec4899",
  "역하렘": "#a855f7",
  "성좌": "#6366f1",
  "시스템": "#06b6d4",
  "스탯창": "#0ea5e9",
  "레이드": "#ef4444",
  "솔플": "#f97316",
  "착각물": "#f472b6",
  "오해물": "#fb923c",
  "숨겨진실력": "#eab308",
  "사기스킬": "#f59e0b",
  "재벌": "#ca8a04",
  "연예계": "#d946ef",
  "아이돌": "#ec4899",
  "스포츠": "#22c55e",
  "요리": "#f97316",
  "의사": "#06b6d4",
  "마법사": "#8b5cf6",
  "검사": "#ef4444",
  "궁수": "#84cc16",
  "힐러": "#34d399",
  "소환사": "#a855f7",
  "넥서맨서": "#6b7280",
  "천마": "#991b1b",
  "망나니": "#b91c1c",
  "황녀/황자": "#f59e0b",
  "공작/후작": "#ca8a04",
  "기사": "#64748b",
  "용사": "#3b82f6",
  "마왕": "#7c2d12",
  "힐링": "#34d399",
  "TS": "#f472b6"
};

/**
 * 좌표계에서 태그 위치 자연어 해석
 */
export function interpretCoordinate(systemName, x, y) {
  let xDesc;
  if (x < 0.2) xDesc = "매우 낮은";
  else if (x < 0.4) xDesc = "낮은";
  else if (x < 0.6) xDesc = "중간";
  else if (x < 0.8) xDesc = "높은";
  else xDesc = "매우 높은";
  
  const yDesc = y > 0.65 ? " (강조)" : y < 0.35 ? " (순함)" : "";
  
  return \`\${xDesc} \${systemName}\${yDesc}\`;
}

/**
 * 좌표계 기반 취향 분석
 * - 각 좌표계별 평균 x좌표 (선호 위치)
 */
export function analyzeCoordinatePreference(novels, coordinateSystems) {
  if (!novels || !coordinateSystems) return {};
  
  const result = {};
  
  for (const [sysId, sys] of Object.entries(coordinateSystems)) {
    const dataPoints = [];
    
    for (const novel of novels) {
      const tagData = parseTagData(novel.tag_data);
      const rating = novel.rating || 1500;
      
      for (const td of tagData) {
        const pos = sys.tags?.[td.tag] || sys.tags?.[normalizeTag(td.tag)];
        if (pos) {
          const weight = (td.intensity || 3) / 3;
          dataPoints.push({
            x: pos.x,
            y: pos.y,
            rating,
            weight,
            intensity: td.intensity || 3,
          });
        }
      }
    }
    
    if (dataPoints.length > 0) {
      let sumX = 0, sumY = 0, sumWeight = 0;
      let sumRatingWeight = 0, sumRating = 0;
      
      for (const dp of dataPoints) {
        const w = dp.weight;
        sumX += dp.x * w;
        sumY += dp.y * w;
        sumWeight += w;
        
        const rw = (dp.rating / 1500) * w;
        sumRating += dp.x * rw;
        sumRatingWeight += rw;
      }
      
      result[sysId] = {
        systemId: sysId,
        systemName: sys.name,
        avgX: sumWeight > 0 ? sumX / sumWeight : 0.5,
        avgY: sumWeight > 0 ? sumY / sumWeight : 0.5,
        ratingWeightedX: sumRatingWeight > 0 ? sumRating / sumRatingWeight : 0.5,
        count: dataPoints.length,
        interpretation: interpretCoordinate(
          sys.name, 
          sumWeight > 0 ? sumX / sumWeight : 0.5,
          sumWeight > 0 ? sumY / sumWeight : 0.5
        ),
      };
    }
  }
  
  return result;
}
