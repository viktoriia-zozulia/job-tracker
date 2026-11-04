import { ApplicationForm } from "@/components/application-form";

// Static on purpose, so this page opens instantly. It shows no user data,
// proxy.ts blocks logged-out users, and the save action checks the session.
export default function NewApplicationPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Add an application</h1>
      <ApplicationForm />
    </main>
  );
}
