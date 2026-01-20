"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";

type Mode = "login" | "register";

export default function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, displayName })
        });
      } else {
        await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });
      }
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {mode === "register" ? (
        <div className="grid gap-2">
          <label className="text-sm text-white/70">Nombre público</label>
          <input
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ej: Agus"
            required
            minLength={2}
          />
        </div>
      ) : null}

      <div className="grid gap-2">
        <label className="text-sm text-white/70">Email</label>
        <input
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          type="email"
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm text-white/70">Contraseña</label>
        <input
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          minLength={8}
        />
        <p className="text-xs text-white/50">Mínimo 8 caracteres.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <button disabled={loading} className="btn-primary">
        {loading ? "Procesando..." : mode === "register" ? "Crear cuenta" : "Ingresar"}
      </button>
    </form>
  );
}
