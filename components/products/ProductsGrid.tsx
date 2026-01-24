"use client";

import ProductCard from "./ProductCard";
import { Product } from "@/lib/models/domain/product";

interface Props {
  products: Product[];
  limit?: number;
}

export default function ProductsGrid({ products, limit }: Props) {
  const list = limit ? products.slice(0, limit) : products;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {list.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
