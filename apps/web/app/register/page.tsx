import AuthForm from "../../components/AuthForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto card p-8">
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>
      <p className="mt-2 text-sm text-white/60">Regístrate para acceder al feed y activar tu membresía.</p>

      <div className="mt-6">
        <AuthForm mode="register" />
      </div>

      <div className="mt-6 text-sm text-white/60">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-white underline">
          Ingresar
        </Link>
      </div>
    </div>
  );
}
