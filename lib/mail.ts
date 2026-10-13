import { Resend } from "resend";
import { listSubscribers } from "@/lib/content";

export async function emailSubscribers(subject: string, text: string): Promise<number> {
  const key = (process.env.RESEND_API_KEY ?? "").trim();
  const from = (process.env.RESEND_FROM ?? "").trim().replace(/^["']|["']$/g, "");
  if (!key || !from) {
    throw new Error("Add RESEND_API_KEY and RESEND_FROM before emailing the list.");
  }
  const people = await listSubscribers();
  if (people.length === 0) throw new Error("The community list is empty.");

  const resend = new Resend(key);
  const body = text.trim();
  for (let index = 0; index < people.length; index += 100) {
    const group = people.slice(index, index + 100);
    const result = await resend.batch.send(
      group.map((person) => ({
        from,
        to: person.email,
        subject,
        text: `Hi ${person.name},\n\n${body}\n\nOut N Loud\nJos, Plateau State`,
      })),
    );
    if (result.error) throw new Error(result.error.message);
  }
  return people.length;
}
