"use client";

import { useEffect, useState } from "react";
import { apiFetch, API_URL } from "../../lib/api";

type FeedPost = {
  id: string;
  title: string;
  body: string;
  isPublic: boolean;
  price: number;
  paywalled: boolean;
  author: { id: string; displayName: string | null; username: string; avatarUrl: string | null; profileType: string };
  createdAt: string;
  media: { id: string; type: "IMAGE" | "VIDEO"; url: string }[];
};

type FeedResponse = { posts: FeedPost[]; active: boolean };

export default function FeedPage() {
  const [data, setData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<FeedResponse>("/feed")
      .then((r) => setData(r))
      .catch((e: any) => setError(e?.message || "Error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-white/70">Cargando feed...</div>;
  if (error) return <div className="text-red-200">{error}</div>;
  if (!data) return null;

  return (
    <div className="grid gap-6">
      <div className="card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Feed</h1>
            <p className="mt-1 text-sm text-white/70">
              {data.active
                ? "Membresía activa. Puedes ver contenido premium."
                : "Explora contenido gratuito y desbloquea el contenido premium."}
            </p>
          </div>
          <div className="flex gap-2">
            <a className="btn-secondary" href="/dashboard">
              {data.active ? "Ver membresía" : "Activar membresía"}
            </a>
            <a className="btn-secondary" href="/services">
              Servicios
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl mx-auto w-full">
        {data.posts.map((p) => (
          <article key={p.id} className="card p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                  {p.author.avatarUrl ? (
                    <img
                      src={p.author.avatarUrl.startsWith("http") ? p.author.avatarUrl : `${API_URL}${p.author.avatarUrl}`}
                      alt={p.author.username}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {p.author.displayName || p.author.username}
                  </div>
                  <div className="text-xs text-white/50">@{p.author.username}</div>
                </div>
              </div>
              <div className="text-xs text-white/50">{new Date(p.createdAt).toLocaleString("es-CL")}</div>
            </div>

            <h2 className="mt-4 text-xl font-semibold">{p.title}</h2>
            <div className="mt-2 flex items-center gap-2 text-xs">
              {p.isPublic ? (
                <span className="rounded-full bg-emerald-500/10 text-emerald-200 border border-emerald-400/30 px-3 py-1">
                  Gratis
                </span>
              ) : (
                <span className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-white/70">
                  Premium ${p.price.toLocaleString("es-CL")}
                </span>
              )}
              <span className="text-white/40">•</span>
              <span className="text-white/50">{p.author.profileType}</span>
            </div>

            <div className={p.paywalled ? "mt-4 relative" : "mt-4"}>
              <p className={p.paywalled ? "text-white/60 blur-sm select-none" : "text-white/80"}>{p.body}</p>
              {p.paywalled ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="text-sm text-white/80">Contenido solo para miembros</div>
                  <a className="btn-primary" href="/dashboard">
                    Desbloquear con membresía
                  </a>
                </div>
              ) : null}
            </div>

            {!p.paywalled && p.media.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {p.media.map((m) =>
                  m.type === "IMAGE" ? (
                    <img
                      key={m.id}
                      src={m.url.startsWith("http") ? m.url : `${API_URL}${m.url}`}
                      alt="media"
                      className="w-full rounded-xl border border-white/10"
                    />
                  ) : (
                    <video
                      key={m.id}
                      controls
                      src={m.url.startsWith("http") ? m.url : `${API_URL}${m.url}`}
                      className="w-full rounded-xl border border-white/10"
                    />
                  )
                )}
              </div>
            ) : null}
          </article>
        ))}
        {!data.posts.length ? <div className="text-white/60">Aún no hay publicaciones.</div> : null}
      </div>
    </div>
  );
}
