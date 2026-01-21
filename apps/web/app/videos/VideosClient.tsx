"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiFetch, API_URL } from "../../lib/api";

type VideoPost = {
  id: string;
  body: string;
  createdAt: string;
  preview: { id: string; type: "IMAGE" | "VIDEO"; url: string } | null;
  media: { id: string; type: "IMAGE" | "VIDEO"; url: string }[];
  author: {
    id: string;
    displayName: string | null;
    username: string;
    avatarUrl: string | null;
  };
  paywalled: boolean;
};

type VideosResponse = { posts: VideoPost[]; nextPage: number | null };

export default function VideosClient() {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<number | null>(1);
  const [muted, setMuted] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  async function load(page: number, mode: "reset" | "append") {
    if (mode === "append") setLoadingMore(true);
    if (mode === "reset") setLoading(true);
    try {
      const res = await apiFetch<VideosResponse>(`/videos?page=${page}&limit=8`);
      setVideos((prev) => (mode === "append" ? [...prev, ...res.posts] : res.posts));
      setNextPage(res.nextPage);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar los videos");
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

  useEffect(() => {
    const videosEls = Array.from(document.querySelectorAll("video[data-autoplay='true']")) as HTMLVideoElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => null);
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 }
    );
    videosEls.forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, [videos]);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
        <div className="mt-3 h-4 w-72 rounded bg-white/10 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Videos</h1>
            <p className="mt-1 text-sm text-white/70">Reels cortos con scroll vertical.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={() => setMuted((m) => !m)}>
              {muted ? "🔇 Silencio" : "🔊 Sonido"}
            </button>
            <Link className="btn-secondary" href="/feed">
              Volver al Feed
            </Link>
          </div>
        </div>
      </div>

      {error ? (
        <div className="card p-4 text-sm text-red-200 border-red-500/30 bg-red-500/10">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6">
        {videos.map((post) => {
          const video = post.media.find((m) => m.type === "VIDEO");
          const videoUrl = video
            ? video.url.startsWith("http")
              ? video.url
              : `${API_URL}${video.url}`
            : null;
          const avatar = post.author.avatarUrl
            ? post.author.avatarUrl.startsWith("http")
              ? post.author.avatarUrl
              : `${API_URL}${post.author.avatarUrl}`
            : null;
          return (
            <div key={post.id} className="card p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                  {avatar ? <img src={avatar} alt={post.author.username} className="h-full w-full object-cover" /> : null}
                </div>
                <div>
                  <div className="font-semibold">{post.author.displayName || post.author.username}</div>
                  <div className="text-xs text-white/50">@{post.author.username}</div>
                </div>
              </div>
              {videoUrl ? (
                <div className="mt-4 relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <video
                    data-autoplay="true"
                    src={videoUrl}
                    className={`h-full w-full object-cover ${post.paywalled ? "blur-lg scale-105" : ""}`}
                    muted={muted}
                    playsInline
                    loop
                  />
                  {post.paywalled ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-center text-sm">
                      <div className="font-semibold">Video exclusivo</div>
                      <div className="text-xs text-white/70">Suscríbete para desbloquear</div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <p className="mt-3 text-sm text-white/80">{post.body}</p>
            </div>
          );
        })}
      </div>
      <div ref={sentinelRef} className="h-10" />
    </div>
  );
}
