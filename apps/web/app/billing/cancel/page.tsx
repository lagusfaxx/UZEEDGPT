import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="max-w-xl mx-auto card p-8">
      <h1 className="text-2xl font-semibold">Pago cancelado</h1>
      <p className="mt-2 text-white/60">No se completó el pago en Khipu. Puedes intentarlo nuevamente desde tu dashboard.</p>
      <div className="mt-6">
        <Link className="btn-primary" href="/dashboard">Volver al dashboard</Link>
      </div>
    </div>
  );
}
