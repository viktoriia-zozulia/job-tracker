import { notFound } from "next/navigation";

import { ApplicationForm } from "@/components/application-form";
import { updateApplication } from "@/lib/actions/applications";
import { requireUser } from "@/lib/auth";
import { getApplication } from "@/lib/db/queries";
import { isApplicationId } from "@/lib/validation";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const application = isApplicationId(id)
    ? await getApplication(user.id, id)
    : null;

  if (!application) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Edit application</h1>
      <ApplicationForm
        edit={{
          action: updateApplication.bind(null, application.id),
          initialValues: {
            company: application.company,
            role: application.role,
            url: application.url ?? "",
            stack: application.stack.join(", "),
            salary: application.salary ?? "",
            status: application.status,
            appliedAt: application.appliedAt ?? "",
            notes: application.notes ?? "",
          },
        }}
      />
    </main>
  );
}
