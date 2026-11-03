"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";

import {
  createApplication,
  type ApplicationFormState,
  type ApplicationFormValues,
} from "@/lib/actions/applications";
import { localDateString } from "@/lib/dates";
import {
  APPLICATION_STATUSES,
  parseStack,
  type ApplicationField,
  type ApplicationStatus,
} from "@/lib/validation";

const EMPTY_VALUES: ApplicationFormValues = {
  company: "",
  role: "",
  url: "",
  stack: "",
  salary: "",
  status: "applied",
  appliedAt: "",
  notes: "",
};

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm font-normal dark:border-zinc-700";

const initialState: ApplicationFormState = { savedCount: 0 };

const subscribeToNothing = () => () => {};

/** Today's date in the browser's timezone. Empty on the server, which doesn't know the timezone. */
function useLocalToday() {
  return useSyncExternalStore(subscribeToNothing, localDateString, () => "");
}

function FieldError({
  field,
  message,
}: {
  field: ApplicationField;
  message?: string;
}) {
  if (!message) {
    return null;
  }
  return (
    <p
      id={`${field}-error`}
      className="mt-1 text-sm font-normal text-red-600 dark:text-red-400"
    >
      {message}
    </p>
  );
}

function ApplicationFields({
  initialValues,
  errors,
  isEdit,
}: {
  initialValues?: ApplicationFormValues;
  errors?: ApplicationFormState["errors"];
  isEdit: boolean;
}) {
  const today = useLocalToday();
  const [values, setValues] = useState(initialValues ?? EMPTY_VALUES);
  // null means the user hasn't chosen a date, so the field shows today.
  const [chosenDate, setChosenDate] = useState<string | null>(
    initialValues ? initialValues.appliedAt : null,
  );

  const stackTags = parseStack(values.stack);

  function setField(field: ApplicationField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function changeStatus(status: ApplicationStatus) {
    // Only a new application follows the status like this. On edit, the server
    // applies the date rule so an existing date is never lost.
    if (!isEdit) {
      if (status === "saved") {
        setChosenDate("");
      } else if (values.status === "saved") {
        setChosenDate(null);
      }
    }
    setField("status", status);
  }

  function textField(
    field: ApplicationField,
    label: string,
    options: { maxLength?: number; inputMode?: "url"; required?: boolean } = {},
  ) {
    const message = errors?.[field];
    return (
      <label className="text-sm font-medium">
        {label}
        {options.required && <span aria-hidden="true"> *</span>}
        <input
          type="text"
          name={field}
          value={values[field]}
          onChange={(event) => setField(field, event.target.value)}
          maxLength={options.maxLength}
          inputMode={options.inputMode}
          aria-required={options.required}
          aria-invalid={Boolean(message)}
          aria-describedby={message ? `${field}-error` : undefined}
          className={inputClass}
        />
        <FieldError field={field} message={message} />
      </label>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {textField("company", "Company", { maxLength: 200, required: true })}
        {textField("role", "Role", { maxLength: 200, required: true })}
      </div>

      {textField("url", "Link", { inputMode: "url" })}

      <div>
        {textField("stack", "Stack (comma-separated)")}
        {stackTags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1">
            {stackTags.map((tag) => (
              <li
                key={tag}
                className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>

      {textField("salary", "Salary", { maxLength: 100 })}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Status
          <select
            name="status"
            value={values.status}
            onChange={(event) =>
              changeStatus(event.target.value as ApplicationStatus)
            }
            className={`${inputClass} capitalize dark:bg-zinc-900`}
          >
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <FieldError field="status" message={errors?.status} />
        </label>

        <label className="text-sm font-medium">
          Applied date
          <input
            type="date"
            name="appliedAt"
            value={chosenDate ?? today}
            max={today || undefined}
            onChange={(event) => setChosenDate(event.target.value)}
            aria-invalid={Boolean(errors?.appliedAt)}
            aria-describedby={errors?.appliedAt ? "appliedAt-error" : undefined}
            className={inputClass}
          />
          <FieldError field="appliedAt" message={errors?.appliedAt} />
        </label>
      </div>

      <label className="text-sm font-medium">
        Notes
        <textarea
          name="notes"
          rows={4}
          maxLength={5000}
          value={values.notes}
          onChange={(event) => setField("notes", event.target.value)}
          aria-invalid={Boolean(errors?.notes)}
          aria-describedby={errors?.notes ? "notes-error" : undefined}
          className={inputClass}
        />
        <FieldError field="notes" message={errors?.notes} />
      </label>
    </>
  );
}

type EditProps = {
  action: (
    state: ApplicationFormState,
    formData: FormData,
  ) => Promise<ApplicationFormState>;
  initialValues: ApplicationFormValues;
};

/** Pass `edit` to update an existing application. Without it, the form creates a new one. */
export function ApplicationForm({ edit }: { edit?: EditProps }) {
  // Next.js keeps visited routes alive, so without this key, Cancel followed by
  // "Add application" would show the old draft. The browser's Back button still restores it.
  const { bfcacheId } = useRouter();
  return <ApplicationFormContent key={bfcacheId} edit={edit} />;
}

function ApplicationFormContent({ edit }: { edit?: EditProps }) {
  const today = useLocalToday();
  const [state, formAction, pending] = useActionState(
    edit?.action ?? createApplication,
    initialState,
  );

  // React resets a form after its action runs, which puts the status select back
  // on its first option. Submitting this way skips that reset.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { submitter } = event.nativeEvent as SubmitEvent;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(formData));
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="mt-6 flex flex-col gap-4"
    >
      {state.savedCompany && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          Saved {state.savedCompany}. Add the next one.
        </p>
      )}

      {/* A new key after each save gives "Save and add another" an empty form. */}
      <ApplicationFields
        key={state.savedCount}
        initialValues={state.values ?? edit?.initialValues}
        errors={state.errors}
        isEdit={Boolean(edit)}
      />

      {edit && <input type="hidden" name="today" value={today} />}

      {state.formError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.formError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          name="intent"
          value="save"
          disabled={pending}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {!edit && (
          <button
            type="submit"
            name="intent"
            value="another"
            disabled={pending}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-60 dark:border-zinc-700"
          >
            Save and add another
          </button>
        )}
        <Link href="/dashboard" className="text-sm font-medium underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
