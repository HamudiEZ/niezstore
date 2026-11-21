import { notFound } from "next/navigation";
import ProductDetailView from "../../../components/ecommerce/ProductDetailView";
import { getProductById, getRelatedProducts } from "../../../lib/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const product = await getProductById(resolvedParams?.id);
  if (!product || !product.isActive) {
    return { title: "Producto no encontrado | Niez Store" };
  }
  return {
    title: `${product.name} | Niez Store`,
    description:
      product.description?.slice(0, 155) ||
      `Compra ${product.name} en Niez Store.`,
  };
}

function toSerializableProduct(product) {
  const options = (product.options ?? [])
    .map((option) => ({
      id: option.id,
      name: option.name,
      position: option.position ?? 0,
      values: (option.values ?? [])
        .map((value) => ({
          id: value.id,
          value: value.value,
          position: value.position ?? 0,
        }))
        .sort((a, b) => a.position - b.position),
    }))
    .sort((a, b) => a.position - b.position);

  const variants = (product.variants ?? []).map((variant) => ({
    id: variant.id,
    sku: variant.sku ?? "",
    price: Number(variant.price),
    compareAtPrice:
      variant.compareAtPrice == null ? null : Number(variant.compareAtPrice),
    stock: variant.stock ?? 0,
    imageUrl: variant.imageUrl ?? "",
    isActive: variant.isActive !== false,
    optionValueMap: Object.fromEntries(
      (variant.variantOptions ?? [])
        .map((entry) => [entry.optionValue?.optionId, entry.optionValueId])
        .filter(([optionId]) => Boolean(optionId))
    ),
  }));

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? "",
    brand: product.brand ?? "",
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
    images: (product.images ?? []).map((image) => ({
      id: image.id,
      url: image.url,
      position: image.position ?? 0,
    })),
    options,
    variants,
  };
}

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const product = await getProductById(resolvedParams?.id);

  if (!product || !product.isActive) {
    return notFound();
  }

  const relatedProducts = product.categoryId
    ? await getRelatedProducts(product.categoryId, product.id, 4)
    : [];

  const serializableProduct = toSerializableProduct(product);

  return (
    <ProductDetailView
      key={serializableProduct.id}
      product={serializableProduct}
      relatedProducts={relatedProducts}
    />
  );
}
