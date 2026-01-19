"use client";

import { useEffect, useState } from "react";
import { apiFetch, API_URL } from "../../lib/api";

type FeedPost = {
  id: string;
  title: string;
  body: string;
  isPublic: boolean;
  paywalled: boolean;
  author: { id: string; displayName: string };
  createdAt: string;
  media: { id: string; type: "IMAGE" | "VIDEO"; url: string }[];
};

type FeedResponse = { posts: FeedPost[]; hasMembership: boolean };

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
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Feed</h1>
        <p className="mt-2 text-sm text-white/70">
          {data.hasMembership
            ? "Tienes membresía activa. Disfruta el contenido completo."
            : "Algunos posts están protegidos. Activa tu membresía para ver todo."}
        </p>
        {!data.hasMembership ? (
          <div className="mt-4 flex gap-3 flex-wrap">
            <a className="btn-primary" href="/dashboard">
              Activar membresía
            </a>
            <a className="btn-secondary" href="/login">
              Ingresar
            </a>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4">
        {data.posts.map((p) => (
          <article key={p.id} className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{p.title}</h2>
                <div className="mt-1 text-xs text-white/50">
                  por {p.author.displayName} • {new Date(p.createdAt).toLocaleString("es-CL")}
                  {p.paywalled ? " • protegido" : ""}
                </div>
              </div>
              {p.isPublic ? (
                <span className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs text-white/70">
                  Público
                </span>
              ) : (
                <span className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs text-white/70">
                  Membresía
                </span>
              )}
            </div>

            <div className={p.paywalled ? "mt-4 relative" : "mt-4"}>
              <p className={p.paywalled ? "text-white/70 blur-sm select-none" : "text-white/80"}>
                {p.body}
              </p>
              {p.paywalled ? (
                <div className="absolute inset-0 flex items-center justify-center">
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
                      className="w-full rounded-xl border border-white/10"
                      src={m.url.startsWith("http") ? m.url : `${API_URL}${m.url}`}
                    />
                  )
                )}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
