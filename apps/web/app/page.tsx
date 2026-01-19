import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid gap-10">
      <section className="card p-8 md:p-10">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="grid gap-4">
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
              Suscripción mensual, paywall y panel profesional para creadores en Chile.
            </h1>
            <p className="text-white/70">
              UZEED es una plataforma tipo OnlyFans orientada a Chile: membresías mensuales, feed protegido y pagos
              exclusivamente vía Khipu.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/register" className="btn-primary">
                Crear cuenta
              </Link>
              <Link href="/feed" className="btn-secondary">
                Ver feed
              </Link>
            </div>
            <ul className="mt-2 grid gap-2 text-sm text-white/70">
              <li>• Sesiones seguras (cookies httpOnly)</li>
              <li>• Paywall por membresía activa</li>
              <li>• Admin panel para posts + media</li>
              <li>• Webhook idempotente y verificado server-to-server</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/0 border border-white/10 p-8">
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <img src="/brand/isotipo.png" alt="UZEED" className="h-12 w-12" />
                <div>
                  <div className="text-lg font-semibold">UZEED</div>
                  <div className="text-sm text-white/60">MVP serio • listo para escalar</div>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-sm text-white/60">Suscripción mensual</div>
                  <div className="text-xl font-semibold">Acceso total al contenido</div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-sm text-white/60">Pagos</div>
                  <div className="text-xl font-semibold">Khipu (Chile)</div>
                </div>
              </div>
              <div className="text-xs text-white/50">
                Esto es un MVP de producción: backend-first, Docker reproducible, Postgres 17 + Prisma.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <div className="text-sm text-white/60">Seguridad</div>
          <div className="mt-2 font-semibold">Cookies httpOnly, rate limit y roles</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-white/60">Fuente de verdad</div>
          <div className="mt-2 font-semibold">API + Postgres como núcleo</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-white/60">Deploy</div>
          <div className="mt-2 font-semibold">Coolify + Docker multi-stage</div>
        </div>
      </section>
    </div>
  );
}
