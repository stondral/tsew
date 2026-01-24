"use client";

import { useEffect, useState } from "react";
import { Product } from "./product";
import { getProductById } from "./getProductById";

export function useProduct(productId: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    getProductById(productId).then((p) => {
      if (alive) {
        setProduct(p);
        setLoading(false);
      }
    });

    return () => {
      alive = false;
    };
  }, [productId]);

  return { product, loading };
}
