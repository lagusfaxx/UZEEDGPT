import type { Metadata } from "next";
import "./globals.css";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: "UZEED",
  description: "Suscripciones mensuales y paywall para creadores. Chile. Khipu."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Nav />
        <main className="container py-10">{children}</main>
        <footer className="border-t border-white/10 py-10">
          <div className="container text-sm text-white/60 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <img src="/brand/logo.png" alt="UZEED" className="h-6" />
              <span>© {new Date().getFullYear()} UZEED</span>
            </div>
            <span>Pagos vía Khipu • Contenido protegido</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
