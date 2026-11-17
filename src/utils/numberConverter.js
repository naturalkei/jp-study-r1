// Utility to convert numeric amounts to Japanese Kanji, Hiragana, Korean phonetics, and English

const ONES_KANJI = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const ONES_HIRA = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
const ONES_KOR = ['', '이치', '니', '산', '욘', '고', '로쿠', '나나', '하치', '큐-'];

function numberToEnglish(n) {
  if (n === 0) return 'zero';
  const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  function helper(num) {
    let str = '';
    if (num >= 100) {
      str += units[Math.floor(num / 100)] + ' hundred ';
      num %= 100;
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + units[num % 10] : '') + ' ';
      num = 0;
    } else if (num >= 10) {
      str += teens[num - 10] + ' ';
      num = 0;
    } else if (num > 0) {
      str += units[num] + ' ';
    }
    return str.trim();
  }

  let result = '';
  if (n >= 1000000) {
    result += helper(Math.floor(n / 1000000)) + ' million ';
    n %= 1000000;
  }
  if (n >= 1000) {
    result += helper(Math.floor(n / 1000)) + ' thousand ';
    n %= 1000;
  }
  if (n > 0) {
    result += helper(n);
  }
  return result.trim();
}

// Convert under 10,000 for Japanese with authentic sound changes (音便: 음편 현상)
function convertUnder10000(num) {
  if (num === 0) return { kanji: '', hiragana: '', korean: '' };

  let kanji = '';
  let hiragana = '';
  let korean = '';

  const thousands = Math.floor(num / 1000);
  const hundreds = Math.floor((num % 1000) / 100);
  const tens = Math.floor((num % 100) / 10);
  const ones = num % 10;

  // 1. Thousands (千 - せん)
  if (thousands > 0) {
    if (thousands === 1) {
      kanji += '千';
      hiragana += 'せん';
      korean += (korean ? ' ' : '') + '센';
    } else if (thousands === 3) {
      kanji += '三千';
      hiragana += 'さんぜん';
      korean += (korean ? ' ' : '') + '산젠';
    } else if (thousands === 8) {
      kanji += '八千';
      hiragana += 'はっせん';
      korean += (korean ? ' ' : '') + '핫센';
    } else {
      kanji += ONES_KANJI[thousands] + '千';
      hiragana += ONES_HIRA[thousands] + 'せん';
      korean += (korean ? ' ' : '') + ONES_KOR[thousands] + '센';
    }
  }

  // 2. Hundreds (百 - ひゃく)
  if (hundreds > 0) {
    if (hundreds === 1) {
      kanji += '百';
      hiragana += 'ひゃく';
      korean += (korean ? ' ' : '') + '햐쿠';
    } else if (hundreds === 3) {
      kanji += '三百';
      hiragana += 'さんびゃく';
      korean += (korean ? ' ' : '') + '산뱌쿠';
    } else if (hundreds === 6) {
      kanji += '六百';
      hiragana += 'ろっぴゃく';
      korean += (korean ? ' ' : '') + '롯표쿠';
    } else if (hundreds === 8) {
      kanji += '八百';
      hiragana += 'はっぴゃく';
      korean += (korean ? ' ' : '') + '핫표쿠';
    } else {
      kanji += ONES_KANJI[hundreds] + '百';
      hiragana += ONES_HIRA[hundreds] + 'ひゃく';
      korean += (korean ? ' ' : '') + ONES_KOR[hundreds] + '햐쿠';
    }
  }

  // 3. Tens (十 - じゅう)
  if (tens > 0) {
    if (tens === 1) {
      kanji += '十';
      hiragana += 'じゅう';
      korean += (korean ? ' ' : '') + '쥬-';
    } else {
      kanji += ONES_KANJI[tens] + '十';
      hiragana += ONES_HIRA[tens] + 'じゅう';
      korean += (korean ? ' ' : '') + ONES_KOR[tens] + '쥬-';
    }
  }

  // 4. Ones (一~九)
  if (ones > 0) {
    kanji += ONES_KANJI[ones];
    hiragana += ONES_HIRA[ones];
    korean += (korean ? ' ' : '') + ONES_KOR[ones];
  }

  return {
    kanji,
    hiragana,
    korean: korean.trim(),
  };
}

export function convertNumberToJapanese(num) {
  const n = parseInt(num, 10);
  if (isNaN(n) || n < 0) {
    return {
      number: 0,
      formatted: '0',
      kanji: '零',
      hiragana: 'ぜろ',
      korean: '제로',
      english: 'zero',
      kanjiYen: '0円',
      hiraganaYen: 'ぜろえん',
      koreanYen: '제로엔',
      englishYen: '0 Yen',
    };
  }

  if (n === 0) {
    return {
      number: 0,
      formatted: '0',
      kanji: '零',
      hiragana: 'ぜろ',
      korean: '제로',
      english: 'zero',
      kanjiYen: '0円',
      hiraganaYen: 'ぜろえん',
      koreanYen: '제로엔',
      englishYen: '0 Yen',
    };
  }

  const manPart = Math.floor(n / 10000);
  const remPart = n % 10000;

  let kanji = '';
  let hiragana = '';
  let korean = '';

  if (manPart > 0) {
    const manConverted = convertUnder10000(manPart);
    // In Japanese, 10,000 must have 一万 (ichiman), never just 万 (man)
    const manPrefixKanji = manPart === 1 ? '一万' : manConverted.kanji + '万';
    const manPrefixHira = manPart === 1 ? 'いちまん' : manConverted.hiragana + 'まん';
    const manPrefixKor = manPart === 1 ? '이치만' : manConverted.korean + '만';

    kanji += manPrefixKanji;
    hiragana += manPrefixHira;
    korean += manPrefixKor;
  }

  if (remPart > 0) {
    const remConverted = convertUnder10000(remPart);
    kanji += remConverted.kanji;
    hiragana += remConverted.hiragana;
    korean += (korean ? ' ' : '') + remConverted.korean;
  }

  const formatted = n.toLocaleString('en-US');
  const cleanKorean = korean.trim();
  const cleanEnglish = numberToEnglish(n);

  return {
    number: n,
    formatted,
    kanji,
    hiragana,
    korean: cleanKorean,
    english: cleanEnglish,
    kanjiYen: `${kanji}円`,
    hiraganaYen: `${hiragana}えん`,
    koreanYen: `${cleanKorean}엔`,
    englishYen: `${formatted} Yen (${cleanEnglish} yen)`,
  };
}
