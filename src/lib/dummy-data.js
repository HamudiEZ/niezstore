export const categories = [
  {
    id: "electronica",
    name: "Electronica",
    description: "Smartphones, TV, audio y wearables.",
    imageUrl: "/next.svg",
  },
  {
    id: "computadoras",
    name: "Computadoras",
    description: "Laptops, PCs y accesorios.",
    imageUrl: "/next.svg",
  },
  {
    id: "componentes-pc",
    name: "Componentes PC",
    description: "GPU, RAM, SSD y fuentes.",
    imageUrl: "/next.svg",
  },
  {
    id: "hogar",
    name: "Hogar",
    description: "Electrodomesticos y comfort.",
    imageUrl: "/next.svg",
  },
  {
    id: "moda",
    name: "Moda",
    description: "Ropa, accesorios y fragancias.",
    imageUrl: "/next.svg",
  },
  {
    id: "deportes",
    name: "Deportes",
    description: "Entrenamiento y outdoor.",
    imageUrl: "/next.svg",
  },
  {
    id: "supermercado",
    name: "Supermercado",
    description: "Snacks, bebidas y despensa.",
    imageUrl: "/next.svg",
  },
  {
    id: "motos",
    name: "Motos",
    description: "Cascos, guantes y seguridad.",
    imageUrl: "/next.svg",
  },
];

export const heroDeals = [
  {
    id: "combo-perifericos-pro",
    title: "Perifericos Pro\nPrecision Total",
    subtitle: "Teclados mecanicos y mouse gaming de las mejores marcas.",
    badge: "Bestseller",
    imageUrl:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80",
    backgroundUrl:
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1800&q=80",
    ctaPrimary: "Explorar",
    ctaSecondary: "Ver mas",
    categoryId: "componentes-pc",
  },
  {
    id: "setup-laptop-ultra",
    title: "Laptops y Setup\nProductividad Maxima",
    subtitle: "Equipos para oficina, estudio y creacion de contenido.",
    badge: "Top week",
    imageUrl:
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
    backgroundUrl:
      "https://images.unsplash.com/photo-1527443195645-1133f7f28990?auto=format&fit=crop&w=1800&q=80",
    ctaPrimary: "Comprar",
    ctaSecondary: "Computadoras",
    categoryId: "computadoras",
  },
  {
    id: "smart-tv-cine",
    title: "Smart TV + Audio\nCine en Casa",
    subtitle: "Televisores 4K y barras de sonido con oferta limitada.",
    badge: "Oferta",
    imageUrl:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80",
    backgroundUrl:
      "https://images.unsplash.com/photo-1601944179066-29786cb9d32a?auto=format&fit=crop&w=1800&q=80",
    ctaPrimary: "Comprar",
    ctaSecondary: "Electronica",
    categoryId: "electronica",
  },
];

export const offerBanners = [
  {
    id: "promo-fragancias",
    title: "Perfumes premium",
    subtitle: "Hasta 35% off en fragancias",
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "promo-gpu",
    title: "Zona gamer",
    subtitle: "GPUs y monitores con envio gratis",
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "promo-moto",
    title: "Equipamiento de moto",
    subtitle: "Cascos certificados desde $89",
    color: "from-slate-700 to-slate-900",
  },
  {
    id: "promo-hogar",
    title: "Ventilacion y hogar",
    subtitle: "Ahorra en ventiladores y purificadores",
    color: "from-emerald-500 to-teal-600",
  },
];

export const products = [
  {
    id: "galaxy-s24-ultra",
    name: "Samsung Galaxy S24 Ultra 12GB 1TB",
    price: 999.99,
    previousPrice: 1199.99,
    rating: 4.8,
    reviews: 328,
    categoryId: "electronica",
    brand: "Samsung",
    discountPercentage: 17,
    imageUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    description:
      "Smartphone de alta gama con camara avanzada, pantalla AMOLED y gran autonomia.",
  },
  {
    id: "tv-lg-65-oled",
    name: "LG OLED 65 4K Smart TV",
    price: 1499.99,
    previousPrice: 1799.99,
    rating: 4.9,
    reviews: 143,
    categoryId: "electronica",
    brand: "LG",
    discountPercentage: 16,
    imageUrl:
      "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80",
    description: "Televisor OLED 4K con negro puro y excelente calidad de imagen.",
  },
  {
    id: "laptop-macbook-air",
    name: "Laptop Air 13 M3 16GB",
    price: 1249.99,
    previousPrice: 1399.99,
    rating: 4.8,
    reviews: 211,
    categoryId: "computadoras",
    brand: "Apple",
    discountPercentage: 11,
    imageUrl:
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    description: "Laptop liviana para trabajo creativo con gran bateria.",
  },
  {
    id: "gaming-pc",
    name: "PC Gamer Ryzen 7 RTX 4070",
    price: 1599.99,
    previousPrice: 1799.99,
    rating: 4.9,
    reviews: 67,
    categoryId: "computadoras",
    brand: "Niez",
    discountPercentage: 11,
    imageUrl:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=800&q=80",
    description: "PC gamer para juegos AAA y streaming con alto rendimiento.",
  },
  {
    id: "gpu-rtx-4070",
    name: "NVIDIA GeForce RTX 4070 12GB",
    price: 649.99,
    previousPrice: 749.99,
    rating: 4.8,
    reviews: 152,
    categoryId: "componentes-pc",
    brand: "NVIDIA",
    discountPercentage: 13,
    imageUrl:
      "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80",
    description: "GPU para 1440p y 4K con trazado de rayos.",
  },
  {
    id: "ventilador-torre",
    name: "Ventilador de torre silencioso",
    price: 89.99,
    previousPrice: 119.99,
    rating: 4.4,
    reviews: 77,
    categoryId: "hogar",
    brand: "Midea",
    discountPercentage: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1621905252472-e8a74b11af5f?auto=format&fit=crop&w=800&q=80",
    description: "Ventilador potente con modo noche y control remoto.",
  },
  {
    id: "perfume-nuit",
    name: "Perfume Nuit Noire 100ml",
    price: 59.99,
    previousPrice: 79.99,
    rating: 4.6,
    reviews: 189,
    categoryId: "moda",
    brand: "Maison Noir",
    discountPercentage: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1595425964076-5a4f90f2f6dd?auto=format&fit=crop&w=800&q=80",
    description: "Fragancia elegante amaderada para uso diario o noche.",
  },
  {
    id: "nike-running-shoes",
    name: "Nike Invincible 3 Premium",
    price: 89.99,
    previousPrice: 129.99,
    rating: 4.7,
    reviews: 210,
    categoryId: "deportes",
    brand: "Nike",
    discountPercentage: 31,
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    description: "Zapatillas con alta amortiguacion para running.",
  },
  {
    id: "protein-pack",
    name: "Pack proteina + shaker",
    price: 44.99,
    previousPrice: 56.99,
    rating: 4.5,
    reviews: 94,
    categoryId: "deportes",
    brand: "FitLab",
    discountPercentage: 21,
    imageUrl:
      "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80",
    description: "Suplemento deportivo con shaker incluido.",
  },
  {
    id: "coffee-beans",
    name: "Cafe en grano premium 1kg",
    price: 24.99,
    previousPrice: 29.99,
    rating: 4.7,
    reviews: 258,
    categoryId: "supermercado",
    brand: "Andes Roast",
    discountPercentage: 16,
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    description: "Cafe tostado medio con notas a cacao y frutos secos.",
  },
  {
    id: "motorcycle-helmet",
    name: "Casco de moto integral Niez Pro",
    price: 120.0,
    previousPrice: 160.0,
    rating: 4.5,
    reviews: 98,
    categoryId: "motos",
    brand: "Niez",
    discountPercentage: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
    description: "Casco aerodinamico con certificacion internacional.",
  },
  {
    id: "moto-gloves",
    name: "Guantes de moto reforzados",
    price: 39.99,
    previousPrice: 49.99,
    rating: 4.4,
    reviews: 61,
    categoryId: "motos",
    brand: "RoadSafe",
    discountPercentage: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?auto=format&fit=crop&w=800&q=80",
    description: "Guantes con proteccion en nudillos y buen agarre.",
  },
];

export function getCategoryById(id) {
  return categories.find((category) => category.id === id);
}

export function getProductById(id) {
  return products.find((product) => product.id === id);
}

export function getProductsByCategory(categoryId) {
  return products.filter((product) => product.categoryId === categoryId);
}
