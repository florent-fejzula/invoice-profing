export function mkMoneyToWords(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;

  const rounded = Math.round((safe + Number.EPSILON) * 100) / 100;

  const denari = Math.floor(rounded);
  const deni = Math.round((rounded - denari) * 100);

  const denariWords = mkNumberToWords(denari, { gender: 'm' });
  const denariLabel = denari === 1 ? 'денар' : 'денари';

  let result: string;

  if (deni > 0) {
    const deniWords = mkNumberToWords(deni, { gender: 'm' });
    const deniLabel = deni === 1 ? 'ден' : 'дени';
    result = `${denariWords} ${denariLabel} и ${deniWords} ${deniLabel}`;
  } else {
    result = `${denariWords} ${denariLabel}`;
  }

  result = result.trim();

  // ✅ Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

type Gender = 'm' | 'f';
type Opts = { gender: Gender };

function mkNumberToWords(n: number, opts: Opts): string {
  if (!Number.isFinite(n)) return 'нула';
  n = Math.floor(Math.abs(n));

  if (n === 0) return 'нула';

  const parts: string[] = [];

  const billions = Math.floor(n / 1_000_000_000);
  n %= 1_000_000_000;
  const millions = Math.floor(n / 1_000_000);
  n %= 1_000_000;
  const thousands = Math.floor(n / 1000);
  n %= 1000;

  if (billions) {
    parts.push(chunkToWords(billions, { gender: 'm' }));
    parts.push(billions === 1 ? 'милијарда' : 'милијарди');
  }

  if (millions) {
    parts.push(chunkToWords(millions, { gender: 'm' }));
    parts.push(millions === 1 ? 'милион' : 'милиони');
  }

  if (thousands) {
    // "илјада" is feminine: една илјада, две илјади
    parts.push(chunkToWords(thousands, { gender: 'f' }));
    parts.push(thousands === 1 ? 'илјада' : 'илјади');
  }

  if (n) {
    parts.push(chunkToWords(n, opts));
  }

  // Add "и" between big part and last chunk (sounds natural)
  // e.g. "две илјади и пет" (optional stylistically)
  // We'll do it only when last chunk < 100 and there was a larger part.
  if (parts.length >= 3) {
    const lastChunk = parts[parts.length - 1];
    const hasBigUnit =
      parts.includes('илјада') ||
      parts.includes('илјади') ||
      parts.includes('милион') ||
      parts.includes('милиони') ||
      parts.includes('милијарда') ||
      parts.includes('милијарди');

    if (hasBigUnit) {
      // insert "и" before lastChunk in cases like "... илјади пет" -> "... илјади и пет"
      // We only do this when last chunk doesn't start with a hundreds word, i.e. it’s < 100-ish.
      const startsWithHundreds =
        lastChunk.startsWith('сто') ||
        lastChunk.startsWith('двеста') ||
        lastChunk.startsWith('триста') ||
        lastChunk.startsWith('четиристотини') ||
        lastChunk.startsWith('петстотини') ||
        lastChunk.startsWith('шестотини') ||
        lastChunk.startsWith('седумстотини') ||
        lastChunk.startsWith('осумстотини') ||
        lastChunk.startsWith('деветстотини');

      if (!startsWithHundreds) {
        parts.splice(parts.length - 1, 0, 'и');
      }
    }
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function chunkToWords(n: number, opts: Opts): string {
  const gender = opts.gender;

  const onesM = [
    'нула',
    'еден',
    'два',
    'три',
    'четири',
    'пет',
    'шест',
    'седум',
    'осум',
    'девет',
  ];
  const onesF = [
    'нула',
    'една',
    'две',
    'три',
    'четири',
    'пет',
    'шест',
    'седум',
    'осум',
    'девет',
  ];

  const ones = gender === 'f' ? onesF : onesM;

  const teens = [
    'десет',
    'единаесет',
    'дванаесет',
    'тринаесет',
    'четиринаесет',
    'петнаесет',
    'шеснаесет',
    'седумнаесет',
    'осумнаесет',
    'деветнаесет',
  ];

  const tens = [
    '',
    '',
    'дваесет',
    'триесет',
    'четириесет',
    'педесет',
    'шеесет',
    'седумдесет',
    'осумдесет',
    'деведесет',
  ];

  const hundreds = [
    '',
    'сто',
    'двеста',
    'триста',
    'четиристотини',
    'петстотини',
    'шестотини',
    'седумстотини',
    'осумстотини',
    'деветстотини',
  ];

  const parts: string[] = [];

  const h = Math.floor(n / 100);
  n %= 100;
  if (h) parts.push(hundreds[h]);

  if (n >= 10 && n <= 19) {
    // Macedonian often uses "сто и десет", "сто и единаесет"
    if (h) parts.push('и');
    parts.push(teens[n - 10]);
    return parts.join(' ');
  }

  const t = Math.floor(n / 10);
  const u = n % 10;

  if (t) {
    if (h) parts.push('и'); // "сто и дваесет"
    parts.push(tens[t]);
  }

  if (u) {
    if (t)
      parts.push('и'); // "дваесет и пет"
    else if (h) parts.push('и'); // "сто и пет"
    parts.push(ones[u]);
  }

  return parts.join(' ').trim();
}
