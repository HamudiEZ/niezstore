"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminStats from "./AdminStats";
import CategoryForm from "./CategoryForm";
import ProductForm from "./ProductForm";
import ProductsList from "./ProductsList";
import ProductOptions from "./ProductOptions";
import ProductVariants from "./ProductVariants";
import ProductEditForm from "./ProductEditForm";

const EMPTY_CATEGORY_FORM = {
  name: "",
  slug: "",
  description: "",
};

const EMPTY_PRODUCT_FORM = {
  name: "",
  description: "",
  brand: "",
  categoryId: "",
  slug: "",
  isActive: true,
};

const EMPTY_EDIT_PRODUCT_FORM = {
  name: "",
  description: "",
  brand: "",
  categoryId: "",
  slug: "",
  isActive: true,
};

const EMPTY_OPTION_FORM = {
  name: "",
  values: "",
  position: "",
};

const EMPTY_VARIANT_FORM = {
  sku: "",
  price: "",
  compareAtPrice: "",
  stock: "",
  imageUrl: "",
  isActive: true,
};

async function fetchJson(url, options) {
  const headers = { ...(options?.headers ?? {}) };
  if (options?.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Ocurrio un error inesperado.");
  }
  return data;
}

export default function AdminPanel() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [editProductForm, setEditProductForm] = useState(
    EMPTY_EDIT_PRODUCT_FORM
  );
  const [optionForm, setOptionForm] = useState(EMPTY_OPTION_FORM);
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT_FORM);
  const [optionSelections, setOptionSelections] = useState({});

  const [categoryMessage, setCategoryMessage] = useState("");
  const [productMessage, setProductMessage] = useState("");
  const [editProductMessage, setEditProductMessage] = useState("");
  const [imageMessage, setImageMessage] = useState("");
  const [optionMessage, setOptionMessage] = useState("");
  const [variantMessage, setVariantMessage] = useState("");
  const [busyAction, setBusyAction] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingImages, setPendingImages] = useState([]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const allVariants = products.flatMap((product) => product.variants ?? []);
    const totalVariants = allVariants.length;
    const lowStockCount = allVariants.filter((variant) => variant.stock <= 5).length;
    const totalCategories = categories.length;
    return { totalProducts, totalVariants, lowStockCount, totalCategories };
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter !== "all" && product.categoryId !== categoryFilter) {
        return false;
      }
      if (statusFilter === "active" && !product.isActive) return false;
      if (statusFilter === "inactive" && product.isActive) return false;
      if (!query) return true;
      const haystack = [
        product.name,
        product.brand,
        product.slug,
        product.category?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const refreshProducts = useCallback(async () => {
    const productData = await fetchJson("/api/admin/products");
    setProducts(productData.products ?? []);
  }, []);

  const loadProductDetail = useCallback(async (productId) => {
    const productData = await fetchJson(`/api/admin/products/${productId}`);
    setSelectedProduct(productData.product ?? null);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [categoryData, productData] = await Promise.all([
          fetchJson("/api/admin/categories"),
          fetchJson("/api/admin/products"),
        ]);
        const nextCategories = categoryData.categories ?? [];
        const nextProducts = productData.products ?? [];
        if (!active) return;
        setCategories(nextCategories);
        setProducts(nextProducts);
        if (nextCategories.length > 0) {
          setProductForm((current) =>
            current.categoryId
              ? current
              : { ...current, categoryId: nextCategories[0].id },
          );
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProductId) {
      setSelectedProduct(null);
      setOptionSelections({});
      setEditProductForm(EMPTY_EDIT_PRODUCT_FORM);
      return;
    }
    setOptionSelections({});
    setImageMessage("");
    setOptionMessage("");
    setVariantMessage("");
    loadProductDetail(selectedProductId).catch((err) => setError(err.message));
  }, [loadProductDetail, selectedProductId]);

  useEffect(() => {
    if (!selectedProduct) {
      setEditProductForm(EMPTY_EDIT_PRODUCT_FORM);
      return;
    }
    setEditProductForm({
      name: selectedProduct.name ?? "",
      description: selectedProduct.description ?? "",
      brand: selectedProduct.brand ?? "",
      categoryId: selectedProduct.categoryId ?? "",
      slug: selectedProduct.slug ?? "",
      isActive: selectedProduct.isActive !== false,
    });
  }, [selectedProduct]);

  const handleCategoryChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((current) => ({ ...current, [name]: value }));
  };

  const handleProductChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProductForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditProductChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditProductForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleOptionChange = (event) => {
    const { name, value } = event.target;
    setOptionForm((current) => ({ ...current, [name]: value }));
  };

  const handleVariantChange = (event) => {
    const { name, value, type, checked } = event.target;
    setVariantForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    setCategoryMessage("");
    setError("");
    setBusyAction("category");
    try {
      const payload = {
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim(),
        description: categoryForm.description.trim(),
      };
      const data = await fetchJson("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCategories((current) => [data.category, ...current]);
      setCategoryForm(EMPTY_CATEGORY_FORM);
      setCategoryMessage("Categoria creada.");
      if (!productForm.categoryId) {
        setProductForm((current) => ({ ...current, categoryId: data.category.id }));
      }
    } catch (err) {
      setCategoryMessage(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setProductMessage("");
    setError("");
    setBusyAction("product");
    try {
      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        brand: productForm.brand.trim(),
        categoryId: productForm.categoryId,
        slug: productForm.slug.trim(),
        isActive: productForm.isActive,
      };
      const data = await fetchJson("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setProductForm((current) => ({
        ...EMPTY_PRODUCT_FORM,
        categoryId: current.categoryId || data.product.categoryId,
      }));
      if (pendingImages.length > 0) {
        await uploadImagesForProduct(data.product.id, pendingImages);
        setPendingImages([]);
      }
      await refreshProducts();
      setSelectedProductId(data.product.id);
      setProductMessage("Producto creado.");
    } catch (err) {
      setProductMessage(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const handleUpdateProduct = async (event) => {
    event.preventDefault();
    if (!selectedProductId) return;
    setEditProductMessage("");
    setError("");
    setBusyAction("product-edit");
    try {
      const payload = {
        name: editProductForm.name.trim(),
        description: editProductForm.description.trim(),
        brand: editProductForm.brand.trim(),
        categoryId: editProductForm.categoryId,
        slug: editProductForm.slug.trim(),
        isActive: editProductForm.isActive,
      };
      await fetchJson(`/api/admin/products/${selectedProductId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      await refreshProducts();
      await loadProductDetail(selectedProductId);
      setEditProductMessage("Producto actualizado.");
    } catch (err) {
      setEditProductMessage(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const handleResetEditProduct = () => {
    if (!selectedProduct) return;
    setEditProductForm({
      name: selectedProduct.name ?? "",
      description: selectedProduct.description ?? "",
      brand: selectedProduct.brand ?? "",
      categoryId: selectedProduct.categoryId ?? "",
      slug: selectedProduct.slug ?? "",
      isActive: selectedProduct.isActive !== false,
    });
  };

  const handleToggleProduct = async (productId, nextState) => {
    setError("");
    setBusyAction(`toggle-${productId}`);
    try {
      await fetchJson(`/api/admin/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: nextState }),
      });
      await refreshProducts();
      if (selectedProductId === productId) {
        await loadProductDetail(productId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const handleCreateOption = async (event) => {
    event.preventDefault();
    if (!selectedProductId) {
      setOptionMessage("Selecciona un producto.");
      return;
    }

    setOptionMessage("");
    setBusyAction("option");
    try {
      const values = optionForm.values
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const payload = {
        name: optionForm.name.trim(),
        values,
      };
      if (optionForm.position !== "" && optionForm.position != null) {
        payload.position = Number(optionForm.position) || 0;
      }
      await fetchJson(`/api/admin/products/${selectedProductId}/options`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setOptionForm(EMPTY_OPTION_FORM);
      await loadProductDetail(selectedProductId);
      setOptionMessage("Opcion creada.");
    } catch (err) {
      setOptionMessage(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const handleVariantSelection = (optionId, valueId) => {
    setOptionSelections((current) => ({ ...current, [optionId]: valueId }));
  };

  const uploadFilesToCloudinary = useCallback(async (files) => {
    if (!files || files.length === 0) return [];
    const signature = await fetchJson("/api/uploads/cloudinary", { method: "POST" });
    const uploads = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signature.apiKey);
        formData.append("timestamp", signature.timestamp);
        formData.append("signature", signature.signature);
        formData.append("folder", signature.folder);
        formData.append("allowed_formats", signature.allowedFormats);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error?.message || "Error subiendo imagen.");
        }
        return data.secure_url;
      })
    );

    return uploads;
  }, []);

  const uploadImagesForProduct = useCallback(
    async (productId, files) => {
      const urls = await uploadFilesToCloudinary(files);
      if (urls.length === 0) return;
      await fetchJson(`/api/admin/products/${productId}/images`, {
        method: "POST",
        body: JSON.stringify({ urls }),
      });
    },
    [uploadFilesToCloudinary]
  );

  const handleUploadImages = async (fileList) => {
    if (!selectedProductId || !fileList || fileList.length === 0) {
      return;
    }

    setImageMessage("");
    setBusyAction("images");
    try {
      const files = Array.from(fileList);
      await uploadImagesForProduct(selectedProductId, files);

      await loadProductDetail(selectedProductId);
      setImageMessage("Imagenes cargadas.");
    } catch (err) {
      setImageMessage(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const handleSelectPendingImages = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.isArray(fileList) ? fileList : Array.from(fileList);
    setPendingImages((current) => {
      const existingKeys = new Set(
        current.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
      );
      const next = [...current];
      incoming.forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!existingKeys.has(key)) {
          next.push(file);
          existingKeys.add(key);
        }
      });
      return next;
    });
  };

  const handleRemovePendingImage = (index) => {
    setPendingImages((current) => current.filter((_, idx) => idx !== index));
  };

  const handleRemoveImage = async (imageId) => {
    if (!selectedProductId) return;
    setImageMessage("");
    setBusyAction(`image-${imageId}`);
    try {
      await fetchJson(
        `/api/admin/products/${selectedProductId}/images/${imageId}`,
        { method: "DELETE" }
      );
      await loadProductDetail(selectedProductId);
    } catch (err) {
      setImageMessage(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const handleCreateVariant = async (event) => {
    event.preventDefault();
    if (!selectedProductId) {
      setVariantMessage("Selecciona un producto.");
      return;
    }

    const price = Number(variantForm.price);
    const stock = Number(variantForm.stock);
    const compareAtPrice =
      variantForm.compareAtPrice === "" ? null : Number(variantForm.compareAtPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setVariantMessage("Precio invalido.");
      return;
    }
    if (compareAtPrice != null && (!Number.isFinite(compareAtPrice) || compareAtPrice <= 0)) {
      setVariantMessage("Precio comparativo invalido.");
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setVariantMessage("Stock invalido.");
      return;
    }

    const optionValueIds =
      selectedProduct?.options?.length > 0
        ? selectedProduct.options
            .map((option) => optionSelections[option.id])
            .filter(Boolean)
        : [];

    if (
      selectedProduct?.options?.length > 0 &&
      optionValueIds.length !== selectedProduct.options.length
    ) {
      setVariantMessage("Selecciona un valor para cada opcion.");
      return;
    }

    setVariantMessage("");
    setBusyAction("variant");
    try {
      const payload = {
        sku: variantForm.sku.trim(),
        price,
        compareAtPrice,
        stock,
        imageUrl: variantForm.imageUrl.trim(),
        isActive: variantForm.isActive,
        optionValueIds,
      };
      await fetchJson(`/api/admin/products/${selectedProductId}/variants`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setVariantForm(EMPTY_VARIANT_FORM);
      setOptionSelections({});
      await loadProductDetail(selectedProductId);
      await refreshProducts();
      setVariantMessage("Variante creada.");
    } catch (err) {
      setVariantMessage(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const handleToggleVariant = async (variantId, nextState) => {
    if (!selectedProductId) return;
    setError("");
    setBusyAction(`variant-toggle-${variantId}`);
    try {
      await fetchJson(
        `/api/admin/products/${selectedProductId}/variants/${variantId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: nextState }),
        }
      );
      await loadProductDetail(selectedProductId);
      await refreshProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const imageBusy = busyAction === "images" || busyAction.startsWith("image-");

  return (
    <div className="space-y-5">
      <AdminStats stats={stats} />

      {error ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <CategoryForm
          form={categoryForm}
          message={categoryMessage}
          disabled={busyAction === "category"}
          onChange={handleCategoryChange}
          onSubmit={handleCreateCategory}
        />
        <ProductForm
          form={productForm}
          categories={categories}
          message={productMessage}
          disabled={busyAction === "product"}
          onChange={handleProductChange}
          onSubmit={handleCreateProduct}
          onSelectImages={handleSelectPendingImages}
          onRemovePendingImage={handleRemovePendingImage}
          pendingImagesCount={pendingImages.length}
          pendingImages={pendingImages}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ProductsList
          loading={loading}
          products={filteredProducts}
          totalCount={products.length}
          categories={categories}
          selectedProductId={selectedProductId}
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          statusFilter={statusFilter}
          onSearchTermChange={setSearchTerm}
          onCategoryFilterChange={setCategoryFilter}
          onStatusFilterChange={setStatusFilter}
          onSelect={setSelectedProductId}
          onToggleStatus={handleToggleProduct}
          busyAction={busyAction}
        />
        <div className="soft-card p-4 md:p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-100">Opciones y variantes</h2>
            <p className="mt-1 text-xs text-slate-400">
              Selecciona un producto para gestionar opciones y variantes.
            </p>
          </div>

          {!selectedProduct ? (
            <p className="text-sm text-slate-400">No hay producto seleccionado.</p>
          ) : (
            <div className="space-y-5">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-sm font-semibold text-slate-100">
                  {selectedProduct.name}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedProduct.brand || "Sin marca"} •{" "}
                  {selectedProduct.category?.name || "Sin categoria"}
                </p>
              </div>

              <ProductEditForm
                form={editProductForm}
                categories={categories}
                message={editProductMessage}
                disabled={busyAction === "product-edit"}
                images={selectedProduct.images || []}
                imageMessage={imageMessage}
                imageDisabled={imageBusy}
                onUploadImages={handleUploadImages}
                onRemoveImage={handleRemoveImage}
                onChange={handleEditProductChange}
                onSubmit={handleUpdateProduct}
                onReset={handleResetEditProduct}
              />

              <ProductOptions
                selectedProduct={selectedProduct}
                form={optionForm}
                message={optionMessage}
                disabled={busyAction === "option"}
                onChange={handleOptionChange}
                onSubmit={handleCreateOption}
              />

              <ProductVariants
                selectedProduct={selectedProduct}
                form={variantForm}
                optionSelections={optionSelections}
                message={variantMessage}
                disabled={busyAction === "variant"}
                onChange={handleVariantChange}
                onSelectOptionValue={handleVariantSelection}
                onSubmit={handleCreateVariant}
                onToggleStatus={handleToggleVariant}
                busyAction={busyAction}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
