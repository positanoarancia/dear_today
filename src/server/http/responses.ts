export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json(data, init);
}

export function badRequest(errors: string[]) {
  return Response.json(
    {
      ok: false,
      errors,
    },
    { status: 400 },
  );
}

export function serviceUnavailable(error: unknown) {
  const message =
    error instanceof Error && error.message.includes("DATABASE_URL")
      ? "Database is not configured. Add DATABASE_URL before using this endpoint."
      : "The request could not be completed.";

  return Response.json(
    {
      ok: false,
      errors: [message],
    },
    { status: 503 },
  );
}

