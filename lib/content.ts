import { randomUUID } from "crypto";
import { db, ensureSchema } from "@/lib/db";
import { destroyAsset } from "@/lib/cloudinary";

export type LineupAct = {
  id: string;
  artist: string;
  stage: string;
  timeLabel: string;
  bio: string;
  imageUrl: string;
  cloudinaryId: string;
};

export type GalleryItem = {
  id: string;
  kind: "image" | "video";
  title: string;
  caption: string;
  url: string;
  cloudinaryId: string;
};

export type Partner = {
  id: string;
  name: string;
  tier: string;
  website: string;
  logoUrl: string;
  cloudinaryId: string;
};

export type Inquiry = {
  id: string;
  intent: "partner" | "contact";
  name: string;
  email: string;
  organization: string;
  message: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};

export type Subscriber = {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let settingsCache: { at: number; data: Record<string, string> } | null = null;

function requireId(id: string) {
  if (!UUID.test(id)) throw new Error("That record was not found.");
  return id;
}

async function sqlOrThrow() {
  const sql = db();
  if (!sql) throw new Error("Add DATABASE_URL from the Supabase session pooler.");
  await ensureSchema();
  return sql;
}

export async function getSettings(): Promise<Record<string, string>> {
  if (settingsCache && Date.now() - settingsCache.at < 4000) return settingsCache.data;
  const sql = db();
  if (!sql) return {};
  try {
    await ensureSchema();
    const rows = await sql<{ key: string; value: string }[]>`select key, value from site_settings`;
    const data = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    settingsCache = { at: Date.now(), data };
    return data;
  } catch {
    return {};
  }
}

export async function saveSettings(input: Record<string, string>) {
  const sql = await sqlOrThrow();
  const entries = Object.entries(input);
  for (const [key, value] of entries) {
    await sql`
      insert into site_settings (key, value)
      values (${key}, ${value})
      on conflict (key) do update set value = excluded.value
    `;
  }
  settingsCache = null;
}

export async function listLineup(): Promise<LineupAct[]> {
  const sql = db();
  if (!sql) return [];
  try {
    await ensureSchema();
    return await sql<LineupAct[]>`
      select id, artist, stage, time_label as "timeLabel", bio,
             image_url as "imageUrl", cloudinary_id as "cloudinaryId"
      from lineup_acts
      order by sort_order asc, created_at asc
    `;
  } catch {
    return [];
  }
}

export async function addLineup(input: Omit<LineupAct, "id">) {
  const sql = await sqlOrThrow();
  const id = randomUUID();
  const [{ next }] = await sql<{ next: number }[]>`
    select coalesce(max(sort_order), 0) + 1 as next from lineup_acts
  `;
  await sql`
    insert into lineup_acts (id, artist, stage, time_label, bio, image_url, cloudinary_id, sort_order)
    values (
      ${id}, ${input.artist}, ${input.stage}, ${input.timeLabel}, ${input.bio},
      ${input.imageUrl}, ${input.cloudinaryId}, ${next}
    )
  `;
  return id;
}

export async function removeLineup(id: string) {
  const sql = await sqlOrThrow();
  const [row] = await sql<{ cloudinaryId: string }[]>`
    select cloudinary_id as "cloudinaryId" from lineup_acts where id = ${requireId(id)}
  `;
  if (!row) throw new Error("That artist was not found.");
  if (row.cloudinaryId) await destroyAsset(row.cloudinaryId, "image").catch(() => undefined);
  await sql`delete from lineup_acts where id = ${id}`;
}

export async function listGallery(): Promise<GalleryItem[]> {
  const sql = db();
  if (!sql) return [];
  try {
    await ensureSchema();
    const rows = await sql<GalleryItem[]>`
      select id, kind, title, caption, url, cloudinary_id as "cloudinaryId"
      from gallery_items
      order by sort_order asc, created_at asc
    `;
    return rows.map((row) => ({ ...row, kind: row.kind === "video" ? "video" : "image" }));
  } catch {
    return [];
  }
}

export async function addGallery(input: Omit<GalleryItem, "id">) {
  const sql = await sqlOrThrow();
  const id = randomUUID();
  const [{ next }] = await sql<{ next: number }[]>`
    select coalesce(max(sort_order), 0) + 1 as next from gallery_items
  `;
  await sql`
    insert into gallery_items (id, kind, title, caption, url, cloudinary_id, sort_order)
    values (${id}, ${input.kind}, ${input.title}, ${input.caption}, ${input.url}, ${input.cloudinaryId}, ${next})
  `;
  return id;
}

export async function removeGallery(id: string) {
  const sql = await sqlOrThrow();
  const [row] = await sql<{ cloudinaryId: string; kind: string }[]>`
    select cloudinary_id as "cloudinaryId", kind from gallery_items where id = ${requireId(id)}
  `;
  if (!row) throw new Error("That file was not found.");
  await destroyAsset(row.cloudinaryId, row.kind === "video" ? "video" : "image").catch(() => undefined);
  await sql`delete from gallery_items where id = ${id}`;
}

export async function listPartners(): Promise<Partner[]> {
  const sql = db();
  if (!sql) return [];
  try {
    await ensureSchema();
    return await sql<Partner[]>`
      select id, name, tier, website, logo_url as "logoUrl", cloudinary_id as "cloudinaryId"
      from partners
      order by created_at asc
    `;
  } catch {
    return [];
  }
}

export async function addPartner(input: Omit<Partner, "id"> & { inquiryId?: string }) {
  const sql = await sqlOrThrow();
  const id = randomUUID();
  await sql`
    insert into partners (id, inquiry_id, name, tier, website, logo_url, cloudinary_id)
    values (
      ${id}, ${input.inquiryId ?? null}, ${input.name}, ${input.tier},
      ${input.website}, ${input.logoUrl}, ${input.cloudinaryId}
    )
  `;
  return id;
}

export async function removePartner(id: string) {
  const sql = await sqlOrThrow();
  const [row] = await sql<{ cloudinaryId: string }[]>`
    select cloudinary_id as "cloudinaryId" from partners where id = ${requireId(id)}
  `;
  if (!row) throw new Error("That partner was not found.");
  if (row.cloudinaryId) await destroyAsset(row.cloudinaryId, "image").catch(() => undefined);
  await sql`delete from partners where id = ${id}`;
}

export async function listInquiries(): Promise<Inquiry[]> {
  const sql = await sqlOrThrow();
  const rows = await sql<Inquiry[]>`
    select id, intent, name, email, organization, message, status, created_at as "createdAt"
    from inquiries
    order by created_at desc
  `;
  return rows.map((row) => ({
    ...row,
    intent: row.intent === "partner" ? "partner" : "contact",
    status: row.status === "accepted" || row.status === "declined" ? row.status : "pending",
    createdAt: new Date(row.createdAt).toISOString(),
  }));
}

export async function addInquiry(input: Omit<Inquiry, "id" | "status" | "createdAt">) {
  const sql = await sqlOrThrow();
  await sql`
    insert into inquiries (id, intent, name, email, organization, message)
    values (${randomUUID()}, ${input.intent}, ${input.name}, ${input.email}, ${input.organization}, ${input.message})
  `;
}

export async function setInquiryStatus(id: string, status: "accepted" | "declined") {
  const sql = await sqlOrThrow();
  const [row] = await sql<Inquiry[]>`
    select id, intent, name, email, organization, message, status, created_at as "createdAt"
    from inquiries where id = ${requireId(id)}
  `;
  if (!row) throw new Error("That submission was not found.");
  await sql`update inquiries set status = ${status} where id = ${id}`;
  if (status === "accepted" && row.intent === "partner") {
    const existing = await sql<{ id: string }[]>`select id from partners where inquiry_id = ${id}`;
    if (existing.length === 0) {
      await addPartner({
        name: row.organization || row.name,
        tier: "Partner",
        website: "",
        logoUrl: "",
        cloudinaryId: "",
        inquiryId: id,
      });
    }
  }
}

export async function listSubscribers(): Promise<Subscriber[]> {
  const sql = await sqlOrThrow();
  const rows = await sql<Subscriber[]>`
    select id, name, email, phone, created_at as "createdAt"
    from subscribers
    order by created_at desc
  `;
  return rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt).toISOString() }));
}

export async function addSubscriber(input: { name: string; email: string; phone: string }) {
  const sql = await sqlOrThrow();
  await sql`
    insert into subscribers (id, name, email, phone)
    values (${randomUUID()}, ${input.name}, ${input.email}, ${input.phone})
    on conflict (email) do update set name = excluded.name, phone = excluded.phone
  `;
}
