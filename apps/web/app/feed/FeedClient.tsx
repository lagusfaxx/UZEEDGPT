"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiFetch, API_URL } from "../../lib/api";

type FeedPost = {
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
  };
};

type FeedResponse = { posts: FeedPost[]; nextPage: number | null };

export default function FeedClient() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<number | null>(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  async function load(page: number, mode: "reset" | "append") {
    if (mode === "append") setLoadingMore(true);
    if (mode === "reset") setLoading(true);
    try {
      const res = await apiFetch<FeedResponse>(`/feed?page=${page}&limit=12`);
      setPosts((prev) => (mode === "append" ? [...prev, ...res.posts] : res.posts));
      setNextPage(res.nextPage);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el feed");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    load(1, "reset");
  }, []);

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
  }, [nextPage, loading, loadingMore]);

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="card p-6">
          <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
          <div className="mt-3 h-4 w-72 rounded bg-white/10 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Feed</h1>
            <p className="mt-1 text-sm text-white/70">Descubre publicaciones nuevas de la comunidad.</p>
          </div>
          <Link className="btn-secondary" href="/videos">
            Ir a Videos
          </Link>
        </div>
      </div>

      {error ? (
        <div className="card p-4 text-sm text-red-200 border-red-500/30 bg-red-500/10">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 max-w-3xl mx-auto w-full">
        {posts.map((post) => {
          const preview = post.preview?.url
            ? post.preview.url.startsWith("http")
              ? post.preview.url
              : `${API_URL}${post.preview.url}`
            : null;
          const avatar = post.author.avatarUrl
            ? post.author.avatarUrl.startsWith("http")
              ? post.author.avatarUrl
              : `${API_URL}${post.author.avatarUrl}`
            : null;

          return (
            <article key={post.id} className="card p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                  {avatar ? <img src={avatar} alt={post.author.username} className="h-full w-full object-cover" /> : null}
                </div>
                <div>
                  <div className="font-semibold">{post.author.displayName || post.author.username}</div>
                  <div className="text-xs text-white/50">@{post.author.username}</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-white/80">{post.body}</div>
              {preview ? (
                <div className="mt-4 relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <img
                    src={preview}
                    alt={post.title}
                    className={`h-[360px] w-full object-cover ${post.paywalled ? "blur-lg scale-105" : ""}`}
                  />
                  {post.paywalled ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-center text-sm">
                      <div className="font-semibold">Contenido exclusivo</div>
                      <div className="text-xs text-white/70">Suscríbete para desbloquear</div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}

        {!posts.length ? (
          <div className="card p-8 text-center text-white/70">
            <p className="text-lg font-semibold">Aún no hay publicaciones</p>
            <p className="mt-2 text-sm text-white/50">Vuelve más tarde para ver nuevo contenido.</p>
          </div>
        ) : null}
      </div>

      <div ref={sentinelRef} className="h-10" />
    </div>
  );
}
