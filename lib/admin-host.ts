export function adminHostname(): string {
  return (process.env.NEXT_PUBLIC_ADMIN_HOST || "admin.localhost").split(":")[0].toLowerCase();
}

export function requestIsAdminHost(hostHeader: string | null | undefined): boolean {
  return (hostHeader || "").split(":")[0].toLowerCase() === adminHostname();
}

export function adminHomePath(): string {
  if (typeof window === "undefined") return "/admin";
  return window.location.hostname.toLowerCase() === adminHostname() ? "/" : "/admin";
}

export function adminLoginPath(): string {
  if (typeof window === "undefined") return "/admin/login";
  return window.location.hostname.toLowerCase() === adminHostname() ? "/login" : "/admin/login";
}
