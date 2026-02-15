"use client";

import ProductCard from "./ProductCard";
import { Product } from "@/lib/models/domain/product";

interface Props {
  products: Product[];
  limit?: number;
  view?: "grid" | "list";
}

export default function ProductsGrid({ products, limit, view = "grid" }: Props) {
  const list = limit ? products.slice(0, limit) : products;

  const gridClasses = view === "list"
    ? "flex flex-col gap-6"
    : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";

  return (
    <div className={gridClasses}>
      {list.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          view={view}
          priority={index < 4}
          imageProps={{
            loading: index < 4 ? "eager" : "lazy",
            quality: 65,
            sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 350px",
          }}
        />
      ))}
    </div>
  );
}
