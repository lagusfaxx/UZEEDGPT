import AuthForm from "../../components/AuthForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto card p-8">
      <h1 className="text-2xl font-semibold">Ingresar</h1>
      <p className="mt-2 text-sm text-white/60">Accede a tu dashboard y a tu feed.</p>

      <div className="mt-6">
        <AuthForm mode="login" />
      </div>

      <div className="mt-6 text-sm text-white/60">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-white underline">
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}
