"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { credentialsSchema } from "@/lib/validation";

export type AuthFormState = {
  error?: string;
  email?: string;
};

function parseCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

function submittedEmail(formData: FormData) {
  const email = formData.get("email");
  return typeof email === "string" ? email : "";
}

export async function logIn(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = submittedEmail(formData);
  const parsed = parseCredentials(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      error:
        error.code === "invalid_credentials"
          ? "Incorrect email or password."
          : "Couldn't log you in. Please try again.",
      email,
    };
  }

  redirect("/dashboard");
}

export async function signUp(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = submittedEmail(formData);
  const parsed = parseCredentials(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    if (error.code === "user_already_exists") {
      return { error: "An account with this email already exists.", email };
    }
    if (error.code === "weak_password") {
      return { error: error.message, email };
    }
    return { error: "Couldn't create your account. Please try again.", email };
  }

  if (!data.session) {
    return { error: "Couldn't log you in. Please try logging in.", email };
  }

  redirect("/dashboard");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
