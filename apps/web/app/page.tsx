import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid gap-10">
      <section className="card p-8 md:p-12">
        <div className="grid gap-6 max-w-2xl">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Plataforma lista para producción
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
            Monetiza tu contenido con un paywall premium.
          </h1>
          <p className="text-white/70">
            Membresías mensuales, contenido protegido y pagos locales integrados. Todo en un solo lugar.
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
          <div className="grid gap-2 text-sm text-white/60">
            <span>• Panel de contenido simple para creadores</span>
            <span>• Paywall y membresías con activación automática</span>
            <span>• Pagos locales con Khipu</span>
          </div>
        </div>
      </section>
    </div>
  );
}
