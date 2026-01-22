"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { apiFetch } from "../lib/api";

type NotificationItem = {
  id: string;
  type: "SUBSCRIPTION_STARTED" | "SUBSCRIPTION_RENEWED" | "MESSAGE_RECEIVED" | "POST_PUBLISHED" | "SERVICE_PUBLISHED";
  createdAt: string;
  readAt: string | null;
  data: any;
};

type InboxResponse = {
  conversations: { unreadCount: number }[];
};

type MeResponse = {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    role: "USER" | "ADMIN";
    membershipExpiresAt: string | null;
    profileType: "VIEWER" | "CREATOR" | "PROFESSIONAL" | "SHOP";
  } | null;
};

export default function Nav() {
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const navItems = useMemo(
    () => [
      { label: "Inicio", href: "/feed" },
      { label: "Reels", href: "/videos" },
      { label: "Servicios", href: "/services" }
    ],
    []
  );

  useEffect(() => {
    apiFetch<MeResponse>("/auth/me")
      .then((r) => setMe(r.user))
      .catch(() => setMe(null))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!me) return;
    Promise.all([
      apiFetch<{ notifications: NotificationItem[] }>("/notifications"),
      apiFetch<InboxResponse>("/messages/inbox")
    ])
      .then(([notificationResp, inboxResp]) => {
        setNotifications(notificationResp.notifications || []);
        const unread = inboxResp.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadMessages(unread);
      })
      .catch(() => null);
  }, [me]);

  const unreadNotifications = notifications.filter((n) => !n.readAt).length;

  const notificationLabel = (n: NotificationItem) => {
    switch (n.type) {
      case "MESSAGE_RECEIVED":
        return "Nuevo mensaje";
      case "SUBSCRIPTION_STARTED":
        return "Nueva suscripción";
      case "SUBSCRIPTION_RENEWED":
        return "Suscripción renovada";
      case "POST_PUBLISHED":
        return "Nueva publicación";
      case "SERVICE_PUBLISHED":
        return "Nuevo servicio";
      default:
        return "Nueva notificación";
    }
  };

  const notificationHref = (n: NotificationItem) => {
    if (n.type === "MESSAGE_RECEIVED" && n.data?.fromId) return `/chat/${n.data.fromId}`;
    return "/dashboard";
  };

  const markNotificationRead = async (id: string) => {
    await apiFetch(`/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt || new Date().toISOString() } : n)));
  };

  async function logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/feed";
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-uzeed-950/80 backdrop-blur nav-shadow">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/brand/isotipo.png" alt="UZEED" className="h-9 w-9" />
          <span className="text-lg font-semibold tracking-wide">UZEED</span>
        </Link>

        <nav className="relative flex items-center gap-4 text-sm">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "nav-link nav-link-active" : "nav-link"}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {!loaded ? null : me ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  className="relative btn-ghost"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  aria-label="Notificaciones"
                >
                  <span className="text-lg">🔔</span>
                  {unreadNotifications ? (
                    <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-semibold">
                      {unreadNotifications}
                    </span>
                  ) : null}
                </button>
                <Link className="relative btn-ghost" href="/chat" aria-label="Chats">
                  <span className="text-lg">💬</span>
                  {unreadMessages ? (
                    <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-semibold">
                      {unreadMessages}
                    </span>
                  ) : null}
                </Link>
              </div>

              <Link className={pathname?.startsWith("/dashboard") ? "nav-link nav-link-active" : "nav-link"} href="/dashboard">
                Mi cuenta
              </Link>
              {me.profileType === "CREATOR" || me.profileType === "PROFESSIONAL" ? (
                <Link className={pathname?.startsWith("/studio") ? "nav-link nav-link-active" : "nav-link"} href="/studio">
                  Publicar
                </Link>
              ) : null}
              {me.role === "ADMIN" ? (
                <Link className={pathname?.startsWith("/admin") ? "nav-link nav-link-active" : "nav-link"} href="/admin">
                  Admin
                </Link>
              ) : null}
              <button className="btn-ghost" onClick={logout}>
                Salir
              </button>

              {notificationsOpen ? (
                <div className="absolute right-4 top-16 w-80 rounded-2xl border border-white/10 bg-uzeed-950/95 p-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Notificaciones</div>
                    <button className="text-xs text-white/50" onClick={() => setNotificationsOpen(false)}>
                      Cerrar
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={notificationHref(n)}
                        onClick={() => markNotificationRead(n.id)}
                        className={`rounded-xl border border-white/10 p-3 text-xs transition ${
                          n.readAt ? "bg-white/5 text-white/60" : "bg-white/10 text-white"
                        }`}
                      >
                        <div className="font-semibold">{notificationLabel(n)}</div>
                        <div className="mt-1 text-[11px] text-white/60">
                          {new Date(n.createdAt).toLocaleString("es-CL")}
                        </div>
                      </Link>
                    ))}
                    {!notifications.length ? (
                      <div className="text-xs text-white/50">Aún no tienes notificaciones.</div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <Link className="btn-ghost" href="/login">
                Ingresar
              </Link>
              <Link className="btn-accent" href="/register">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
