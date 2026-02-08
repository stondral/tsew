"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Star, 
  Clock,
  User,
  ShieldAlert,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  approveProductAction, 
  rejectProductAction, 
  updateFeaturedStatusAction 
} from "../../actions";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface ProductsApprovalClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pendingProducts: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  liveProducts: any[];
}

export function ProductsApprovalClient({ pendingProducts, liveProducts }: ProductsApprovalClientProps) {
  const [activeTab, setActiveTab] = useState("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [featuredDate, setFeaturedDate] = useState<Record<string, string>>({});

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    const result = await approveProductAction(id);
    if (!result.success) {
      alert(result.error);
    }
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    const reason = rejectReason[id];
    if (!reason) {
      alert("Please provide a reason for rejection");
      return;
    }
    setProcessingId(id);
    const result = await rejectProductAction(id, reason);
    if (!result.success) {
      alert(result.error);
    }
    setProcessingId(null);
  };

  const handleFeature = async (id: string, isFeatured: boolean) => {
    const until = featuredDate[id];
    if (isFeatured && !until) {
      alert("Please select an expiration date for the featured status");
      return;
    }
    setProcessingId(id);
    const result = await updateFeaturedStatusAction(id, isFeatured, until);
    if (!result.success) {
      alert(result.error);
    }
    setProcessingId(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ProductCard = ({ product }: { product: any }) => (
    <div key={product.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Image / Thumbnail */}
        <div className="w-full lg:w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden relative border border-slate-200 dark:border-slate-700">
          {product.media?.[0]?.url ? (
            <Image 
                src={product.media[0].url} 
                alt={product.name} 
                className="w-full h-full object-cover"
                fill
                sizes="192px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
                <ShoppingBag className="h-8 w-8" />
            </div>
          )}
          <Badge className="absolute top-3 right-3 bg-white/90 dark:bg-slate-950/90 text-slate-900 dark:text-white font-black text-[9px] uppercase border-none backdrop-blur-md">
            {product.category?.name || "Uncategorized"}
          </Badge>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-black tracking-tight">{product.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Seller: {product.seller?.name || "Unknown Seller"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-indigo-600">₹{product.basePrice}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Base Price</p>
            </div>
          </div>

          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{product.description}</p>

          <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50 flex flex-wrap gap-4 items-center justify-between">
            {activeTab === "pending" ? (
              <div className="flex flex-col gap-4 w-full">
                <div className="flex gap-2">
                    <Input 
                        placeholder="Rejection reason (required for reject)" 
                        className="bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs"
                        value={rejectReason[product.id] || ""}
                        onChange={(e) => setRejectReason({ ...rejectReason, [product.id]: e.target.value })}
                    />
                </div>
                <div className="flex gap-2 w-full">
                    <Button 
                        onClick={() => handleApprove(product.id)}
                        disabled={processingId === product.id}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase rounded-xl h-12"
                    >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve Asset
                    </Button>
                    <Button 
                        onClick={() => handleReject(product.id)}
                        disabled={processingId === product.id}
                        variant="ghost" 
                        className="flex-1 text-rose-500 hover:bg-rose-500 hover:text-white font-black text-xs uppercase rounded-xl h-12 border border-rose-100 dark:border-rose-900/30"
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Access
                    </Button>
                </div>
              </div>
            ) : (
                <div className="flex flex-wrap gap-4 items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Star className={cn("h-4 w-4", product.featured ? "text-amber-500 fill-amber-500" : "text-slate-300")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Featured Status</span>
                        </div>
                        {product.featured && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full">
                                <Clock className="h-3 w-3" />
                                <span className="text-[10px] font-bold">Expires: {new Date(product.featuredUntil).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {!product.featured && (
                            <Input 
                                type="date"
                                className="w-40 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs h-10"
                                value={featuredDate[product.id] || ""}
                                onChange={(e) => setFeaturedDate({ ...featuredDate, [product.id]: e.target.value })}
                            />
                        )}
                        <Button 
                            onClick={() => handleFeature(product.id, !product.featured)}
                            disabled={processingId === product.id}
                            variant={product.featured ? "destructive" : "default"}
                            className={cn(
                                "font-black text-[10px] uppercase rounded-xl h-10 px-6 shrink-0",
                                product.featured ? "" : "bg-amber-500 hover:bg-amber-600 text-white"
                            )}
                        >
                            {product.featured ? "Stop Featuring" : "Allot Featured"}
                        </Button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 scrollbar-hide">
            <TabsList className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl h-14">
                <TabsTrigger value="pending" className="px-8 rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg h-full transition-all">
                    Pending ({pendingProducts.length})
                </TabsTrigger>
                <TabsTrigger value="live" className="px-8 rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg h-full transition-all">
                    Active Catalog
                </TabsTrigger>
            </TabsList>
            
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <span>Verification Protocol V2.4 Active</span>
            </div>
        </div>

        <TabsContent value="pending" className="space-y-6 mt-0">
          {pendingProducts.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 opacity-50">
                <div className="h-24 w-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-black tracking-tight mb-2">Zero Pendings</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All current submissions have been processed</p>
            </div>
          ) : (
            pendingProducts.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </TabsContent>

        <TabsContent value="live" className="space-y-6 mt-0">
          {liveProducts.length === 0 ? (
            <div className="py-20 text-center opacity-50 font-black uppercase text-xs tracking-widest">No active products found</div>
          ) : (
            liveProducts.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
