"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, API_URL } from "../../lib/api";

type ExplorePost = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  isPublic: boolean;
  paywalled: boolean;
  isSubscribed: boolean;
  preview: { id: string; type: "IMAGE" | "VIDEO"; url: string } | null;
  media: { id: string; type: "IMAGE" | "VIDEO"; url: string }[];
  author: {
    id: string;
    displayName: string | null;
    username: string;
    avatarUrl: string | null;
    profileType: string;
    subscriptionPrice: number | null;
    city: string | null;
    serviceCategory: string | null;
  };
};

type ExploreResponse = { posts: ExplorePost[]; nextPage: number | null };

const typeFilters = [
  { label: "Creadoras", value: "CREATOR" },
  { label: "Profesionales", value: "PROFESSIONAL" },
  { label: "Tiendas", value: "SHOP" }
];

const categoryFilters = [
  { label: "Sexshop", value: "sexshop" },
  { label: "Moteles", value: "motel" }
];

const sortFilters = [
  { label: "Cerca de mí", value: "near" },
  { label: "Más populares", value: "popular" },
  { label: "Nuevos", value: "new" }
];

export default function ExplorePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<string[]>(typeFilters.map((f) => f.value));
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [sort, setSort] = useState("new");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nextPage, setNextPage] = useState<number | null>(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (activeTypes.length) params.set("types", activeTypes.join(","));
    if (activeCategories.length) params.set("categories", activeCategories.join(","));
    if (sort) params.set("sort", sort);
    if (sort === "near" && userLocation) {
      params.set("lat", String(userLocation[0]));
      params.set("lng", String(userLocation[1]));
    }
    return params.toString();
  }, [search, activeTypes, activeCategories, sort, userLocation]);

  async function load(page: number, mode: "reset" | "append") {
    if (mode === "append") setLoadingMore(true);
    if (mode === "reset") setLoading(true);
    try {
      const res = await apiFetch<ExploreResponse>(
        `/explore?page=${page}&limit=12${queryString ? `&${queryString}` : ""}`
      );
      setPosts((prev) => (mode === "append" ? [...prev, ...res.posts] : res.posts));
      setNextPage(res.nextPage);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar explorar");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    setNextPage(1);
    load(1, "reset");
  }, [queryString]);

  useEffect(() => {
    if (sort !== "near") return;
    if (userLocation) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => null
      );
    }
  }, [sort, userLocation]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!nextPage || loading || loadingMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && nextPage) {
        load(nextPage, "append");
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextPage, loading, loadingMore, queryString]);

  const handleSubscribe = async (username: string) => {
    try {
      await apiFetch(`/profiles/${username}/subscribe`, { method: "POST" });
      setNextPage(1);
      await load(1, "reset");
    } catch (e: any) {
      setError(e?.message || "No se pudo suscribir");
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="card p-6 md:p-8">
          <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
          <div className="mt-3 h-4 w-72 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="grid gap-6 max-w-3xl mx-auto w-full">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/10" />
                <div>
                  <div className="h-4 w-32 rounded bg-white/10" />
                  <div className="mt-2 h-3 w-24 rounded bg-white/10" />
                </div>
              </div>
              <div className="mt-6 h-40 rounded-2xl bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Explorar</h1>
            <p className="mt-1 text-sm text-white/70">
              Descubre creadoras, profesionales y contenido premium con suscripciones por perfil.
            </p>
          </div>
          <div className="flex gap-2">
            <Link className="btn-secondary" href="/services">
              Servicios y mapa
            </Link>
            <Link className="btn-primary" href="/dashboard">
              Mi cuenta
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-xs text-white/60">Buscar</span>
            <input
              className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              placeholder="@usuario, nombre, categoría, comuna"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((f) => {
              const active = activeTypes.includes(f.value);
              return (
                <button
                  key={f.value}
                  className={active ? "btn-primary" : "btn-secondary"}
                  onClick={() =>
                    setActiveTypes((prev) =>
                      active ? prev.filter((t) => t !== f.value) : [...prev, f.value]
                    )
                  }
                >
                  {f.label}
                </button>
              );
            })}
            {categoryFilters.map((f) => {
              const active = activeCategories.includes(f.value);
              return (
                <button
                  key={f.value}
                  className={active ? "btn-primary" : "btn-secondary"}
                  onClick={() =>
                    setActiveCategories((prev) =>
                      active ? prev.filter((t) => t !== f.value) : [...prev, f.value]
                    )
                  }
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {sortFilters.map((f) => (
            <button
              key={f.value}
              className={sort === f.value ? "btn-primary" : "btn-secondary"}
              onClick={() => setSort(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <div className="card p-4 text-sm text-red-200 border-red-500/30 bg-red-500/10">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 max-w-3xl mx-auto w-full">
        {posts.map((p) => {
          const avatar = p.author.avatarUrl
            ? p.author.avatarUrl.startsWith("http")
              ? p.author.avatarUrl
              : `${API_URL}${p.author.avatarUrl}`
            : null;
          const preview = p.preview
            ? p.preview.url.startsWith("http")
              ? p.preview.url
              : `${API_URL}${p.preview.url}`
            : null;
          const subPrice = p.author.subscriptionPrice || 2500;

          return (
            <article
              key={p.id}
              className="card p-6 cursor-pointer hover:border-white/30 transition"
              onClick={() => router.push(`/profile/${p.author.username}`)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                    {avatar ? <img src={avatar} alt={p.author.username} className="h-full w-full object-cover" /> : null}
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

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                  {p.author.profileType === "CREATOR" ? "Creadora" : "Profesional"}
                </span>
                {p.isPublic ? (
                  <span className="rounded-full bg-emerald-500/10 text-emerald-200 border border-emerald-400/30 px-3 py-1">
                    Gratis
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-white/70">
                    Solo miembros
                  </span>
                )}
                {p.author.city ? <span className="text-white/40">• {p.author.city}</span> : null}
                {p.author.serviceCategory ? <span className="text-white/40">• {p.author.serviceCategory}</span> : null}
              </div>

              <h2 className="mt-4 text-xl font-semibold">{p.title}</h2>
              <p className={p.paywalled ? "mt-2 text-white/60 blur-sm select-none" : "mt-2 text-white/80"}>{p.body}</p>

              <div className="mt-5 relative">
                <div className="relative aspect-[4/5] min-h-[520px] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  {preview ? (
                    p.preview?.type === "IMAGE" ? (
                      <img
                        src={preview}
                        alt="preview"
                        className={`h-full w-full object-cover ${p.paywalled ? "blur-md" : ""}`}
                      />
                    ) : (
                      <video
                        src={preview}
                        className={`h-full w-full object-cover ${p.paywalled ? "blur-md" : ""}`}
                        muted
                        playsInline
                        autoPlay
                        loop
                      />
                    )
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-white/5 to-white/10" />
                  )}
                </div>

                {p.paywalled ? (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs uppercase tracking-[0.2em] text-white/60">Solo miembros</div>
                    <div className="text-sm text-white/80">
                      Suscripción al perfil de {p.author.displayName || p.author.username}
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button className="btn-accent" onClick={() => handleSubscribe(p.author.username)}>
                        Suscribirme ${subPrice.toLocaleString("es-CL")}/mes
                      </button>
                      <button className="btn-ghost" onClick={() => router.push(`/profile/${p.author.username}`)}>
                        Ver perfil
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
                <div className="flex items-center gap-4">
                  <button className="hover:text-white transition" onClick={(e) => e.stopPropagation()}>
                    ❤️ Me gusta
                  </button>
                  <button className="hover:text-white transition" onClick={(e) => e.stopPropagation()}>
                    🔖 Guardar
                  </button>
                  {!p.isPublic ? (
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">
                      🔒 Solo miembros
                    </span>
                  ) : null}
                </div>
                {p.author.profileType === "PROFESSIONAL" || p.author.profileType === "SHOP" ? (
                  <Link
                    className="text-xs text-white/70 hover:text-white"
                    href={`/chat/${p.author.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    💬 Abrir chat
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
        {!posts.length ? (
          <div className="card p-8 text-center text-white/70">
            <p className="text-lg font-semibold">No encontramos perfiles aún</p>
            <p className="mt-2 text-sm text-white/50">
              Prueba con otra búsqueda o ajusta los filtros para descubrir nuevas creadoras.
            </p>
          </div>
        ) : null}
        <div ref={sentinelRef} className="h-4" />
        {loadingMore ? <div className="text-center text-white/60">Cargando más...</div> : null}
      </div>
    </div>
  );
}
