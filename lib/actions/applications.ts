"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { createApplication as insertApplication } from "@/lib/db/queries";
import { applicationSchema, type ApplicationField } from "@/lib/validation";

const FIELDS = [
  "company",
  "role",
  "url",
  "stack",
  "salary",
  "status",
  "appliedAt",
  "notes",
] as const satisfies readonly ApplicationField[];

export type ApplicationFormValues = Record<ApplicationField, string>;

export type ApplicationFormState = {
  savedCount: number;
  savedCompany?: string;
  values?: ApplicationFormValues;
  errors?: Partial<Record<ApplicationField, string>>;
  formError?: string;
};

function readValues(formData: FormData) {
  const values = {} as ApplicationFormValues;
  for (const field of FIELDS) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }
  return values;
}

export async function createApplication(
  state: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const user = await requireUser();
  const values = readValues(formData);
  const parsed = applicationSchema.safeParse(values);

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    const errors: ApplicationFormState["errors"] = {};
    for (const field of FIELDS) {
      errors[field] = fieldErrors[field]?.[0];
    }
    return { savedCount: state.savedCount, values, errors };
  }

  const input = parsed.data;

  try {
    await insertApplication(user.id, {
      ...input,
      // A new saved application hasn't been sent yet, so it has no applied date.
      appliedAt: input.status === "saved" ? null : input.appliedAt,
    });
  } catch {
    return {
      savedCount: state.savedCount,
      values,
      formError: "Couldn't save this application. Please try again.",
    };
  }

  revalidatePath("/dashboard");

  if (formData.get("intent") === "another") {
    return { savedCount: state.savedCount + 1, savedCompany: input.company };
  }

  redirect("/dashboard");
}
