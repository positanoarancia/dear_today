export type ContentSafetyReason =
  | "html"
  | "longLine"
  | "lowSignal"
  | "prohibited"
  | "url";

export type ContentSafetyResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reasons: ContentSafetyReason[];
    };

const URL_PATTERN =
  /(?:https?:\/\/|www\.|bit\.ly|tinyurl\.com|t\.me|open\.kakao|pf\.kakao|kakaotalk|[a-z0-9][a-z0-9-]{1,62}\.(?:com|net|org|io|co|kr|me|ly|site|shop|xyz|info|biz|online|click|link|app|dev)\b)/iu;

const HTML_TAG_PATTERN = /<\/?[a-z][a-z0-9-]*(?:\s[^<>]*)?>/iu;

const PROHIBITED_PATTERNS = [
  /시\s*발/iu,
  /씨\s*발/iu,
  /병\s*신/iu,
  /개\s*새\s*끼/iu,
  /좆/iu,
  /꺼\s*져/iu,
  /죽\s*어/iu,
  /섹\s*스/iu,
  /야\s*동/iu,
  /성\s*인\s*(?:인증|방송|용품)/iu,
  /카\s*지\s*노/iu,
  /바\s*카\s*라/iu,
  /토\s*토/iu,
  /도\s*박/iu,
  /대\s*출/iu,
  /급\s*전/iu,
  /수\s*익\s*보\s*장/iu,
  /무\s*료\s*증\s*정/iu,
  /마\s*약/iu,
  /필\s*로\s*폰/iu,
  /(?:viagra|casino|betting|porn|sex|loan|airdrop|crypto)/iu,
  /(?:fuck|shit|bitch|asshole)/iu,
];

const NORMALIZED_PROHIBITED_PATTERNS = [
  /시발/iu,
  /씨발/iu,
  /병신/iu,
  /개새끼/iu,
  /꺼져/iu,
  /죽어/iu,
  /섹스/iu,
  /야동/iu,
  /성인(?:인증|방송|용품)/iu,
  /카지노/iu,
  /바카라/iu,
  /토토/iu,
  /도박/iu,
  /대출/iu,
  /급전/iu,
  /수익보장/iu,
  /무료증정/iu,
  /마약/iu,
  /필로폰/iu,
  /(?:viagra|casino|betting|porn|sex|loan|airdrop|crypto)/iu,
  /(?:fuck|shit|bitch|asshole)/iu,
];

const MAX_LINE_LENGTH = 500;
const MAX_UNBROKEN_RUN_LENGTH = 120;
const MIN_TEXTUAL_SIGNAL_LENGTH = 8;

export function normalizeSafeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function normalizeTextForProhibitedCheck(text: string) {
  return normalizeSafeText(text)
    .normalize("NFKC")
    .replace(/[^a-z가-힣]/giu, "");
}

export function checkEntryContentSafety(text: string): ContentSafetyResult {
  const body = normalizeSafeText(text);
  const reasons = new Set<ContentSafetyReason>();

  if (URL_PATTERN.test(body)) {
    reasons.add("url");
  }

  if (HTML_TAG_PATTERN.test(body)) {
    reasons.add("html");
  }

  if (
    body.split("\n").some((line) => line.length > MAX_LINE_LENGTH) ||
    body.split(/\s+/).some((token) => token.length > MAX_UNBROKEN_RUN_LENGTH)
  ) {
    reasons.add("longLine");
  }

  const compactBody = body.replace(/\s+/g, "");
  const textualSignal = compactBody.match(/[a-z가-힣]/giu)?.join("") ?? "";
  const digitAndSymbolOnly = compactBody.length > 20 && !/[a-z가-힣]/iu.test(compactBody);

  if (
    digitAndSymbolOnly ||
    (compactBody.length > 80 && textualSignal.length < MIN_TEXTUAL_SIGNAL_LENGTH)
  ) {
    reasons.add("lowSignal");
  }

  const prohibitedBody = normalizeTextForProhibitedCheck(body);

  if (
    PROHIBITED_PATTERNS.some((pattern) => pattern.test(body)) ||
    NORMALIZED_PROHIBITED_PATTERNS.some((pattern) =>
      pattern.test(prohibitedBody),
    )
  ) {
    reasons.add("prohibited");
  }

  return reasons.size > 0
    ? { ok: false, reasons: Array.from(reasons) }
    : { ok: true };
}

export function isPublicEntryContentSafe(input: {
  authorName: string;
  body: string;
}) {
  return (
    checkEntryContentSafety(input.body).ok &&
    checkEntryContentSafety(input.authorName).ok
  );
}
