import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

let client: Sql | null = null;
let ready: Promise<void> | null = null;

export function databaseUrl(): string {
  return (process.env.DATABASE_URL ?? "").trim().replace(/^["']|["']$/g, "");
}

export function db(): Sql | null {
  const url = databaseUrl();
  if (!url) return null;
  if (!client) {
    client = postgres(url, {
      prepare: false,
      max: 3,
      idle_timeout: 20,
      ssl: "require",
    });
  }
  return client;
}

export async function ensureSchema(): Promise<void> {
  const sql = db();
  if (!sql) return;
  if (!ready) {
    ready = (async () => {
      await sql`
        create table if not exists site_settings (
          key text primary key,
          value text not null default ''
        )
      `;
      await sql`
        create table if not exists subscribers (
          id uuid primary key,
          name text not null,
          email text not null unique,
          phone text not null default '',
          created_at timestamptz not null default now()
        )
      `;
      await sql`
        create table if not exists inquiries (
          id uuid primary key,
          intent text not null,
          name text not null,
          email text not null,
          organization text not null default '',
          message text not null,
          status text not null default 'pending',
          created_at timestamptz not null default now()
        )
      `;
      await sql`
        create table if not exists lineup_acts (
          id uuid primary key,
          artist text not null,
          stage text not null,
          time_label text not null default '',
          bio text not null default '',
          image_url text not null default '',
          cloudinary_id text not null default '',
          sort_order int not null default 0,
          created_at timestamptz not null default now()
        )
      `;
      await sql`
        create table if not exists gallery_items (
          id uuid primary key,
          kind text not null,
          title text not null default '',
          caption text not null default '',
          url text not null,
          cloudinary_id text not null default '',
          sort_order int not null default 0,
          created_at timestamptz not null default now()
        )
      `;
      await sql`
        create table if not exists partners (
          id uuid primary key,
          inquiry_id uuid,
          name text not null,
          tier text not null default '',
          website text not null default '',
          logo_url text not null default '',
          cloudinary_id text not null default '',
          created_at timestamptz not null default now()
        )
      `;
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
}
