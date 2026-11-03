import { z } from "zod";

import { isValidDateString, latestPossibleToday } from "./dates";

export const credentialsSchema = z.object({
  email: z.email("Enter a valid email address.").trim(),
  password: z.string().min(1, "Enter your password."),
});

export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/**
 * Returns a normalised http or https URL, or null if the value isn't one.
 * A value with no scheme gets https://. Other schemes, such as javascript:, are
 * rejected. A colon followed by a digit is a port (example.com:8080), not a scheme.
 */
export function normalizeUrl(value: string) {
  const hasScheme = /^[a-z][a-z0-9+.-]*:(?!\d)/i.test(value);

  try {
    const url = new URL(hasScheme ? value : `https://${value}`);
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    return isHttp && url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
}

/** Splits comma-separated input, trims entries, and removes case-insensitive duplicates, keeping the first spelling. */
export function parseStack(value: string) {
  const seen = new Set<string>();
  const stack: string[] = [];

  for (const entry of value.split(",")) {
    const item = entry.trim();
    const key = item.toLowerCase();
    if (item && !seen.has(key)) {
      seen.add(key);
      stack.push(item);
    }
  }

  return stack;
}

const emptyToNull = (value: string) => (value === "" ? null : value);

export const applicationSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, "Enter the company.")
    .max(200, "Company can be up to 200 characters."),
  role: z
    .string()
    .trim()
    .min(1, "Enter the role.")
    .max(200, "Role can be up to 200 characters."),
  url: z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") {
        return null;
      }
      const url = normalizeUrl(value);
      if (!url) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid http or https link.",
        });
        return z.NEVER;
      }
      return url;
    }),
  stack: z.string().transform(parseStack),
  salary: z
    .string()
    .trim()
    .max(100, "Salary can be up to 100 characters.")
    .transform(emptyToNull),
  status: z.enum(APPLICATION_STATUSES, { error: "Choose a valid status." }),
  appliedAt: z
    .string()
    .trim()
    .refine((value) => value === "" || isValidDateString(value), {
      error: "Enter a valid date.",
    })
    .refine((value) => value === "" || value <= latestPossibleToday(), {
      error: "Applied date can't be in the future.",
    })
    .transform(emptyToNull),
  notes: z
    .string()
    .trim()
    .max(5000, "Notes can be up to 5,000 characters.")
    .transform(emptyToNull),
});

export type ApplicationInput = z.output<typeof applicationSchema>;
export type ApplicationField = keyof ApplicationInput;
