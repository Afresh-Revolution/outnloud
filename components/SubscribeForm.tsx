"use client";

import { FormEvent, useState } from "react";
import { Flash } from "@/components/Flash";

export function SubscribeForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          consent: data.get("consent") === "on",
          company: data.get("company"),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not save your signup.");
      form.reset();
      setStatus("done");
      setMessage("You are on the list. Lineup and ticket news will come to that email.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not save your signup.");
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
        <span>WhatsApp number</span>
        <input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={20} required placeholder="080…" />
      </label>
      <label className="check">
        <input name="consent" type="checkbox" required />
        <span>Email me lineup and ticket news, and use this number for the WhatsApp community.</span>
      </label>
      <label className="hp" aria-hidden="true">
        Company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      <button className="btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "SAVING" : "JOIN THE LIST"}
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
