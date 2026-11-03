import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { extractJobDetails } from "@/lib/ai/parse-job";
import { verifyExtraction } from "@/lib/ai/verify-extraction";
import { getCurrentUser } from "@/lib/auth";
import { claimAiUse } from "@/lib/db/queries";

// Longer than the Claude call's own timeout, so that timeout always fires first.
export const maxDuration = 60;

const DAILY_LIMIT = 50;

const bodySchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Paste a job description first.")
    .max(20_000, "This job description is too long. The limit is 20,000 characters."),
});

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Route handlers don't get the origin check that Server Actions have. */
function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (!origin || !host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("Please log in again.", 401);
  }

  if (!isSameOrigin(request)) {
    return errorResponse("This request isn't allowed.", 403);
  }

  const parsedBody = bodySchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsedBody.success) {
    return errorResponse(
      parsedBody.error.issues[0].path.length > 0
        ? parsedBody.error.issues[0].message
        : "Paste a job description first.",
      400,
    );
  }

  const { text } = parsedBody.data;

  try {
    // Claimed before the call, so parallel requests can't go over the limit and
    // failed calls still count.
    if (!(await claimAiUse(user.id, DAILY_LIMIT))) {
      return errorResponse(
        `You've used all ${DAILY_LIMIT} parses for today. You can still fill in the form by hand.`,
        429,
      );
    }
  } catch {
    console.error("parse-job: couldn't check the daily limit");
    return errorResponse(
      "Couldn't read this job description. You can still fill in the form by hand.",
      500,
    );
  }

  const extraction = await extractJobDetails(text);

  if (!extraction) {
    return errorResponse(
      "Couldn't read this job description. You can still fill in the form by hand.",
      502,
    );
  }

  return NextResponse.json(verifyExtraction(extraction, text));
}
