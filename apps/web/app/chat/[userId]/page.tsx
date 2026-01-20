"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";

type Message = {
  id: string;
  fromId: string;
  toId: string;
  body: string;
  createdAt: string;
};

type MeResponse = {
  user: { id: string; displayName: string | null; username: string } | null;
};

export default function ChatPage() {
  const params = useParams();
  const userId = String(params.userId || "");
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [meResp, msgResp] = await Promise.all([
      apiFetch<MeResponse>("/auth/me"),
      apiFetch<{ messages: Message[] }>(`/messages/${userId}`)
    ]);
    if (!meResp.user) {
      window.location.href = "/login";
      return;
    }
    setMe(meResp.user);
    setMessages(msgResp.messages);
  }

  useEffect(() => {
    load()
      .catch((e: any) => setError(e?.message || "Error"))
      .finally(() => setLoading(false));
  }, [userId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const msg = await apiFetch<{ message: Message }>(`/messages/${userId}`, {
      method: "POST",
      body: JSON.stringify({ body })
    });
    setMessages((prev) => [...prev, msg.message]);
    setBody("");
  }

  if (loading) return <div className="text-white/70">Cargando chat...</div>;
  if (error) return <div className="text-red-200">{error}</div>;

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Chat en vivo</h1>
        <p className="mt-1 text-sm text-white/70">
          Conversación segura para coordinar servicios o compras.
        </p>
      </div>

      <div className="card p-6">
        <div className="grid gap-3 max-h-[420px] overflow-y-auto pr-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl px-4 py-3 text-sm ${
                m.fromId === me?.id ? "bg-purple-500/20 text-white ml-auto" : "bg-white/5 text-white/80"
              }`}
            >
              <div>{m.body}</div>
              <div className="mt-1 text-[10px] text-white/40">
                {new Date(m.createdAt).toLocaleString("es-CL")}
              </div>
            </div>
          ))}
          {!messages.length ? <div className="text-white/50">Aún no hay mensajes.</div> : null}
        </div>

        <form onSubmit={send} className="mt-4 flex gap-3">
          <input
            className="input flex-1"
            placeholder="Escribe tu mensaje..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button className="btn-primary">Enviar</button>
        </form>
      </div>
    </div>
  );
}
