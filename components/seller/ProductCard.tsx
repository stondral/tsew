"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Edit,
  MoreHorizontal,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to delete product. Please try again.");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
      alert("An error occurred while deleting the product.");
    } finally {
      setIsDeleting(false);
    }
  };

  const firstMedia = product.media?.[0];

  return (
    <div className="group bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 hover:scale-[1.02] border border-white/20 flex flex-col">
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        {firstMedia ? (
          <Image
            src={resolveMediaUrl(firstMedia)}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-slate-300 text-sm font-bold">No Image</div>
          </div>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          {product.featured && (
            <Badge className="bg-amber-500 text-white border-none shadow-lg shadow-amber-500/30 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-xl">
              Featured
            </Badge>
          )}
          {product.status && (
            <Badge
              className={cn(
                "border-none shadow-lg font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-xl",
                product.status === "live"
                  ? "bg-emerald-500 text-white shadow-emerald-500/30"
                  : product.status === "pending"
                  ? "bg-amber-500 text-white shadow-amber-500/30"
                  : "bg-slate-400 text-white shadow-slate-400/30"
              )}
            >
              {product.status}
            </Badge>
          )}
        </div>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
          <Link href={`/products/${product.slug}`} target="_blank">
            <Button
              size="icon"
              className="bg-white text-slate-900 hover:bg-amber-500 hover:text-white rounded-xl shadow-xl transition-all hover:scale-110 border-none"
            >
              <Eye className="h-5 w-5" />
            </Button>
          </Link>
          <Link href={`/seller/products/edit/${product.id}`}>
            <Button
              size="icon"
              className="bg-white text-slate-900 hover:bg-amber-500 hover:text-white rounded-xl shadow-xl transition-all hover:scale-110 border-none"
            >
              <Edit className="h-5 w-5" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                className="bg-white text-slate-900 hover:bg-rose-500 hover:text-white rounded-xl shadow-xl transition-all hover:scale-110 border-none"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 mt-4 rounded-3xl p-3 border border-slate-100 shadow-2xl"
            >
              <DropdownMenuItem
                onClick={() => router.push(`/seller/products/edit/${product.id}`)}
                className="rounded-xl px-4 py-3 gap-3 font-bold text-slate-600 focus:bg-amber-50 focus:text-amber-600 cursor-pointer"
              >
                <Edit className="h-4 w-4" /> Modify Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl px-4 py-3 gap-3 font-bold text-rose-500 focus:bg-rose-50 focus:text-rose-600 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />{" "}
                {isDeleting ? "Deleting..." : "Remove Product"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-8 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-amber-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
          <p className="text-xl font-black text-slate-900 tabular-nums font-mono tracking-tighter">
            ${product.basePrice}
          </p>
        </div>
        <div className="flex items-center gap-3 mb-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
            SKU: {product.sku || "N/A"}
          </p>
          <div className="h-1 w-1 rounded-full bg-slate-200" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {product.category?.name || "Uncategorized"}
          </p>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {product.stock <= 5 ? (
              <div className="flex items-center gap-1.5 bg-rose-50 text-rose-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter ring-1 ring-rose-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                Low Stock: {product.stock}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter ring-1 ring-emerald-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {product.stock} Units
              </div>
            )}
          </div>
          <Link href={`/seller/products/edit/${product.id}`}>
            <Button
              variant="ghost"
              className="h-10 px-4 text-slate-400 hover:text-amber-600 hover:bg-amber-50/50 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] gap-2 transition-all"
            >
              Manage <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
