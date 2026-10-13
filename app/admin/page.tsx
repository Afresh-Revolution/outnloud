import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { requestIsAdminHost } from "@/lib/admin-host";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    const host = (await headers()).get("host");
    redirect(requestIsAdminHost(host) ? "/login" : "/admin/login");
  }
  return <AdminPanel />;
}
