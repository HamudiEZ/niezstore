"use client";

import { useCallback, useEffect, useState } from "react";
import ProductForm from "./ProductForm";
import ProductsList from "./ProductsList";
import ProductOptions from "./ProductOptions";
import ProductVariants from "./ProductVariants";
import ProductEditForm from "./ProductEditForm";
import AdminSectionCard from "./AdminSectionCard";
import { normalizeSearchTerm } from "@/lib/input-limits";
import { fetchJson } from "@/lib/admin-fetch";

const EMPTY_PRODUCT_FORM = {
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

const PRODUCT_PAGE_SIZE = 8;
const EMPTY_PAGINATION = { page: 1, pageSize: 1, total: 0, totalPages: 1, totalAll: 0 };

function mapVariantToForm(variant) {
  return {
    sku: variant?.sku ?? "",
    price: variant?.price != null ? String(variant.price) : "",
    compareAtPrice:
      variant?.compareAtPrice != null ? String(variant.compareAtPrice) : "",
    stock: variant?.stock != null ? String(variant.stock) : "",
    imageUrl: variant?.imageUrl ?? "",
    isActive: variant?.isActive !== false,
  };
}

export default function ProductsManager({ externalProductId, onClearExternalProductId }) {
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsMeta, setProductsMeta] = useState({
    ...EMPTY_PAGINATION,
    pageSize: PRODUCT_PAGE_SIZE,
  });
  
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");

  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [editProductForm, setEditProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [optionForm, setOptionForm] = useState(EMPTY_OPTION_FORM);
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT_FORM);
  const [variantEditId, setVariantEditId] = useState(null);
  const [variantEditForm, setVariantEditForm] = useState(EMPTY_VARIANT_FORM);
  const [optionSelections, setOptionSelections] = useState({});

  const [productMessage, setProductMessage] = useState("");
  const [editProductMessage, setEditProductMessage] = useState("");
  const [imageMessage, setImageMessage] = useState("");
  const [optionMessage, setOptionMessage] = useState("");
  const [variantMessage, setVariantMessage] = useState("");
  const [variantEditMessage, setVariantEditMessage] = useState("");
  const [busyAction, setBusyAction] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingImages, setPendingImages] = useState([]);
  const [productsPage, setProductsPage] = useState(1);

  const refreshCategoryOptions = useCallback(async () => {
    const data = await fetchJson("/api/admin/categories?scope=all");
    const nextOptions = data.categories ?? [];
    setCategoryOptions(nextOptions);
    return nextOptions;
  }, []);

  const refreshProductsPage = useCallback(
    async (overrides = {}) => {
      const page = overrides.page ?? productsPage;
      const search = String(overrides.search ?? searchTerm).trim();
      const categoryId = String(overrides.categoryId ?? categoryFilter).trim();
      const status = String(overrides.status ?? statusFilter).trim();
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PRODUCT_PAGE_SIZE),
      });

      if (search) params.set("search", search);
      if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
      if (status && status !== "all") params.set("status", status);

      const data = await fetchJson(`/api/admin/products?${params.toString()}`);
      const nextProducts = data.products ?? [];
      const nextPagination = data.pagination ?? {};
      const nextPage = nextPagination.page ?? page;
      const nextMeta = {
        page: nextPage,
        pageSize: nextPagination.pageSize ?? PRODUCT_PAGE_SIZE,
        total: nextPagination.total ?? nextProducts.length,
        totalPages: nextPagination.totalPages ?? 1,
        totalAll: nextPagination.totalAll ?? nextPagination.total ?? nextProducts.length,
      };

      setProducts(nextProducts);
      setProductsMeta(nextMeta);
      
      if (nextPage !== productsPage) {
        setProductsPage(nextPage);
      }

      return { products: nextProducts, meta: nextMeta };
    },
    [productsPage, searchTerm, categoryFilter, statusFilter]
  );

  const loadProductDetail = useCallback(async (productId) => {
    try {
      const productData = await fetchJson(`/api/admin/products/${productId}`);
      setSelectedProduct(productData.product ?? null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await refreshCategoryOptions();
      } catch (err) {
        console.error("Failed to fetch category options:", err);
      }
    };
    init();
  }, [refreshCategoryOptions]);

  useEffect(() => {
    const load = async () => {
      setLoadingProducts(true);
      setError("");
      try {
        await refreshProductsPage();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingProducts(false);
      }
    };
    load();
  }, [refreshProductsPage]);

  // Handle external product selection (e.g. from Dashboard)
  useEffect(() => {
    if (externalProductId && externalProductId !== selectedProductId) {
      setSelectedProductId(externalProductId);
      if (onClearExternalProductId) onClearExternalProductId();
    }
  }, [externalProductId, selectedProductId, onClearExternalProductId]);

  useEffect(() => {
    if (!categoryOptions.length) return;
    setProductForm((current) => {
      const hasCurrent = categoryOptions.some((entry) => entry.id === current.categoryId);
      if (current.categoryId && hasCurrent) return current;
      return { ...current, categoryId: categoryOptions[0].id };
    });
  }, [categoryOptions]);

  useEffect(() => {
    if (categoryFilter === "all") return;
    const hasFilterCategory = categoryOptions.some((entry) => entry.id === categoryFilter);
    if (!hasFilterCategory) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, categoryOptions]);

  useEffect(() => {
    if (!selectedProductId) {
      setSelectedProduct(null);
      setOptionSelections({});
      setEditProductForm(EMPTY_PRODUCT_FORM);
      return;
    }
    setOptionSelections({});
    setImageMessage("");
    setOptionMessage("");
    setVariantMessage("");
    setVariantEditMessage("");
    setVariantEditId(null);
    setVariantEditForm(EMPTY_VARIANT_FORM);
    loadProductDetail(selectedProductId);
  }, [loadProductDetail, selectedProductId]);

  useEffect(() => {
    if (!selectedProduct) {
      setEditProductForm(EMPTY_PRODUCT_FORM);
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

  useEffect(() => {
    if (!selectedProduct || !variantEditId) return;
    const variant = (selectedProduct.variants || []).find(
      (entry) => entry.id === variantEditId
    );
    if (!variant) {
      setVariantEditId(null);
      setVariantEditForm(EMPTY_VARIANT_FORM);
      setVariantEditMessage("");
      return;
    }
    setVariantEditForm(mapVariantToForm(variant));
  }, [selectedProduct, variantEditId]);

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

  const handleVariantEditChange = (event) => {
    const { name, value, type, checked } = event.target;
    setVariantEditForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleProductSearchChange = (value) => {
    setSearchTerm(normalizeSearchTerm(value));
    setProductsPage(1);
  };

  const handleProductCategoryFilterChange = (value) => {
    setCategoryFilter(value);
    setProductsPage(1);
  };

  const handleProductStatusFilterChange = (value) => {
    setStatusFilter(value);
    setProductsPage(1);
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
      await refreshProductsPage();
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
      await refreshProductsPage();
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
      await refreshProductsPage();
      if (selectedProductId === productId) {
        await loadProductDetail(productId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const handleSelectProduct = (productId) => {
    if (!productId) return;
    setSelectedProductId(productId);
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
      const data = await fetchJson(`/api/admin/products/${selectedProductId}/options`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setOptionForm(EMPTY_OPTION_FORM);
      await loadProductDetail(selectedProductId);
      if (data.deactivatedBaseVariants > 0) {
        setOptionMessage(
          `Opcion creada. Se desactivo ${data.deactivatedBaseVariants} variante base para evitar mezcla de tipos.`
        );
      } else {
        setOptionMessage("Opcion creada.");
      }
    } catch (err) {
      setOptionMessage(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const handleUpdateOption = async (optionId, payload) => {
    if (!selectedProductId || !optionId) return;
    setOptionMessage("");
    setBusyAction(`option-edit-${optionId}`);
    try {
      const body = {
        name: String(payload?.name ?? "").trim(),
      };
      if (payload?.position !== "" && payload?.position != null) {
        body.position = Number(payload.position);
      }
      await fetchJson(
        `/api/admin/products/${selectedProductId}/options/${optionId}`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        }
      );
      await loadProductDetail(selectedProductId);
      setOptionMessage("Opcion actualizada.");
    } catch (err) {
      setOptionMessage(err.message);
      throw err;
    } finally {
      setBusyAction("");
    }
  };

  const handleDeleteOption = async (optionId) => {
    if (!selectedProductId || !optionId) return;
    setOptionMessage("");
    setBusyAction(`option-delete-${optionId}`);
    try {
      await fetchJson(
        `/api/admin/products/${selectedProductId}/options/${optionId}`,
        { method: "DELETE" }
      );
      await loadProductDetail(selectedProductId);
      setOptionMessage("Opcion eliminada.");
    } catch (err) {
      setOptionMessage(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const handleCreateOptionValue = async (optionId, payload) => {
    if (!selectedProductId || !optionId) return;
    setOptionMessage("");
    setBusyAction(`value-create-${optionId}`);
    try {
      const body = { value: String(payload?.value ?? "").trim() };
      await fetchJson(
        `/api/admin/products/${selectedProductId}/options/${optionId}/values`,
        { method: "POST", body: JSON.stringify(body) }
      );
      await loadProductDetail(selectedProductId);
      setOptionMessage("Valor agregado.");
    } catch (err) {
      setOptionMessage(err.message);
      throw err;
    } finally {
      setBusyAction("");
    }
  };

  const handleUpdateOptionValue = async (optionId, valueId, payload) => {
    if (!selectedProductId || !optionId || !valueId) return;
    setOptionMessage("");
    setBusyAction(`value-edit-${valueId}`);
    try {
      const body = { value: String(payload?.value ?? "").trim() };
      if (payload?.position !== "" && payload?.position != null) {
        body.position = Number(payload.position);
      }
      await fetchJson(
        `/api/admin/products/${selectedProductId}/options/${optionId}/values/${valueId}`,
        { method: "PUT", body: JSON.stringify(body) }
      );
      await loadProductDetail(selectedProductId);
      setOptionMessage("Valor actualizado.");
    } catch (err) {
      setOptionMessage(err.message);
      throw err;
    } finally {
      setBusyAction("");
    }
  };

  const handleDeleteOptionValue = async (optionId, valueId) => {
    if (!selectedProductId || !optionId || !valueId) return;
    setOptionMessage("");
    setBusyAction(`value-delete-${valueId}`);
    try {
      await fetchJson(
        `/api/admin/products/${selectedProductId}/options/${optionId}/values/${valueId}`,
        { method: "DELETE" }
      );
      await loadProductDetail(selectedProductId);
      setOptionMessage("Valor eliminado.");
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
          { method: "POST", body: formData }
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
    if (!selectedProductId || !fileList || fileList.length === 0) return;
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
      const MAX_IMAGES = 5;
      for (const file of incoming) {
        if (next.length >= MAX_IMAGES) break;
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!existingKeys.has(key)) {
          next.push(file);
          existingKeys.add(key);
        }
      }
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
    const finalCompareAtPrice = 
      (compareAtPrice != null && compareAtPrice > price) ? compareAtPrice : null;

    if (compareAtPrice != null && !Number.isFinite(compareAtPrice)) {
      setVariantMessage("Precio comparativo invalido.");
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setVariantMessage("Stock invalido.");
      return;
    }

    const optionValueIds =
      selectedProduct?.options?.length > 0
        ? selectedProduct.options.map((option) => optionSelections[option.id]).filter(Boolean)
        : [];

    if (selectedProduct?.options?.length > 0 && optionValueIds.length !== selectedProduct.options.length) {
      setVariantMessage("Selecciona un valor para cada opcion.");
      return;
    }

    setVariantMessage("");
    setBusyAction("variant");
    try {
      const payload = {
        sku: variantForm.sku.trim(),
        price,
        compareAtPrice: finalCompareAtPrice,
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
      await refreshProductsPage();
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
        { method: "PATCH", body: JSON.stringify({ isActive: nextState }) }
      );
      await loadProductDetail(selectedProductId);
      await refreshProductsPage();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const handleStartVariantEdit = (variant) => {
    if (!variant) return;
    setVariantEditId(variant.id);
    setVariantEditForm(mapVariantToForm(variant));
    setVariantEditMessage("");
  };

  const handleCancelVariantEdit = () => {
    setVariantEditId(null);
    setVariantEditForm(EMPTY_VARIANT_FORM);
    setVariantEditMessage("");
  };

  const handleUpdateVariant = async (event) => {
    event.preventDefault();
    if (!selectedProductId || !variantEditId) {
      setVariantEditMessage("Selecciona una variante.");
      return;
    }

    const price = Number(variantEditForm.price);
    const stock = Number(variantEditForm.stock);
    const compareAtPrice =
      variantEditForm.compareAtPrice === "" ? null : Number(variantEditForm.compareAtPrice);

    if (!Number.isFinite(price) || price <= 0) {
      setVariantEditMessage("Precio invalido.");
      return;
    }
    const finalCompareAtPrice = 
      (compareAtPrice != null && compareAtPrice > price) ? compareAtPrice : null;

    if (compareAtPrice != null && !Number.isFinite(compareAtPrice)) {
      setVariantEditMessage("Precio comparativo invalido.");
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setVariantEditMessage("Stock invalido.");
      return;
    }

    setVariantEditMessage("");
    setBusyAction(`variant-edit-${variantEditId}`);
    try {
      const payload = {
        sku: variantEditForm.sku.trim(),
        price,
        compareAtPrice: finalCompareAtPrice,
        stock,
        imageUrl: variantEditForm.imageUrl.trim(),
        isActive: variantEditForm.isActive,
      };
      const data = await fetchJson(
        `/api/admin/products/${selectedProductId}/variants/${variantEditId}`,
        { method: "PATCH", body: JSON.stringify(payload) }
      );

      await loadProductDetail(selectedProductId);
      await refreshProductsPage();
      setVariantEditForm(mapVariantToForm(data.variant));
      setVariantEditMessage("Variante actualizada.");
    } catch (err) {
      setVariantEditMessage(err.message);
    } finally {
      setBusyAction("");
    }
  };

  const imageBusy = busyAction === "images" || busyAction.startsWith("image-");

  if (error) {
    // If there's an error outside the normal operation context
    console.error("ProductsManager error:", error);
  }

  return (
    <>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] mb-8">
        <ProductForm
          form={productForm}
          categories={categoryOptions}
          message={productMessage}
          disabled={busyAction === "product"}
          onChange={handleProductChange}
          onSubmit={handleCreateProduct}
          onSelectImages={handleSelectPendingImages}
          onRemovePendingImage={handleRemovePendingImage}
          pendingImagesCount={pendingImages.length}
          pendingImages={pendingImages}
        />

        <ProductsList
          loading={loadingProducts}
          products={products}
          totalCount={productsMeta.totalAll}
          filteredCount={productsMeta.total}
          categories={categoryOptions}
          selectedProductId={selectedProductId}
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          statusFilter={statusFilter}
          page={productsMeta.page}
          totalPages={productsMeta.totalPages}
          pageSize={productsMeta.pageSize}
          onSearchTermChange={handleProductSearchChange}
          onCategoryFilterChange={handleProductCategoryFilterChange}
          onStatusFilterChange={handleProductStatusFilterChange}
          onPageChange={setProductsPage}
          onSelect={handleSelectProduct}
          onToggleStatus={handleToggleProduct}
          busyAction={busyAction}
        />
      </section>

      <AdminSectionCard
        title="Opciones y variantes"
        description="Selecciona un producto para gestionar detalles, imagenes y stock por variante."
      >
        {!selectedProduct ? (
          <div className="admin-empty">
            <p className="text-sm admin-title">No hay producto seleccionado.</p>
            <p className="mt-1 text-xs admin-muted">
              Usa la lista de productos para abrir uno y editar sus variantes.
            </p>
          </div>
        ) : (
          <div className="space-y-5 min-w-0 flex-1 w-full max-w-full overflow-hidden">
            <div className="admin-list-item p-3 min-w-0 text-left">
              <p className="text-sm font-semibold admin-title truncate max-w-full" title={selectedProduct.name}>
                {selectedProduct.name}
              </p>
              <p className="text-xs admin-muted truncate max-w-full" title={selectedProduct.brand}>
                {selectedProduct.brand || "Sin marca"} -{" "}
                {selectedProduct.category?.name || "Sin categoria"}
              </p>
            </div>

            <ProductEditForm
              form={editProductForm}
              categories={categoryOptions}
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
              onUpdateOption={handleUpdateOption}
              onDeleteOption={handleDeleteOption}
              onCreateOptionValue={handleCreateOptionValue}
              onUpdateOptionValue={handleUpdateOptionValue}
              onDeleteOptionValue={handleDeleteOptionValue}
              busyAction={busyAction}
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
              editVariantId={variantEditId}
              editForm={variantEditForm}
              editMessage={variantEditMessage}
              editDisabled={busyAction === `variant-edit-${variantEditId}`}
              onStartEdit={handleStartVariantEdit}
              onCancelEdit={handleCancelVariantEdit}
              onEditChange={handleVariantEditChange}
              onSubmitEdit={handleUpdateVariant}
              busyAction={busyAction}
            />
          </div>
        )}
      </AdminSectionCard>
    </>
  );
}
