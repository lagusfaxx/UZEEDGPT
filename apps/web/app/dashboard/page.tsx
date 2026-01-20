"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";

type MeResponse = {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: "USER" | "ADMIN";
    membershipExpiresAt: string | null;
  } | null;
};

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const exp = useMemo(() => {
    if (!me?.membershipExpiresAt) return null;
    const d = new Date(me.membershipExpiresAt);
    return isNaN(d.getTime()) ? null : d;
  }, [me]);
  const active = exp ? exp.getTime() > Date.now() : false;

  useEffect(() => {
    apiFetch<MeResponse>("/auth/me")
      .then((r) => {
        if (!r.user) window.location.href = "/login";
        else setMe(r.user);
      })
      .catch((e: any) => setError(e?.message || "Error"))
      .finally(() => setLoading(false));
  }, []);

  async function renew() {
    setError(null);
    try {
      const r = await apiFetch<{ paymentUrl: string }>("/payments/create", { method: "POST" });
      window.location.href = r.paymentUrl;
    } catch (e: any) {
      setError(e?.message || "No se pudo iniciar el pago");
    }
  }

  if (loading) return <div className="text-white/70">Cargando...</div>;
  if (error) return <div className="text-red-200">{error}</div>;
  if (!me) return null;

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-white/70">Hola, {me.displayName}.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-sm text-white/60">Membresía</div>
            <div className="mt-2 text-xl font-semibold">
              {active ? "Activa" : "Inactiva"}
            </div>
            <div className="mt-1 text-sm text-white/70">
              {exp ? `Expira: ${exp.toLocaleString("es-CL")}` : "Sin suscripción"}
            </div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-sm text-white/60">Acciones</div>
            <div className="mt-3 flex gap-3 flex-wrap">
              <button className="btn-primary" onClick={renew}>
                {active ? "Renovar" : "Comprar suscripción mensual"}
              </button>
              <a className="btn-secondary" href="/feed">
                Ir al feed
              </a>
              <a className="btn-secondary" href="/admin">
                Panel de contenido
              </a>
            </div>
            <p className="mt-2 text-xs text-white/50">
              El pago se procesa en Khipu. La membresía se activa al confirmar el webhook.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
