"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Flash } from "@/components/Flash";
import { PageLoader } from "@/components/PageLoader";
import { naira } from "@/lib/format";
import type { GalleryItem, Inquiry, LineupAct, Partner, Subscriber } from "@/lib/content";

type Sales = {
  eventTitle: string;
  ticketsSold: number;
  revenue: number;
  tiers: Array<{ name: string; sold: number; price: number; revenue: number; available: number }>;
};

type AdminState = {
  settings: Record<string, string>;
  lineup: LineupAct[];
  gallery: GalleryItem[];
  partners: Partner[];
  inquiries: Inquiry[];
  subscribers: Subscriber[];
  sales: Sales;
};

const TABS = ["Overview", "Lineup", "Gallery", "Partners", "Community", "Contact"] as const;
type Tab = (typeof TABS)[number];

async function api(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Sign in again.");
  }
  if (!res.ok) throw new Error(body.error || "Request failed.");
  return body;
}

async function uploadToCloudinary(file: File) {
  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  if (resourceType === "video" && file.size > 30 * 1024 * 1024) {
    throw new Error("Keep videos under 30MB.");
  }
  if (resourceType === "image" && file.size > 8 * 1024 * 1024) {
    throw new Error("Keep images under 8MB.");
  }
  const sign = await api("/api/admin/upload-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resourceType }),
  });
  const data = new FormData();
  data.append("file", file);
  data.append("api_key", sign.apiKey);
  data.append("timestamp", String(sign.timestamp));
  data.append("signature", sign.signature);
  data.append("folder", sign.folder);
  const uploadedRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: data,
  });
  const uploaded = await uploadedRes.json().catch(() => ({}));
  if (!uploadedRes.ok) throw new Error(uploaded?.error?.message || "Upload failed.");
  return {
    url: String(uploaded.secure_url || ""),
    cloudinaryId: String(uploaded.public_id || ""),
    kind: resourceType as "image" | "video",
  };
}

function MediaThumb({
  url,
  kind,
  alt,
  large,
}: {
  url: string;
  kind: "image" | "video";
  alt: string;
  large?: boolean;
}) {
  if (!url) return null;
  const className = large ? "admin-preview" : "admin-thumb";
  if (kind === "video") {
    return <video className={className} src={url} controls muted playsInline preload="metadata" />;
  }
  return <img className={className} src={url} alt={alt} />;
}

function UploadField({
  name,
  label,
  accept,
  required,
}: {
  name: string;
  label: string;
  accept: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; kind: "image" | "video" } | null>(null);

  useEffect(() => {
    const input = inputRef.current;
    const form = input?.form;
    if (!form) return;
    const clear = () => {
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return null;
      });
    };
    form.addEventListener("reset", clear);
    return () => form.removeEventListener("reset", clear);
  }, []);

  return (
    <label className="field">
      <span>{label}</span>
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept={accept}
        required={required}
        onChange={(event) => {
          const file = event.target.files?.[0];
          setPreview((current) => {
            if (current) URL.revokeObjectURL(current.url);
            if (!file || file.size === 0) return null;
            return {
              url: URL.createObjectURL(file),
              kind: file.type.startsWith("video/") ? "video" : "image",
            };
          });
        }}
      />
      {preview && <MediaThumb url={preview.url} kind={preview.kind} alt={label} large />}
    </label>
  );
}

export function AdminPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Overview");
  const [state, setState] = useState<AdminState | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const next = (await api("/api/admin/state")) as AdminState;
    setState(next);
  }, []);

  useEffect(() => {
    load().catch((err) => {
      setFailed(true);
      setError(err instanceof Error ? err.message : "Could not load admin.");
    });
  }, [load]);

  async function run(task: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const result = await task();
      const mailError = result && typeof result === "object" && "mailError" in result ? String(result.mailError || "") : "";
      const mailed = result && typeof result === "object" && "mailed" in result ? Number(result.mailed) : 0;
      await load();
      if (mailError) setError(mailError);
      else setNote(mailed ? `Sent to ${mailed} people. ${success}` : success);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  if (!state && !failed) return <PageLoader label="Tuning the desk" />;

  return (
    <section className="page-hero">
      <div className="wrap">
        <div className="admin-top">
          <div>
            <p className="kicker">Control</p>
            <h1>Admin</h1>
          </div>
          <button className="btn secondary" type="button" onClick={logout}>
            SIGN OUT
          </button>
        </div>
        <div className="admin-tabs" role="tablist">
          {TABS.map((item) => (
            <button key={item} type="button" aria-selected={tab === item} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </div>
        {error && <Flash message={error} tone="error" onDone={() => setError("")} />}
        {note && <Flash message={note} tone="success" onDone={() => setNote("")} />}
        {state && (
          <>
            {tab === "Overview" && <Overview state={state} busy={busy} run={run} />}
            {tab === "Lineup" && <LineupDesk state={state} busy={busy} run={run} />}
            {tab === "Gallery" && <GalleryDesk state={state} busy={busy} run={run} />}
            {tab === "Partners" && <PartnersDesk state={state} busy={busy} run={run} />}
            {tab === "Community" && <CommunityDesk state={state} busy={busy} run={run} />}
            {tab === "Contact" && <ContactDesk state={state} busy={busy} run={run} />}
          </>
        )}
      </div>
    </section>
  );
}

function Overview({
  state,
  busy,
  run,
}: {
  state: AdminState;
  busy: boolean;
  run: (task: () => Promise<unknown>, success: string) => Promise<void>;
}) {
  return (
    <div className="admin-stack">
      <div className="stats">
        <article className="stat">
          <span>Tickets bought</span>
          <strong>{state.sales.ticketsSold.toLocaleString()}</strong>
        </article>
        <article className="stat">
          <span>Revenue</span>
          <strong>{naira(state.sales.revenue)}</strong>
        </article>
        <article className="stat">
          <span>On the list</span>
          <strong>{state.subscribers.length}</strong>
        </article>
        <article className="stat">
          <span>Partners</span>
          <strong>{state.partners.length}</strong>
        </article>
      </div>
      <p className="lede">
        {state.sales.eventTitle
          ? `Counted from ${state.sales.eventTitle} on Gatewav. Revenue is tickets sold times the listed price.`
          : "Ticket totals appear when the Out N Loud event is live on Gatewav."}
      </p>
      {state.sales.tiers.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tier</th>
                <th>Sold</th>
                <th>Left</th>
                <th>Price</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {state.sales.tiers.map((tier) => (
                <tr key={tier.name}>
                  <td>{tier.name}</td>
                  <td>{tier.sold}</td>
                  <td>{tier.available}</td>
                  <td>{tier.price === 0 ? "Free" : naira(tier.price)}</td>
                  <td>{naira(tier.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <NotifyForm
        busy={busy}
        kind="tickets"
        label="EMAIL THE LIST ABOUT TICKETS"
        placeholder="Tickets for Out N Loud are on sale. Choose a tier on the site."
        run={run}
      />
    </div>
  );
}

function NotifyForm({
  busy,
  kind,
  label,
  placeholder,
  run,
}: {
  busy: boolean;
  kind: "tickets" | "lineup";
  label: string;
  placeholder: string;
  run: (task: () => Promise<unknown>, success: string) => Promise<void>;
}) {
  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault();
        const message = String(new FormData(event.currentTarget).get("message") ?? "");
        void run(
          () =>
            api("/api/admin/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ kind, message }),
            }),
          "The list has the note.",
        );
      }}
    >
      <label className="field">
        <span>Message to the list</span>
        <textarea name="message" required minLength={8} maxLength={2000} placeholder={placeholder} />
      </label>
      <button className="btn" type="submit" disabled={busy}>
        {label}
      </button>
    </form>
  );
}

function LineupDesk({
  state,
  busy,
  run,
}: {
  state: AdminState;
  busy: boolean;
  run: (task: () => Promise<unknown>, success: string) => Promise<void>;
}) {
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("photo");
    await run(async () => {
      let imageUrl = "";
      let cloudinaryId = "";
      if (file instanceof File && file.size > 0) {
        const uploaded = await uploadToCloudinary(file);
        imageUrl = uploaded.url;
        cloudinaryId = uploaded.cloudinaryId;
      }
      const result = await api("/api/admin/lineup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist: data.get("artist"),
          stage: data.get("stage"),
          timeLabel: data.get("timeLabel"),
          bio: data.get("bio"),
          imageUrl,
          cloudinaryId,
          notify: data.get("notify") === "on",
          note: data.get("note"),
        }),
      });
      form.reset();
      return result;
    }, "Artist added to the lineup.");
  }

  return (
    <div className="admin-stack">
      <form className="form" onSubmit={(event) => void onSubmit(event)}>
        <label className="field">
          <span>Artist</span>
          <input name="artist" required maxLength={120} />
        </label>
        <label className="field">
          <span>Stage</span>
          <select name="stage" defaultValue="Main Stage">
            <option>Main Stage</option>
            <option>City Stage</option>
            <option>Afterhours</option>
          </select>
        </label>
        <label className="field">
          <span>Time</span>
          <input name="timeLabel" maxLength={80} placeholder="9:30 PM" />
        </label>
        <label className="field">
          <span>Note</span>
          <textarea name="bio" maxLength={600} />
        </label>
        <UploadField name="photo" label="Photo" accept="image/*" />
        <label className="check">
          <input name="notify" type="checkbox" />
          <span>Email the community list about this artist</span>
        </label>
        <label className="field">
          <span>Email note, if you are sending one</span>
          <textarea name="note" maxLength={2000} />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          ADD TO LINEUP
        </button>
      </form>
      <ul className="admin-list">
        {state.lineup.map((act) => (
          <li key={act.id}>
            <div className="admin-media">
              {act.imageUrl && (
                <a href={act.imageUrl} target="_blank" rel="noreferrer">
                  <MediaThumb url={act.imageUrl} kind="image" alt={act.artist} />
                </a>
              )}
              <div>
                <strong>{act.artist}</strong>
                <span>
                  {act.stage}
                  {act.timeLabel ? ` · ${act.timeLabel}` : ""}
                </span>
              </div>
            </div>
            <button
              className="btn secondary"
              type="button"
              disabled={busy}
              onClick={() => void run(() => api(`/api/admin/lineup/${act.id}`, { method: "DELETE" }), "Removed from the lineup.")}
            >
              REMOVE
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GalleryDesk({
  state,
  busy,
  run,
}: {
  state: AdminState;
  busy: boolean;
  run: (task: () => Promise<unknown>, success: string) => Promise<void>;
}) {
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    await run(async () => {
      if (!(file instanceof File) || file.size === 0) throw new Error("Choose an image or a short video.");
      const uploaded = await uploadToCloudinary(file);
      await api("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: uploaded.kind,
          title: data.get("title"),
          caption: data.get("caption"),
          url: uploaded.url,
          cloudinaryId: uploaded.cloudinaryId,
        }),
      });
      form.reset();
    }, "Added to the gallery.");
  }

  return (
    <div className="admin-stack">
      <form className="form" onSubmit={(event) => void onSubmit(event)}>
        <label className="field">
          <span>Title</span>
          <input name="title" maxLength={120} />
        </label>
        <label className="field">
          <span>Caption</span>
          <input name="caption" maxLength={240} />
        </label>
        <UploadField name="file" label="Image or short video" accept="image/*,video/*" required />
        <button className="btn" type="submit" disabled={busy}>
          UPLOAD
        </button>
      </form>
      <ul className="admin-list">
        {state.gallery.map((item) => (
          <li key={item.id}>
            <div className="admin-media">
              {item.kind === "video" ? (
                <MediaThumb url={item.url} kind="video" alt={item.title || "Gallery video"} />
              ) : (
                <a href={item.url} target="_blank" rel="noreferrer">
                  <MediaThumb url={item.url} kind="image" alt={item.title || "Gallery image"} />
                </a>
              )}
              <div>
                <strong>{item.title || (item.kind === "video" ? "Video" : "Photo")}</strong>
                <span>{item.kind}</span>
              </div>
            </div>
            <button
              className="btn secondary"
              type="button"
              disabled={busy}
              onClick={() => void run(() => api(`/api/admin/gallery/${item.id}`, { method: "DELETE" }), "Removed from the gallery.")}
            >
              REMOVE
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PartnersDesk({
  state,
  busy,
  run,
}: {
  state: AdminState;
  busy: boolean;
  run: (task: () => Promise<unknown>, success: string) => Promise<void>;
}) {
  const pending = state.inquiries.filter((item) => item.intent === "partner" && item.status === "pending");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("logo");
    await run(async () => {
      let logoUrl = "";
      let cloudinaryId = "";
      if (file instanceof File && file.size > 0) {
        const uploaded = await uploadToCloudinary(file);
        logoUrl = uploaded.url;
        cloudinaryId = uploaded.cloudinaryId;
      }
      await api("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          tier: data.get("tier"),
          website: data.get("website"),
          logoUrl,
          cloudinaryId,
        }),
      });
      form.reset();
    }, "Partner added.");
  }

  return (
    <div className="admin-stack">
      <h2>Waiting</h2>
      <ul className="admin-list">
        {pending.length === 0 && <li>No partner inquiries waiting.</li>}
        {pending.map((item) => (
          <li key={item.id}>
            <div>
              <strong>{item.organization}</strong>
              <span>
                {item.name} · {item.email}
              </span>
              <p>{item.message}</p>
            </div>
            <div className="admin-actions">
              <button
                className="btn"
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(
                    () =>
                      api(`/api/admin/inquiries/${item.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "accepted" }),
                      }),
                    "Partner accepted. They now show on the site.",
                  )
                }
              >
                ACCEPT
              </button>
              <button
                className="btn secondary"
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(
                    () =>
                      api(`/api/admin/inquiries/${item.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "declined" }),
                      }),
                    "Inquiry declined.",
                  )
                }
              >
                DECLINE
              </button>
            </div>
          </li>
        ))}
      </ul>
      <h2>On the site</h2>
      <ul className="admin-list">
        {state.partners.map((partner) => (
          <li key={partner.id}>
            <div className="admin-media">
              {partner.logoUrl && (
                <a href={partner.logoUrl} target="_blank" rel="noreferrer">
                  <MediaThumb url={partner.logoUrl} kind="image" alt={`${partner.name} logo`} />
                </a>
              )}
              <div>
                <strong>{partner.name}</strong>
                <span>{partner.tier}</span>
              </div>
            </div>
            <button
              className="btn secondary"
              type="button"
              disabled={busy}
              onClick={() => void run(() => api(`/api/admin/partners/${partner.id}`, { method: "DELETE" }), "Partner removed.")}
            >
              REMOVE
            </button>
          </li>
        ))}
      </ul>
      <form className="form" onSubmit={(event) => void onSubmit(event)}>
        <label className="field">
          <span>Name</span>
          <input name="name" required maxLength={140} />
        </label>
        <label className="field">
          <span>Tier</span>
          <select name="tier" defaultValue="City">
            <option>City</option>
            <option>Stage</option>
            <option>Presenting</option>
          </select>
        </label>
        <label className="field">
          <span>Website</span>
          <input name="website" type="url" placeholder="https://" />
        </label>
        <UploadField name="logo" label="Logo" accept="image/*" />
        <button className="btn" type="submit" disabled={busy}>
          ADD PARTNER
        </button>
      </form>
    </div>
  );
}

function CommunityDesk({
  state,
  busy,
  run,
}: {
  state: AdminState;
  busy: boolean;
  run: (task: () => Promise<unknown>, success: string) => Promise<void>;
}) {
  return (
    <div className="admin-stack">
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          const whatsappCommunity = String(new FormData(event.currentTarget).get("whatsapp_community") ?? "");
          void run(
            () =>
              api("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ whatsapp_community: whatsappCommunity }),
              }),
            "WhatsApp community link saved.",
          );
        }}
      >
        <label className="field">
          <span>WhatsApp community link or number</span>
          <input
            name="whatsapp_community"
            defaultValue={state.settings.whatsapp_community || ""}
            placeholder="https://chat.whatsapp.com/… or 080…"
          />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          SAVE LINK
        </button>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {state.subscribers.map((person) => (
              <tr key={person.id}>
                <td>{person.name}</td>
                <td>{person.email}</td>
                <td>{person.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <NotifyForm
        busy={busy}
        kind="lineup"
        label="EMAIL A LINEUP NOTE"
        placeholder="The next lineup wave is up."
        run={run}
      />
    </div>
  );
}

function ContactDesk({
  state,
  busy,
  run,
}: {
  state: AdminState;
  busy: boolean;
  run: (task: () => Promise<unknown>, success: string) => Promise<void>;
}) {
  const messages = state.inquiries.filter((item) => item.intent === "contact");
  return (
    <div className="admin-stack">
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void run(
            () =>
              api("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contact_email: data.get("contact_email"),
                  contact_phone: data.get("contact_phone"),
                  contact_whatsapp: data.get("contact_whatsapp"),
                  venue_name: data.get("venue_name"),
                  venue_address: data.get("venue_address"),
                }),
              }),
            "Contact details saved. They are live on the site.",
          );
        }}
      >
        <label className="field">
          <span>Email</span>
          <input name="contact_email" type="email" defaultValue={state.settings.contact_email || ""} />
        </label>
        <label className="field">
          <span>Phone</span>
          <input name="contact_phone" defaultValue={state.settings.contact_phone || ""} />
        </label>
        <label className="field">
          <span>WhatsApp</span>
          <input name="contact_whatsapp" defaultValue={state.settings.contact_whatsapp || ""} />
        </label>
        <label className="field">
          <span>Venue name</span>
          <input name="venue_name" defaultValue={state.settings.venue_name || ""} />
        </label>
        <label className="field">
          <span>Address</span>
          <input name="venue_address" defaultValue={state.settings.venue_address || ""} />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          SAVE CONTACT
        </button>
      </form>
      <h2>Messages</h2>
      <ul className="admin-list">
        {messages.length === 0 && <li>No contact messages yet.</li>}
        {messages.map((item) => (
          <li key={item.id}>
            <div>
              <strong>{item.organization}</strong>
              <span>
                {item.name} · {item.email}
              </span>
              <p>{item.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
