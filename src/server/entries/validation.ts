import {
  MAX_AUTHOR_LENGTH,
  MAX_ENTRY_LENGTH,
  MIN_AUTHOR_LENGTH,
  MIN_ENTRY_LENGTH,
  type CreateEntryInput,
} from "./types";
import { checkEntryContentSafety, normalizeSafeText } from "@/lib/content-safety";

export type ValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      errors: string[];
    };

export function normalizeEntryBody(body: string) {
  return normalizeSafeText(body);
}

export function normalizeAuthorName(authorName: string) {
  return authorName.trim().replace(/\s+/g, " ");
}

function getEntryBodyErrors(bodyInput: string) {
  const errors: string[] = [];
  const body = normalizeEntryBody(bodyInput);

  if (body.length < MIN_ENTRY_LENGTH) {
    errors.push(`Entry must be at least ${MIN_ENTRY_LENGTH} characters.`);
  }

  if (body.length > MAX_ENTRY_LENGTH) {
    errors.push(`Entry must be ${MAX_ENTRY_LENGTH} characters or fewer.`);
  }

  const safety = checkEntryContentSafety(body);

  if (!safety.ok) {
    if (safety.reasons.includes("url")) {
      errors.push("Public notes cannot include links.");
    }

    if (safety.reasons.includes("html")) {
      errors.push("HTML tags cannot be included in notes.");
    }

    if (safety.reasons.includes("longLine")) {
      errors.push("Please split very long lines before posting.");
    }

    if (safety.reasons.includes("lowSignal")) {
      errors.push("Please write a little more in words before posting.");
    }

    if (safety.reasons.includes("prohibited")) {
      errors.push("This note includes words that cannot be posted publicly.");
    }
  }

  return errors;
}

export function validateCreateEntry(input: CreateEntryInput): ValidationResult {
  const errors = getEntryBodyErrors(input.body);
  const authorName = normalizeAuthorName(input.owner.authorName);

  if (authorName.length < MIN_AUTHOR_LENGTH) {
    errors.push(`Author name must be at least ${MIN_AUTHOR_LENGTH} characters.`);
  }

  if (authorName.length > MAX_AUTHOR_LENGTH) {
    errors.push(`Author name must be ${MAX_AUTHOR_LENGTH} characters or fewer.`);
  }

  const authorSafety = checkEntryContentSafety(authorName);

  if (!authorSafety.ok) {
    if (authorSafety.reasons.includes("url")) {
      errors.push("Author name cannot include links.");
    }

    if (authorSafety.reasons.includes("html")) {
      errors.push("Author name cannot include HTML tags.");
    }

    if (authorSafety.reasons.includes("prohibited")) {
      errors.push("Author name includes words that cannot be posted publicly.");
    }
  }

  if (input.owner.kind === "guest" && input.owner.password.length < 4) {
    errors.push("Guest password must be at least 4 characters.");
  }

  if (
    input.visibility &&
    input.visibility !== "public" &&
    input.visibility !== "hidden"
  ) {
    errors.push("Visibility must be public or hidden.");
  }

  if (input.owner.kind === "guest" && input.visibility === "hidden") {
    errors.push("Guest notes cannot be hidden.");
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

export function validateEntryBody(bodyInput: string): ValidationResult {
  const errors = getEntryBodyErrors(bodyInput);

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}
