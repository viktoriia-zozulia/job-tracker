"use client";

import { useId, useState } from "react";

import type {
  ExtractedField,
  VerifiedExtraction,
} from "@/lib/ai/verify-extraction";

const FIELD_LABELS: Record<ExtractedField, string> = {
  company: "company",
  role: "role",
  url: "link",
  stack: "stack",
  salary: "salary",
};

type Message = { kind: "success" | "error"; text: string };

export function JobDescriptionPaste({
  onFill,
}: {
  onFill: (fields: VerifiedExtraction["fields"]) => void;
}) {
  const textareaId = useId();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  async function fillFromText() {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/parse-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage({ kind: "error", text: data.error });
        return;
      }

      const { fields, notFound } = data as VerifiedExtraction;
      onFill(fields);

      const missing = notFound.map((field) => FIELD_LABELS[field]).join(", ");
      setMessage({
        kind: "success",
        text: missing
          ? `Form filled. Not found: ${missing}. Check it before saving.`
          : "Form filled. Check it before saving.",
      });
    } catch {
      setMessage({
        kind: "error",
        text: "Couldn't read this job description. You can still fill in the form by hand.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
      <label htmlFor={textareaId} className="text-sm font-medium">
        Job description (optional)
      </label>
      <textarea
        id={textareaId}
        rows={5}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Paste a job description to fill in the form"
        className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm font-normal dark:border-zinc-700"
      />
      <button
        type="button"
        onClick={fillFromText}
        disabled={pending}
        className="mt-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-60 dark:border-zinc-700"
      >
        {pending ? "Reading…" : "Fill the form"}
      </button>
      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`mt-2 text-sm ${
            message.kind === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
