"use client";

import { useCallback, useEffect, useState } from "react";
import CategoryForm from "./CategoryForm";
import AdminSectionCard from "./AdminSectionCard";
import { normalizeSearchTerm } from "@/lib/input-limits";
import { fetchJson } from "@/lib/admin-fetch";

const EMPTY_CATEGORY_FORM = {
  name: "",
  slug: "",
  description: "",
};

const CATEGORY_PAGE_SIZE = 5;

const EMPTY_PAGINATION = {
  page: 1,
  pageSize: 1,
  total: 0,
  totalPages: 1,
  totalAll: 0,
};

export default function CategoriesManager({ onGoToProducts }) {
  const [categories, setCategories] = useState([]);
  const [categoriesMeta, setCategoriesMeta] = useState({
    ...EMPTY_PAGINATION,
    pageSize: CATEGORY_PAGE_SIZE,
  });
  
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [categoryEditId, setCategoryEditId] = useState(null);
  const [categoryEditForm, setCategoryEditForm] = useState(EMPTY_CATEGORY_FORM);

  const [categoryMessage, setCategoryMessage] = useState("");
  const [categoryMessageTone, setCategoryMessageTone] = useState("info");
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");

  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [categoriesPage, setCategoriesPage] = useState(1);

  const refreshCategoriesPage = useCallback(
    async (overrides = {}) => {
      const page = overrides.page ?? categoriesPage;
      const search = String(overrides.search ?? categorySearchTerm).trim();
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(CATEGORY_PAGE_SIZE),
      });
      if (search) params.set("search", search);

      const data = await fetchJson(`/api/admin/categories?${params.toString()}`);
      const nextCategories = data.categories ?? [];
      const nextPagination = data.pagination ?? {};
      const nextPage = nextPagination.page ?? page;
      const nextMeta = {
        page: nextPage,
        pageSize: nextPagination.pageSize ?? CATEGORY_PAGE_SIZE,
        total: nextPagination.total ?? nextCategories.length,
        totalPages: nextPagination.totalPages ?? 1,
        totalAll:
          nextPagination.totalAll ?? data.totalAll ?? nextPagination.total ?? nextCategories.length,
      };

      setCategories(nextCategories);
      setCategoriesMeta(nextMeta);
      if (nextPage !== categoriesPage) {
        setCategoriesPage(nextPage);
      }

      return { categories: nextCategories, meta: nextMeta };
    },
    [categoriesPage, categorySearchTerm]
  );

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        await refreshCategoriesPage();
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, [refreshCategoriesPage]);

  const handleCategoryChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((current) => ({ ...current, [name]: value }));
  };

  const handleCategoryEditChange = (event) => {
    const { name, value } = event.target;
    setCategoryEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleCategorySearchChange = (value) => {
    setCategorySearchTerm(normalizeSearchTerm(value));
    setCategoriesPage(1);
  };

  const handleStartCategoryEdit = (category) => {
    if (!category) return;
    setCategoryEditId(category.id);
    setCategoryEditForm({
      name: category.name ?? "",
      slug: category.slug ?? "",
      description: category.description ?? "",
    });
    setCategoryMessage("");
    setCategoryMessageTone("info");
  };

  const handleCancelCategoryEdit = () => {
    setCategoryEditId(null);
    setCategoryEditForm(EMPTY_CATEGORY_FORM);
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    setCategoryMessage("");
    setCategoryMessageTone("info");
    setError("");
    setBusyAction("category");
    try {
      const payload = {
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim(),
        description: categoryForm.description.trim(),
      };
      await fetchJson("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await refreshCategoriesPage({ page: 1, search: categorySearchTerm });
      setCategoriesPage(1);
      setCategoryForm(EMPTY_CATEGORY_FORM);
      setCategoryMessage("Categoria creada.");
      setCategoryMessageTone("success");
    } catch (err) {
      setCategoryMessage(err.message);
      setCategoryMessageTone("error");
    } finally {
      setBusyAction("");
    }
  };

  const handleUpdateCategory = async (event) => {
    event.preventDefault();
    if (!categoryEditId) return;
    setCategoryMessage("");
    setCategoryMessageTone("info");
    setError("");
    setBusyAction(`category-edit-${categoryEditId}`);
    try {
      const payload = {
        name: categoryEditForm.name.trim(),
        slug: categoryEditForm.slug.trim(),
        description: categoryEditForm.description.trim(),
      };
      await fetchJson(`/api/admin/categories/${categoryEditId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      await refreshCategoriesPage({ page: categoriesPage, search: categorySearchTerm });
      setCategoryMessage("Categoria actualizada.");
      setCategoryMessageTone("success");
      handleCancelCategoryEdit();
    } catch (err) {
      setCategoryMessage(err.message);
      setCategoryMessageTone("error");
    } finally {
      setBusyAction("");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!categoryId) return;
    setCategoryMessage("");
    setCategoryMessageTone("info");
    setError("");
    setBusyAction(`category-delete-${categoryId}`);
    try {
      await fetchJson(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
      await refreshCategoriesPage({ page: categoriesPage, search: categorySearchTerm });
      setCategoryMessage("Categoria eliminada.");
      setCategoryMessageTone("success");
      if (categoryEditId === categoryId) {
        handleCancelCategoryEdit();
      }
    } catch (err) {
      setCategoryMessage(err.message);
      setCategoryMessageTone("error");
    } finally {
      setBusyAction("");
    }
  };

  if (error) {
    return <div className="text-red-500 font-bold p-4">Error: {error}</div>;
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <CategoryForm
        form={categoryForm}
        message={categoryMessage}
        messageTone={categoryMessageTone}
        disabled={busyAction === "category"}
        onChange={handleCategoryChange}
        onSubmit={handleCreateCategory}
        categories={categories}
        totalCount={categoriesMeta.totalAll}
        filteredCount={categoriesMeta.total}
        page={categoriesMeta.page}
        totalPages={categoriesMeta.totalPages}
        pageSize={categoriesMeta.pageSize}
        searchTerm={categorySearchTerm}
        onSearchTermChange={handleCategorySearchChange}
        onPageChange={setCategoriesPage}
        editingCategoryId={categoryEditId}
        editForm={categoryEditForm}
        onStartEdit={handleStartCategoryEdit}
        onEditChange={handleCategoryEditChange}
        onCancelEdit={handleCancelCategoryEdit}
        onSubmitEdit={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        busyAction={busyAction}
      />
      <AdminSectionCard title="Flujo recomendado">
        <p className="text-sm admin-subtitle">
          Crea categorias primero y luego pasa al modulo de productos para
          asignarlas.
        </p>
        <div className="admin-note mt-4 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide admin-subtitle">
            Recordatorio
          </p>
          <p className="mt-1 text-xs admin-muted">
            Si una categoria tiene productos asociados no se puede eliminar.
          </p>
        </div>
        <button
          type="button"
          className="admin-tab admin-tab--active mt-4 px-3 py-2 text-sm font-semibold"
          onClick={onGoToProducts}
        >
          Ir al modulo de productos
        </button>
      </AdminSectionCard>
    </section>
  );
}
