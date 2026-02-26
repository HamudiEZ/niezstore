"use client";

import { useMemo, useState } from "react";
import { categories, products as seedProducts } from "../../lib/dummy-data";
import { Button } from "../ui/button";
import { BadgeDollarSign, Boxes, Package, Users } from "lucide-react";

function makeId(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

const INITIAL_FORM = {
  name: "",
  categoryId: "electronica",
  brand: "",
  price: "",
  imageUrl: "",
};

export default function AdminPanel() {
  const initialItems = useMemo(
    () =>
      seedProducts.map((item) => ({
        ...item,
        status: "published",
      })),
    [],
  );

  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState(INITIAL_FORM);
  const [message, setMessage] = useState("");

  const totalProducts = items.length;
  const lowStockCount = items.filter((item) => (item.stock ?? 8) <= 5).length;

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateProduct = (event) => {
    event.preventDefault();
    if (!form.name || !form.price || !form.brand) {
      setMessage("Completa nombre, precio y marca para crear el producto.");
      return;
    }

    const newProduct = {
      id: `${makeId(form.name)}-${Date.now()}`,
      name: form.name,
      categoryId: form.categoryId,
      brand: form.brand,
      price: Number(form.price),
      previousPrice: Number(form.price) * 1.1,
      rating: 4.6,
      reviews: 0,
      discountPercentage: 10,
      imageUrl:
        form.imageUrl ||
        "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80",
      description: "Producto agregado desde el panel admin.",
      status: "draft",
      stock: 12,
    };

    setItems((current) => [newProduct, ...current]);
    setForm(INITIAL_FORM);
    setMessage("Producto creado en estado borrador.");
  };

  const toggleStatus = (id) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "published" ? "draft" : "published" }
          : item,
      ),
    );
  };

  const removeItem = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="soft-card p-4">
          <p className="text-xs text-slate-400">Productos</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-100">{totalProducts}</p>
          <div className="mt-3 inline-flex rounded-lg bg-cyan-500/20 p-2 text-cyan-300">
            <Boxes className="h-4 w-4" />
          </div>
        </article>
        <article className="soft-card p-4">
          <p className="text-xs text-slate-400">Stock bajo</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-100">{lowStockCount}</p>
          <div className="mt-3 inline-flex rounded-lg bg-amber-500/20 p-2 text-amber-300">
            <Package className="h-4 w-4" />
          </div>
        </article>
        <article className="soft-card p-4">
          <p className="text-xs text-slate-400">Usuarios</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-100">1,284</p>
          <div className="mt-3 inline-flex rounded-lg bg-violet-500/20 p-2 text-violet-300">
            <Users className="h-4 w-4" />
          </div>
        </article>
        <article className="soft-card p-4">
          <p className="text-xs text-slate-400">Ventas hoy</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-100">$4,920</p>
          <div className="mt-3 inline-flex rounded-lg bg-emerald-500/20 p-2 text-emerald-300">
            <BadgeDollarSign className="h-4 w-4" />
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <article className="soft-card p-4 md:p-5">
          <h2 className="text-base font-bold text-slate-100">Agregar producto</h2>
          <p className="mt-1 text-xs text-slate-400">Formulario frontend para pruebas rápidas de catálogo.</p>

          <form className="mt-4 space-y-3" onSubmit={handleCreateProduct}>
            <input
              name="name"
              value={form.name}
              onChange={handleFormChange}
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
              placeholder="Nombre del producto"
            />
            <input
              name="brand"
              value={form.brand}
              onChange={handleFormChange}
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
              placeholder="Marca"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                name="price"
                value={form.price}
                onChange={handleFormChange}
                type="number"
                min="1"
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
                placeholder="Precio"
              />
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleFormChange}
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleFormChange}
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
              placeholder="URL imagen (opcional)"
            />

            <Button type="submit" className="w-full">
              Crear producto
            </Button>
            {message ? <p className="text-xs text-cyan-300">{message}</p> : null}
          </form>
        </article>

        <article className="soft-card p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-100">Gestion de productos</h2>
            <span className="text-xs text-slate-400">{items.length} items</span>
          </div>

          <div className="space-y-2">
            {items.slice(0, 12).map((item) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-lg border border-slate-700 bg-slate-900/70 p-3 md:grid-cols-[1.4fr_0.8fr_0.6fr_0.8fr] md:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-100">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.brand} • {item.categoryId}</p>
                </div>
                <p className="text-sm font-bold text-slate-200">${Number(item.price).toFixed(2)}</p>
                <span
                  className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    item.status === "published"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {item.status === "published" ? "Publicado" : "Borrador"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleStatus(item.id)}
                    className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Cambiar estado
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-md border border-rose-500/50 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
