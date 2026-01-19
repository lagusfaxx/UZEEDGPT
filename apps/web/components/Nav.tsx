"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type MeResponse = {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: "USER" | "ADMIN";
    membershipExpiresAt: string | null;
  } | null;
};

export default function Nav() {
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiFetch<MeResponse>("/me")
      .then((r) => setMe(r.user))
      .catch(() => setMe(null))
      .finally(() => setLoaded(true));
  }, []);

  async function logout() {
    try {
      await apiFetch("/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-uzeed-950/70 backdrop-blur">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <img src="/brand/isotipo.png" alt="UZEED" className="h-9 w-9" />
          <span className="text-lg font-semibold tracking-wide">UZEED</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link className="btn-secondary" href="/feed">
            Feed
          </Link>

          {!loaded ? null : me ? (
            <>
              <Link className="btn-secondary" href="/dashboard">
                Dashboard
              </Link>
              {me.role === "ADMIN" ? (
                <Link className="btn-secondary" href="/admin">
                  Admin
                </Link>
              ) : null}
              <button className="btn-secondary" onClick={logout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link className="btn-secondary" href="/login">
                Ingresar
              </Link>
              <Link className="btn-primary" href="/register">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
