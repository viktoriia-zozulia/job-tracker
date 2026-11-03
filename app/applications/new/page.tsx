import { ApplicationForm } from "@/components/application-form";
import { requireUser } from "@/lib/auth";

export default async function NewApplicationPage() {
  await requireUser();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Add an application</h1>
      <ApplicationForm />
    </main>
  );
}
