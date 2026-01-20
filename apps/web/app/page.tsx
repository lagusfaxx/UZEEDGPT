import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid gap-10">
      <section className="card p-8 md:p-10">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="grid gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Plataforma lista para producción
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
              Monetiza tu contenido con una experiencia premium.
            </h1>
            <p className="text-white/70">
              UZEED te permite cobrar membresías, proteger publicaciones y cobrar con pagos locales sin fricciones.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/register" className="btn-primary">
                Crear cuenta
              </Link>
              <Link href="/feed" className="btn-secondary">
                Ver feed
              </Link>
              <Link href="/admin" className="btn-secondary">
                Subir contenido
              </Link>
            </div>
            <div className="text-sm text-white/60">
              Membresías mensuales • Panel de contenido • Pagos automáticos
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/0 border border-white/10 p-8">
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <img src="/brand/isotipo.png" alt="UZEED" className="h-12 w-12" />
                <div>
                  <div className="text-lg font-semibold">UZEED</div>
                  <div className="text-sm text-white/60">Creadores • Membresías • Comunidad</div>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-sm text-white/60">Suscripción mensual</div>
                  <div className="text-xl font-semibold">Acceso exclusivo</div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-sm text-white/60">Pagos locales</div>
                  <div className="text-xl font-semibold">Khipu (Chile)</div>
                </div>
              </div>
              <div className="text-xs text-white/50">
                Diseñado para crecer con tus contenidos.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}