"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { apiFetch } from "../lib/api";

type MeResponse = {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    role: "USER" | "ADMIN";
    membershipExpiresAt: string | null;
    profileType: "VIEWER" | "CREATOR" | "PROFESSIONAL" | "SHOP";
  } | null;
};

export default function Nav() {
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();

  const navItems = useMemo(
    () => [
      { label: "Feed", href: "/feed" },
      { label: "Videos", href: "/videos" },
      { label: "Servicios", href: "/services" }
    ],
    []
  );

  useEffect(() => {
    apiFetch<MeResponse>("/auth/me")
      .then((r) => setMe(r.user))
      .catch(() => setMe(null))
      .finally(() => setLoaded(true));
  }, []);

  async function logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/feed";
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-uzeed-950/80 backdrop-blur nav-shadow">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/brand/isotipo.png" alt="UZEED" className="h-9 w-9" />
          <span className="text-lg font-semibold tracking-wide">UZEED</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "nav-link nav-link-active" : "nav-link"}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {!loaded ? null : me ? (
            <>
              <Link className={pathname?.startsWith("/dashboard") ? "nav-link nav-link-active" : "nav-link"} href="/dashboard">
                Mi cuenta
              </Link>
              {me.profileType === "CREATOR" || me.profileType === "PROFESSIONAL" ? (
                <Link className={pathname?.startsWith("/studio") ? "nav-link nav-link-active" : "nav-link"} href="/studio">
                  Publicar
                </Link>
              ) : null}
              {me.role === "ADMIN" ? (
                <Link className={pathname?.startsWith("/admin") ? "nav-link nav-link-active" : "nav-link"} href="/admin">
                  Admin
                </Link>
              ) : null}
              <button className="btn-ghost" onClick={logout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link className="btn-ghost" href="/login">
                Ingresar
              </Link>
              <Link className="btn-accent" href="/register">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
