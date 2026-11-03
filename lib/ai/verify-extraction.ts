import { z } from "zod";

import { normalizeUrl, parseStack } from "@/lib/validation";

export const rawExtractionSchema = z.object({
  company: z.string().nullable(),
  role: z.string().nullable(),
  stack: z.array(z.string()),
  salary: z.string().nullable(),
  link: z.string().nullable(),
});

export type RawExtraction = z.output<typeof rawExtractionSchema>;

export const EXTRACTED_FIELDS = [
  "company",
  "role",
  "url",
  "stack",
  "salary",
] as const;

export type ExtractedField = (typeof EXTRACTED_FIELDS)[number];

export type VerifiedExtraction = {
  fields: Partial<Record<ExtractedField, string>>;
  notFound: ExtractedField[];
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

const isWordCharacter = (char: string | undefined) =>
  char !== undefined && /[\p{L}\p{N}]/u.test(char);

/** True if the value appears as a whole word, so "Go" doesn't match inside "good". */
function containsWord(text: string, value: string) {
  let index = text.indexOf(value);
  while (index !== -1) {
    const before = text[index - 1];
    const after = text[index + value.length];
    if (!isWordCharacter(before) && !isWordCharacter(after)) {
      return true;
    }
    index = text.indexOf(value, index + 1);
  }
  return false;
}

/**
 * Keeps only values that appear in the pasted text. The link and salary must match
 * exactly as written. Company, role and stack entries match after normalising case
 * and whitespace. Values that fail also can't pass the form's own limits.
 */
export function verifyExtraction(
  raw: RawExtraction,
  text: string,
): VerifiedExtraction {
  const normalized = normalizeText(text);
  const fields: VerifiedExtraction["fields"] = {};

  const company = raw.company?.trim();
  if (company && company.length <= 200 && normalized.includes(normalizeText(company))) {
    fields.company = company;
  }

  const role = raw.role?.trim();
  if (role && role.length <= 200 && normalized.includes(normalizeText(role))) {
    fields.role = role;
  }

  const link = raw.link;
  if (link && text.includes(link) && normalizeUrl(link)) {
    fields.url = link;
  }

  const salary = raw.salary;
  if (salary && salary.length <= 100 && text.includes(salary)) {
    fields.salary = salary;
  }

  const stack = parseStack(raw.stack.join(",")).filter((entry) =>
    containsWord(normalized, normalizeText(entry)),
  );
  if (stack.length > 0) {
    fields.stack = stack.join(", ");
  }

  return {
    fields,
    notFound: EXTRACTED_FIELDS.filter((field) => !fields[field]),
  };
}
