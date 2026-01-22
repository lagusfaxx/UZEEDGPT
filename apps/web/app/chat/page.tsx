"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, resolveMediaUrl } from "../../lib/api";

type Conversation = {
  other: {
    id: string;
    displayName: string | null;
    username: string;
    avatarUrl: string | null;
    profileType: string;
    city: string | null;
  };
  lastMessage: {
    id: string;
    body: string;
    createdAt: string;
    fromId: string;
    toId: string;
  };
  unreadCount: number;
};

export default function ChatInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch<{ conversations: Conversation[] }>("/messages/inbox")
      .then((r) => setConversations(r.conversations))
      .catch((e: any) => setError(e?.message || "No se pudo cargar los mensajes"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-white/70">Cargando mensajes...</div>;
  if (error) return <div className="text-red-200">{error}</div>;

  const filtered = conversations.filter((c) => {
    const target = `${c.other.displayName || ""} ${c.other.username}`.toLowerCase();
    return target.includes(search.toLowerCase());
  });

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Mensajes</h1>
        <p className="mt-1 text-sm text-white/70">Tu inbox para coordinar servicios y compras.</p>
      </div>

      <div className="card p-6">
        <div className="mb-4">
          <input
            className="input"
            placeholder="Buscar chat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid gap-3">
          {filtered.map((c) => {
            const avatar = resolveMediaUrl(c.other.avatarUrl);
            return (
              <Link
                key={c.other.id}
                href={`/chat/${c.other.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4 hover:border-white/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                    {avatar ? <img src={avatar} alt={c.other.username} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div>
                    <div className="font-semibold">{c.other.displayName || c.other.username}</div>
                    <div className="text-xs text-white/50">@{c.other.username}</div>
                    <div className="mt-1 text-xs text-white/60 line-clamp-1">{c.lastMessage.body}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/50">{new Date(c.lastMessage.createdAt).toLocaleString("es-CL")}</div>
                  {c.unreadCount ? (
                    <div className="mt-2 inline-flex items-center justify-center rounded-full bg-fuchsia-500 px-2 py-0.5 text-[10px] font-semibold">
                      {c.unreadCount} sin leer
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })}
          {!filtered.length ? (
            <div className="text-sm text-white/60">Aún no tienes conversaciones activas.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
