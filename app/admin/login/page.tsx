import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { requestIsAdminHost } from "@/lib/admin-host";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) {
    const host = (await headers()).get("host");
    redirect(requestIsAdminHost(host) ? "/" : "/admin");
  }
  return (
    <section className="page-hero">
      <div className="wrap" style={{ maxWidth: 480 }}>
        <p className="kicker">Organizer</p>
        <h1>Admin</h1>
        <p className="lede">Sign in to edit the festival and see ticket sales.</p>
        <LoginForm />
      </div>
    </section>
  );
}
