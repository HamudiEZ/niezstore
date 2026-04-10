"use client";

import { useState, useEffect, useCallback } from "react";
import SectionCard from "@/components/ui/section-card";
import { MapPin, Home, Building, Plus, Pencil, Trash2, Star, Loader2 } from "lucide-react";
import { sanitizeNameInput, sanitizePostalCodeInput } from "@/lib/checkout-validation";

const EMPTY_FORM = {
  label: "",
  receiver: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  countryCode: "PY",
  isDefault: false,
};

function AddressForm({ initial = EMPTY_FORM, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let nextValue = value;

    if (name === "postalCode") {
      nextValue = sanitizePostalCodeInput(value);
    } else if (name === "receiver" || name === "city") {
      nextValue = sanitizeNameInput(value);
    }

    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : nextValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const fieldClass =
    "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="label" placeholder="Etiqueta (ej: Casa, Trabajo)" value={form.label} onChange={handleChange} className={fieldClass} maxLength={40} />
        <input name="receiver" placeholder="Destinatario *" value={form.receiver} onChange={handleChange} required className={fieldClass} maxLength={120} />
        <input name="line1" placeholder="Dirección exacta *" value={form.line1} onChange={handleChange} required className={`${fieldClass} sm:col-span-2`} maxLength={180} />
        <input name="line2" placeholder="Piso, Depto, Referencia (opcional)" value={form.line2} onChange={handleChange} className={`${fieldClass} sm:col-span-2`} maxLength={180} />
        <input name="city" placeholder="Ciudad *" value={form.city} onChange={handleChange} required className={fieldClass} maxLength={80} />
        <input name="postalCode" placeholder="Código postal" value={form.postalCode} onChange={handleChange} inputMode="numeric" className={fieldClass} maxLength={10} />
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--foreground)]">
        <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleChange} className="accent-[var(--accent)] h-4 w-4 rounded" />
        Establecer como predeterminada
      </label>

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <button type="submit" disabled={saving} className="btn-ui btn-ui--primary px-4 py-3 sm:py-2 text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto">
          {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</> : "Guardar"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ui btn-ui--ghost px-4 py-3 sm:py-2 text-xs font-bold uppercase rounded-lg w-full sm:w-auto text-center">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function AccountAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/addresses");
      const data = await res.json();
      setAddresses(data.addresses || []);
    } catch {
      setError("No se pudieron cargar las direcciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const handleCreate = async (form) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchAddresses();
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, form) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchAddresses();
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/user/addresses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = (id, addr) => {
    handleUpdate(id, { ...addr, isDefault: true });
  };

  return (
    <div className="space-y-6">
      <SectionCard>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[var(--surface-soft)] flex items-center justify-center text-[var(--accent)] border border-[var(--border)]">
              <MapPin className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] uppercase tracking-tight">Direcciones</h2>
              <p className="text-sm text-[var(--muted)]">Tus puntos de entrega guardados.</p>
            </div>
          </div>

          {!showForm && (
            <button onClick={() => { setShowForm(true); setEditingId(null); }} className="btn-ui btn-ui--primary px-4 py-2 text-xs font-bold uppercase rounded-lg flex items-center gap-2">
              <Plus className="h-3 w-3" /> Nueva
            </button>
          )}
        </div>

        {error && <p className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-400">{error}</p>}

        {/* New address form */}
        {showForm && (
          <div className="mb-6 rounded-xl border border-[var(--accent)]/30 bg-[var(--surface-soft)] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-4">Nueva dirección</p>
            <AddressForm onSave={handleCreate} onCancel={() => setShowForm(false)} saving={saving} />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[var(--muted)]">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando...
          </div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="flex flex-col items-center py-12 text-center">
            <MapPin className="h-10 w-10 text-[var(--muted)]/40 mb-3" />
            <p className="text-sm font-bold text-[var(--foreground)] uppercase tracking-tight">Sin direcciones guardadas</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Agrega tu primera dirección para agilizar tus compras.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((addr) => (
              <div key={addr.id} className="admin-list-item p-4 transition-all duration-300 overflow-hidden w-full relative">
                {editingId === addr.id ? (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-4">Editando dirección</p>
                    <AddressForm
                      initial={{ ...addr, label: addr.label || "", line2: addr.line2 || "", region: addr.region || "", postalCode: addr.postalCode || "" }}
                      onSave={(form) => handleUpdate(addr.id, form)}
                      onCancel={() => setEditingId(null)}
                      saving={saving}
                    />
                  </>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3 w-full min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1 w-full">
                        <div className="h-10 w-10 sm:h-8 sm:w-8 rounded-xl sm:rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                          {addr.label?.toLowerCase().includes("trabajo") ? <Building className="h-5 w-5 sm:h-4 sm:w-4" /> : <Home className="h-5 w-5 sm:h-4 sm:w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[var(--foreground)] uppercase tracking-tight leading-tight truncate">
                            {addr.label || "Dirección"}
                          </p>
                          <p className="text-xs sm:text-[11px] text-[var(--muted)] truncate">{addr.receiver}</p>
                        </div>
                      </div>
                      {addr.isDefault && (
                        <span className="inline-flex w-fit text-[10px] sm:text-[9px] font-black bg-[var(--accent)]/10 text-[var(--accent)] px-2.5 py-1 sm:px-2 sm:py-0.5 rounded-full uppercase tracking-widest border border-[var(--accent)]/20 flex-shrink-0">
                          Predeterminada
                        </span>
                      )}
                    </div>

                    <p className="text-[12px] text-[var(--muted)] leading-relaxed break-all">
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
                      {addr.city}{addr.postalCode ? ` (${addr.postalCode})` : ""}
                    </p>

                    <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-4 border-t border-[var(--border)]">
                      <button onClick={() => setEditingId(addr.id)} className="btn-ui btn-ui--ghost px-3 py-2 sm:py-1 text-[11px] sm:text-[10px] font-bold uppercase rounded-lg sm:rounded-md flex items-center justify-center gap-1 w-full sm:w-auto">
                        <Pencil className="h-3.5 w-3.5 sm:h-3 sm:w-3" /> Editar
                      </button>
                      {!addr.isDefault && (
                        <button onClick={() => handleSetDefault(addr.id, addr)} className="btn-ui btn-ui--ghost px-3 py-2 sm:py-1 text-[11px] sm:text-[10px] font-bold uppercase rounded-lg sm:rounded-md flex items-center justify-center gap-1 w-full sm:w-auto">
                          <Star className="h-3.5 w-3.5 sm:h-3 sm:w-3" /> Predeterminar
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(addr.id)}
                        disabled={deletingId === addr.id}
                        className="btn-ui btn-ui--ghost px-3 py-2 sm:py-1 text-[11px] sm:text-[10px] font-bold uppercase rounded-lg sm:rounded-md flex items-center justify-center gap-1 text-rose-500 hover:text-rose-600 sm:ml-auto w-full sm:w-auto"
                      >
                        {deletingId === addr.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 sm:h-3 sm:w-3" />}
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
