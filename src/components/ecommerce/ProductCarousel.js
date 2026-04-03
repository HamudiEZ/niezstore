import Carousel from "./Carousel";
import ProductCard from "./ProductCard";

/**
 * Product-specific carousel: wraps the generic Carousel
 * with ProductCard children. Scrolls 2 products per arrow click.
 *
 * Props:
 *  - products: array of product card objects
 *  - scrollCount: items to advance per click (default 2)
 */
export default function ProductCarousel({ products = [], scrollCount = 2 }) {
  if (!products.length) return null;

  return (
    <Carousel scrollCount={scrollCount}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} variant="rail" />
      ))}
    </Carousel>
  );
}
