"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export default function ProductImageCarousel({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const list = useMemo(() => images.filter(Boolean), [images]);
  const [index, setIndex] = useState(0);

  const hasMany = list.length > 1;
  const active = list[index] ?? list[0];

  if (!active) return null;

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-[3/4] bg-muted rounded-xl overflow-hidden border">
        <Image
          src={active}
          alt={alt}
          fill
          className="object-cover"
          unoptimized
        />

        {hasMany ? (
          <>
            <button
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white px-3 py-2 rounded-full"
              onClick={() =>
                setIndex((prev) => (prev - 1 + list.length) % list.length)
              }
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white px-3 py-2 rounded-full"
              onClick={() => setIndex((prev) => (prev + 1) % list.length)}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {hasMany ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              className={`relative h-16 w-16 flex-none rounded-md overflow-hidden border ${
                i === index ? "border-black" : "border-gray-200"
              }`}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={src}
                alt={alt}
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
