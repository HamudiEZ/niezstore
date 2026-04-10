"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { INPUT_LIMITS } from "@/lib/input-limits";
import CharCount from "./CharCount";

const EMPTY_OPTION_EDIT = {
  name: "",
  position: "",
};

const EMPTY_VALUE_EDIT = {
  value: "",
  position: "",
};

export default function ProductOptions({
  selectedProduct,
  form,
  message,
  disabled,
  onChange,
  onSubmit,
  onUpdateOption,
  onDeleteOption,
  onCreateOptionValue,
  onUpdateOptionValue,
  onDeleteOptionValue,
  busyAction,
}) {
  const [editingOptionId, setEditingOptionId] = useState(null);
  const [optionEditForm, setOptionEditForm] = useState(EMPTY_OPTION_EDIT);
  const [newValueByOptionId, setNewValueByOptionId] = useState({});
  const [editingValueId, setEditingValueId] = useState(null);
  const [valueEditForm, setValueEditForm] = useState(EMPTY_VALUE_EDIT);

  const handleStartOptionEdit = (option) => {
    setEditingOptionId(option.id);
    setOptionEditForm({
      name: option.name ?? "",
      position: option.position != null ? String(option.position) : "",
    });
  };

  const handleCancelOptionEdit = () => {
    setEditingOptionId(null);
    setOptionEditForm(EMPTY_OPTION_EDIT);
  };

  const handleOptionEditChange = (event) => {
    const { name, value } = event.target;
    setOptionEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmitOptionEdit = async (event, optionId) => {
    event.preventDefault();
    try {
      await onUpdateOption?.(optionId, {
        name: optionEditForm.name,
        position: optionEditForm.position,
      });
      handleCancelOptionEdit();
    } catch {}
  };

  const handleNewValueChange = (optionId, value) => {
    setNewValueByOptionId((current) => ({ ...current, [optionId]: value }));
  };

  const handleCreateValue = async (optionId) => {
    const value = String(newValueByOptionId[optionId] ?? "").trim();
    if (!value) return;
    try {
      await onCreateOptionValue?.(optionId, { value });
      setNewValueByOptionId((current) => ({ ...current, [optionId]: "" }));
    } catch {}
  };

  const handleStartValueEdit = (value) => {
    setEditingValueId(value.id);
    setValueEditForm({
      value: value.value ?? "",
      position: value.position != null ? String(value.position) : "",
    });
  };

  const handleCancelValueEdit = () => {
    setEditingValueId(null);
    setValueEditForm(EMPTY_VALUE_EDIT);
  };

  const handleValueEditChange = (event) => {
    const { name, value } = event.target;
    setValueEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmitValueEdit = async (event, optionId, valueId) => {
    event.preventDefault();
    try {
      await onUpdateOptionValue?.(optionId, valueId, {
        value: valueEditForm.value,
        position: valueEditForm.position,
      });
      handleCancelValueEdit();
    } catch {}
  };

  return (
    <div className="space-y-4">
      <form className="space-y-3 admin-note p-3" onSubmit={onSubmit}>
        <div>
          <h3 className="text-sm font-semibold admin-title">Nueva opcion</h3>
          <p className="mt-1 text-[11px] admin-muted">
            Define atributos que cambian la variante (Color, RAM, Tamano).
          </p>
        </div>
        <div className="admin-input-wrap">
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            maxLength={INPUT_LIMITS.optionName}
            className="admin-input"
            placeholder="Nombre de la opcion (ej: Color, RAM, Tamano)"
          />
          <CharCount value={form.name} max={INPUT_LIMITS.optionName} />
        </div>
        <div className="admin-input-wrap">
          <input
            name="values"
            value={form.values}
            onChange={onChange}
            maxLength={INPUT_LIMITS.optionValuesCsv}
            className="admin-input"
            placeholder="Valores (ej: Negro, Blanco, Azul)"
          />
          <CharCount value={form.values} max={INPUT_LIMITS.optionValuesCsv} />
        </div>
        <p className="text-[11px] admin-muted">Escribe los valores separados por coma.</p>
        <details className="admin-note px-3 py-2 text-xs">
          <summary className="cursor-pointer admin-subtitle">Orden avanzado (opcional)</summary>
          <div className="mt-2">
            <input
              name="position"
              value={form.position}
              onChange={onChange}
              type="number"
              min="0"
              max={INPUT_LIMITS.optionPositionMax}
              className="admin-input"
              placeholder="Orden de la opcion (opcional)"
            />
          </div>
        </details>
        <Button type="submit" disabled={disabled}>
          {disabled ? "Guardando..." : "Agregar opcion"}
        </Button>
        {message ? <p className="admin-message">{message}</p> : null}
      </form>

      <div>
        <h3 className="text-sm font-semibold admin-title">Opciones actuales</h3>
        {selectedProduct.options?.length ? (
          <div className="mt-3 space-y-3">
            {selectedProduct.options.map((option) => {
              const sortedValues = [...(option.values ?? [])].sort(
                (a, b) => (a.position ?? 0) - (b.position ?? 0)
              );

              return (
                <div
                  key={option.id}
                  className="admin-list-item p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold admin-title">{option.name}</p>
                      <p className="text-xs admin-muted">
                        Posicion: {option.position ?? 0} - Valores: {sortedValues.length}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartOptionEdit(option)}
                        className="variant-action-btn variant-action-btn--edit"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteOption?.(option.id)}
                        className="variant-action-btn variant-action-btn--deactivate"
                        disabled={busyAction === `option-delete-${option.id}`}
                      >
                        {busyAction === `option-delete-${option.id}` ? "..." : "Eliminar"}
                      </button>
                    </div>
                  </div>

                  {editingOptionId === option.id ? (
                    <form
                      className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_130px_auto]"
                      onSubmit={(event) => handleSubmitOptionEdit(event, option.id)}
                    >
                      <div className="admin-input-wrap">
                        <input
                          name="name"
                          value={optionEditForm.name}
                          onChange={handleOptionEditChange}
                          maxLength={INPUT_LIMITS.optionName}
                          className="admin-input h-9 text-xs"
                          placeholder="Nombre"
                        />
                        <CharCount value={optionEditForm.name} max={INPUT_LIMITS.optionName} />
                      </div>
                      <input
                        name="position"
                        value={optionEditForm.position}
                        onChange={handleOptionEditChange}
                        type="number"
                        min="0"
                        max={INPUT_LIMITS.optionPositionMax}
                        className="admin-input h-9 text-xs"
                        placeholder="Posicion"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={busyAction === `option-edit-${option.id}`}
                        >
                          {busyAction === `option-edit-${option.id}` ? "..." : "Guardar"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelOptionEdit}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  ) : null}

                  <div className="mt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide admin-muted">
                      Valores
                    </p>
                    {sortedValues.length ? (
                      <ul className="mt-2 space-y-2">
                        {sortedValues.map((value) => (
                          <li
                            key={value.id}
                            className="admin-note px-2 py-2"
                          >
                            {editingValueId === value.id ? (
                              <form
                                className="grid gap-2 md:grid-cols-[minmax(0,1fr)_88px_auto]"
                                onSubmit={(event) =>
                                  handleSubmitValueEdit(event, option.id, value.id)
                                }
                              >
                                <div className="admin-input-wrap">
                                  <input
                                    name="value"
                                    value={valueEditForm.value}
                                    onChange={handleValueEditChange}
                                    maxLength={INPUT_LIMITS.optionValue}
                                    className="admin-input h-8 text-xs"
                                    placeholder="Valor"
                                  />
                                  <CharCount value={valueEditForm.value} max={INPUT_LIMITS.optionValue} />
                                </div>
                                <input
                                  name="position"
                                  value={valueEditForm.position}
                                  onChange={handleValueEditChange}
                                  type="number"
                                  min="0"
                                  max={INPUT_LIMITS.optionPositionMax}
                                  className="admin-input h-8 text-xs"
                                  placeholder="Pos"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="submit"
                                    className="variant-action-btn variant-action-btn--activate"
                                    disabled={busyAction === `value-edit-${value.id}`}
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    type="button"
                                    className="variant-action-btn variant-action-btn--edit"
                                    onClick={handleCancelValueEdit}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="option-pill rounded-full px-2 py-0.5 text-[11px]">
                                    {value.value}
                                  </span>
                                  <span className="text-[11px] admin-muted">
                                    Posicion: {value.position ?? 0}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="variant-action-btn variant-action-btn--edit"
                                    onClick={() => handleStartValueEdit(value)}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    className="variant-action-btn variant-action-btn--deactivate"
                                    onClick={() => onDeleteOptionValue?.(option.id, value.id)}
                                    disabled={busyAction === `value-delete-${value.id}`}
                                  >
                                    {busyAction === `value-delete-${value.id}` ? "..." : "Borrar"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs admin-muted">Sin valores cargados en esta opcion.</p>
                    )}
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="admin-input-wrap">
                      <input
                        value={newValueByOptionId[option.id] ?? ""}
                        onChange={(event) => handleNewValueChange(option.id, event.target.value)}
                        maxLength={INPUT_LIMITS.optionValue}
                        className="admin-input h-9 text-xs"
                        placeholder="Nuevo valor para esta opcion"
                      />
                      <CharCount value={newValueByOptionId[option.id]} max={INPUT_LIMITS.optionValue} />
                    </div>
                    <button
                      type="button"
                      className="variant-action-btn variant-action-btn--activate"
                      onClick={() => handleCreateValue(option.id)}
                      disabled={busyAction === `value-create-${option.id}`}
                    >
                      {busyAction === `value-create-${option.id}` ? "..." : "Agregar valor"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="admin-empty mt-2">
            <p className="text-sm admin-title">Sin opciones creadas.</p>
            <p className="mt-1 text-xs admin-muted">
              Crea la primera opcion para construir combinaciones de variantes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
