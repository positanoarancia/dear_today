import {
  MAX_AUTHOR_LENGTH,
  MAX_ENTRY_LENGTH,
  MIN_AUTHOR_LENGTH,
  MIN_ENTRY_LENGTH,
  type CreateEntryInput,
} from "./types";

export type ValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      errors: string[];
    };

export function normalizeEntryBody(body: string) {
  return body.replace(/\r\n/g, "\n").trim();
}

export function normalizeAuthorName(authorName: string) {
  return authorName.trim().replace(/\s+/g, " ");
}

export function validateCreateEntry(input: CreateEntryInput): ValidationResult {
  const errors: string[] = [];
  const body = normalizeEntryBody(input.body);
  const authorName = normalizeAuthorName(input.owner.authorName);

  if (body.length < MIN_ENTRY_LENGTH) {
    errors.push(`Entry must be at least ${MIN_ENTRY_LENGTH} characters.`);
  }

  if (body.length > MAX_ENTRY_LENGTH) {
    errors.push(`Entry must be ${MAX_ENTRY_LENGTH} characters or fewer.`);
  }

  if (authorName.length < MIN_AUTHOR_LENGTH) {
    errors.push(`Author name must be at least ${MIN_AUTHOR_LENGTH} characters.`);
  }

  if (authorName.length > MAX_AUTHOR_LENGTH) {
    errors.push(`Author name must be ${MAX_AUTHOR_LENGTH} characters or fewer.`);
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
