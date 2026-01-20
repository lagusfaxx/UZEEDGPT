"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, API_URL } from "../../lib/api";

type MeResponse = {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    username: string;
    role: "USER" | "ADMIN";
    membershipExpiresAt: string | null;
    profileType: "VIEWER" | "CREATOR" | "PROFESSIONAL" | "SHOP";
    gender: string | null;
    preferenceGender: string | null;
    avatarUrl?: string | null;
    address?: string | null;
    phone?: string | null;
  } | null;
};

type DashboardResponse = {
  active: boolean;
  membershipExpiresAt: string | null;
  shopTrialEndsAt: string | null;
  profileType?: string;
};

type SubscriptionResponse = {
  subscription: { subscriptionId: string; status: string; redirectUrl?: string | null } | null;
};

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionResponse["subscription"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const exp = useMemo(() => {
    if (!dashboard?.membershipExpiresAt) return null;
    const d = new Date(dashboard.membershipExpiresAt);
    return isNaN(d.getTime()) ? null : d;
  }, [dashboard]);
  const active = dashboard?.active ?? false;

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [preferenceGender, setPreferenceGender] = useState("ALL");

  useEffect(() => {
    Promise.all([
      apiFetch<MeResponse>("/auth/me"),
      apiFetch<DashboardResponse>("/dashboard"),
      apiFetch<SubscriptionResponse>("/payments/subscription")
    ])
      .then(([m, d, s]) => {
        if (!m.user) {
          window.location.href = "/login";
          return;
        }
        setMe(m.user);
        setDashboard(d);
        setSubscription(s.subscription);
        setDisplayName(m.user.displayName || "");
        setPhone(m.user.phone || "");
        setAddress(m.user.address || "");
        setPreferenceGender(m.user.preferenceGender || "ALL");
      })
      .catch((e: any) => setError(e?.message || "Error"))
      .finally(() => setLoading(false));
  }, []);

  async function startSubscription() {
    setError(null);
    try {
      const r = await apiFetch<{ redirectUrl: string }>("/payments/subscribe", { method: "POST" });
      window.location.href = r.redirectUrl;
    } catch (e: any) {
      setError(e?.message || "No se pudo iniciar la suscripción");
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify({ displayName, phone, address, preferenceGender })
      });
      if (avatarFile) {
        const form = new FormData();
        form.append("file", avatarFile);
        const res = await fetch(`${API_URL}/profile/avatar`, { method: "POST", credentials: "include", body: form });
        if (!res.ok) throw new Error("UPLOAD_FAILED");
      }
      window.location.reload();
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar el perfil");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-white/70">Cargando...</div>;
  if (error) return <div className="text-red-200">{error}</div>;
  if (!me || !dashboard) return null;

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-white/70">Hola, {me.displayName || me.username}.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-sm text-white/60">Membresía</div>
            <div className="mt-2 text-xl font-semibold">{active ? "Activa" : "Inactiva"}</div>
            <div className="mt-1 text-sm text-white/70">
              {exp ? `Expira: ${exp.toLocaleString("es-CL")}` : "Sin suscripción"}
            </div>
            {dashboard.shopTrialEndsAt && me.profileType === "SHOP" ? (
              <p className="mt-2 text-xs text-amber-200">
                Prueba gratis hasta {new Date(dashboard.shopTrialEndsAt).toLocaleDateString("es-CL")}.
              </p>
            ) : null}
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-sm text-white/60">Pagos</div>
            <div className="mt-3 flex gap-3 flex-wrap">
              <button className="btn-primary" onClick={startSubscription}>
                {subscription ? "Renovar suscripción" : "Comprar suscripción mensual"}
              </button>
              <a className="btn-secondary" href="/feed">
                Ir al feed
              </a>
            </div>
            <p className="mt-2 text-xs text-white/50">
              El débito PAC se gestiona con Khipu. La membresía se activa tras la notificación.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Perfil</h2>
        <form onSubmit={saveProfile} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm text-white/70">Nombre público</label>
            <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-white/70">Teléfono</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm text-white/70">Dirección</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-white/70">Preferencia de género</label>
            <select className="input" value={preferenceGender} onChange={(e) => setPreferenceGender(e.target.value)}>
              <option value="ALL">Todos</option>
              <option value="FEMALE">Mujer</option>
              <option value="MALE">Hombre</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-white/70">Foto de perfil</label>
            <input type="file" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <button className="btn-primary" disabled={saving}>
              {saving ? "Guardando..." : "Guardar perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
