"use client";

import { useEffect, useRef } from "react";

export function Flash({
  message,
  tone,
  onDone,
}: {
  message: string;
  tone: "success" | "error";
  onDone: () => void;
}) {
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => done.current(), 2000);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!message) return null;
  return (
    <p className={tone === "success" ? "ok" : "error"} role="status">
      {message}
    </p>
  );
}
