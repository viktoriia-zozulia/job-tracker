"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import {
  createApplication as insertApplication,
  getApplication,
  updateApplication as saveApplication,
} from "@/lib/db/queries";
import { appliedDateAfterStatusChange, resolveToday } from "@/lib/dates";
import {
  applicationSchema,
  isApplicationId,
  type ApplicationField,
  type ApplicationInput,
} from "@/lib/validation";

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

const NOT_FOUND_MESSAGE = "This application doesn't exist.";

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

type ParsedForm =
  | { input: ApplicationInput; failure?: undefined }
  | { failure: ApplicationFormState; input?: undefined };

function parseForm(
  state: ApplicationFormState,
  values: ApplicationFormValues,
): ParsedForm {
  const parsed = applicationSchema.safeParse(values);

  if (parsed.success) {
    return { input: parsed.data };
  }

  const { fieldErrors } = z.flattenError(parsed.error);
  const errors: ApplicationFormState["errors"] = {};
  for (const field of FIELDS) {
    errors[field] = fieldErrors[field]?.[0];
  }
  return { failure: { savedCount: state.savedCount, values, errors } };
}

export async function createApplication(
  state: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const user = await requireUser();
  const values = readValues(formData);
  const { input, failure } = parseForm(state, values);

  if (failure) {
    return failure;
  }

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

export async function updateApplication(
  id: string,
  state: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const user = await requireUser();
  const values = readValues(formData);
  const notFound = {
    savedCount: state.savedCount,
    values,
    formError: NOT_FOUND_MESSAGE,
  };

  if (!isApplicationId(id)) {
    return notFound;
  }

  const { input, failure } = parseForm(state, values);

  if (failure) {
    return failure;
  }

  try {
    const existing = await getApplication(user.id, id);
    if (!existing) {
      return notFound;
    }

    const appliedAt = appliedDateAfterStatusChange(
      { from: existing.status, to: input.status, appliedAt: input.appliedAt },
      resolveToday(formData.get("today")),
    );

    if (!(await saveApplication(user.id, id, { ...input, appliedAt }))) {
      return notFound;
    }
  } catch {
    return {
      savedCount: state.savedCount,
      values,
      formError: "Couldn't save this application. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/applications/${id}/edit`);
  redirect("/dashboard");
}
