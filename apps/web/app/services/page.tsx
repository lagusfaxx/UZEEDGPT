"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, API_URL } from "../../lib/api";

type ServiceProfile = {
  id: string;
  displayName: string | null;
  username: string;
  avatarUrl: string | null;
  address: string | null;
  city: string | null;
  serviceCategory: string | null;
  serviceDescription: string | null;
  profileType: string;
  distance: number | null;
};

type ServiceResponse = { profiles: ServiceProfile[] };

export default function ServicesPage() {
  const [profiles, setProfiles] = useState<ServiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ServiceResponse>("/services")
      .then((r) => setProfiles(r.profiles))
      .catch((e: any) => setError(e?.message || "Error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-white/70">Cargando servicios...</div>;
  if (error) return <div className="text-red-200">{error}</div>;

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Servicios</h1>
        <p className="mt-2 text-sm text-white/70">
          Encuentra profesionales, tiendas, moteles y sexshops cerca de ti. Coordina por chat interno.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Mapa</h2>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          Mapa interactivo en producción (con direcciones y ubicación actual).
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {profiles.map((p) => (
          <div key={p.id} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl.startsWith("http") ? p.avatarUrl : `${API_URL}${p.avatarUrl}`}
                    alt={p.username}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div>
                <div className="font-semibold">{p.displayName || p.username}</div>
                <div className="text-xs text-white/50">@{p.username}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-white/50">
              {p.profileType} • {p.serviceCategory || "Servicios"} • {p.distance ? `${p.distance.toFixed(1)} km` : "Distancia N/D"}
            </div>
            <p className="mt-3 text-sm text-white/70">{p.serviceDescription || "Perfil en preparación."}</p>
            <div className="mt-4 flex gap-2">
              <button className="btn-secondary">Ver perfil</button>
              <Link className="btn-primary" href={`/chat/${p.id}`}>
                Abrir chat
              </Link>
            </div>
          </div>
        ))}
        {!profiles.length ? <div className="text-white/60">No hay perfiles activos.</div> : null}
      </div>
    </div>
  );
}
