"use client";

import { FormEvent, useState } from "react";
import { Flash } from "@/components/Flash";

export function InquiryForm({
  intent,
  submitLabel,
}: {
  intent: "partner" | "contact";
  submitLabel: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          name: data.get("name"),
          email: data.get("email"),
          organization: data.get("organization"),
          message: data.get("message"),
          company: data.get("company"),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not send that message.");
      form.reset();
      setStatus("done");
      setMessage("Received. The organizer will reply by email.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not send that message.");
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label className="field">
        <span>Name</span>
        <input name="name" autoComplete="name" maxLength={120} required />
      </label>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" maxLength={200} required />
      </label>
      <label className="field">
        <span>{intent === "partner" ? "Brand or organization" : "Subject"}</span>
        <input name="organization" maxLength={160} required />
      </label>
      <label className="field">
        <span>Message</span>
        <textarea name="message" maxLength={2000} required />
      </label>
      <label className="hp" aria-hidden="true">
        Company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      <button className="btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "SENDING" : submitLabel}
      </button>
      {message && (
        <Flash
          message={message}
          tone={status === "error" ? "error" : "success"}
          onDone={() => {
            setMessage("");
            setStatus("idle");
          }}
        />
      )}
    </form>
  );
}
