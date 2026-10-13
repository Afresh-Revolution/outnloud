import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export async function appendRecord(fileName: string, record: Record<string, unknown>) {
  const dir = path.join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  const full = path.join(dir, fileName);
  let existing: unknown[] = [];
  try {
    const parsed = JSON.parse(await readFile(full, "utf8"));
    if (Array.isArray(parsed)) existing = parsed;
  } catch {
    existing = [];
  }
  existing.push({ ...record, receivedAt: new Date().toISOString() });
  await writeFile(full, JSON.stringify(existing, null, 2), "utf8");
}
