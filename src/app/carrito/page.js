import Link from "next/link";
import { Button } from "../../components/ui/button";

export default function CartPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
        Carrito
      </h1>

      <section className="soft-card p-6 text-sm text-slate-400">
        Tu carrito esta vacio por ahora.
        <div className="mt-4">
          <Link href="/categorias">
            <Button size="lg">Explorar productos</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
