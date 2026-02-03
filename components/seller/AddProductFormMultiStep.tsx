"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { 
  Plus, 
  Image as ImageIcon, 
  Save, 
  Loader2, 
  DollarSign, 
  Package, 
  ChevronRight,
  ChevronLeft,
  Trash2
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

import { createProductAction } from "@/app/(frontend)/seller/products/new-actions";

interface AddProductFormMultiStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories: any[];
}

const steps = [
  { id: "basics", title: "Product Basics", description: "Essential Information" },
  { id: "pricing", title: "Price & Stock", description: "Commercial Details" },
  { id: "media", title: "Product Images", description: "Visual Assets" },
  { id: "variants", title: "Variants (Optional)", description: "Different Options" },
  { id: "advanced", title: "Advanced Settings", description: "SEO & Policies" },
];

export function AddProductFormMultiStep({ categories }: AddProductFormMultiStepProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    basePrice: "",
    compareAtPrice: "",
    stock: 0,
    sku: "",
    media: [] as Array<{ id: string; url: string }>,
    isActive: true,
    refundPolicy: "7-Days",
    seoTitle: "",
    seoDescription: "",
    variants: [] as Array<{
      name: string;
      sku: string;
      price: string;
      stock: string;
    }>,
  });
  
  const STORAGE_KEY = "stond_add_product_form";

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({
          ...prev,
          ...parsed,
        }));
      } catch (e) {
        console.error("Failed to load form data from localStorage", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!formData.category) {
        setError("Please select a product category.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
        const validVariants = formData.variants.filter(v => 
            v.name.trim() !== '' && 
            v.sku.trim() !== '' && 
            v.price !== '' && 
            v.stock !== ''
        ).map(v => ({
            name: v.name,
            sku: v.sku,
            price: parseFloat(v.price) || 0,
            stock: parseInt(v.stock) || 0,
        }));

        const productData = {
            ...formData,
            media: formData.media.map(m => m.id),
            variants: validVariants
        };
        
        console.log("Submitting product data:", productData);
        const result = await createProductAction(productData);
        console.log("Form submission result:", result);

        if (result.success) {
            localStorage.removeItem(STORAGE_KEY);
            router.push("/seller/products");
            router.refresh();
        } else {
            setError(result.error || "Failed to create product. Please check ALL required fields.");
            setLoading(false);
        }
    } catch (err) {
        console.error("Form submission error:", err);
        const message = err instanceof Error ? err.message : "Failed to create product. Please try again.";
        setError(message);
        setLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: // BASICS
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 mb-2">
                <div className="space-y-1">
                    <Label className="text-sm font-black text-slate-900">Visibility Status</Label>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toggle product availability on storefront</p>
                </div>
                <button
                    type="button"
                    onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                    className={cn(
                        "relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none",
                        formData.isActive ? "bg-emerald-500" : "bg-slate-300"
                    )}
                >
                    <span
                        className={cn(
                            "inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300",
                            formData.isActive ? "translate-x-7" : "translate-x-1"
                        )}
                    />
                </button>
            </div>

            <div className="space-y-4">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] pl-1">Product Title</Label>
                <Input 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Damascus Carbon Steel Knife" 
                    className="h-14 bg-white border-none ring-1 ring-slate-100 focus-visible:ring-amber-500/50 rounded-2xl font-black text-lg shadow-inner"
                />
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] pl-1">Category Choice</Label>
                    <select 
                        className="w-full h-14 bg-white border-none ring-1 ring-slate-100 focus:ring-amber-500/50 rounded-2xl font-black text-sm px-6 appearance-none shadow-inner cursor-pointer"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                        <option value="">Select Collection</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-4">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] pl-1">Internal Slug (URL)</Label>
                    <Input 
                        disabled
                        placeholder="Auto-generated after save" 
                        className="h-14 bg-slate-100/70 border-none ring-1 ring-slate-200 rounded-2xl font-bold text-sm shadow-inner italic cursor-not-allowed opacity-75"
                    />
                    <p className="text-[10px] font-bold text-slate-400 pl-1">Generated automatically from product title</p>
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] pl-1">The Story (Description)</Label>
                <Textarea 
                    required 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the craftsmanship, materials, and passion behind this piece..." 
                    className="min-h-[250px] bg-white border-none ring-1 ring-slate-100 focus-visible:ring-amber-500/50 rounded-[2rem] font-medium text-base p-8 shadow-inner resize-none"
                />
            </div>

            <Button 
              onClick={handleNext} 
              disabled={!formData.name || !formData.category || !formData.description}
              className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] gap-3 shadow-2xl shadow-amber-500/20"
            >
              Continue <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        );

      case 1: // PRICING
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid gap-10 md:grid-cols-2">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <Label className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] pl-1">Base Listing Price ($)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                            <Input 
                                type="text" 
                                inputMode="decimal"
                                required 
                                value={formData.basePrice}
                                onChange={(e) => {
                                    if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                                        setFormData({...formData, basePrice: e.target.value});
                                    }
                                }}
                                placeholder="0.00" 
                                className="h-14 pl-14 bg-white border-none ring-1 ring-slate-100 focus-visible:ring-amber-500/50 rounded-2xl font-black text-xl shadow-inner tabular-nums"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Label className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] pl-1">Compare-at Price ($)</Label>
                        <Input 
                            type="text" 
                            inputMode="decimal"
                            value={formData.compareAtPrice}
                            onChange={(e) => {
                                if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                                    setFormData({...formData, compareAtPrice: e.target.value});
                                }
                            }}
                            placeholder="0.00" 
                            className="h-14 bg-slate-50 border-none ring-1 ring-slate-100 focus-visible:ring-amber-500/50 rounded-2xl font-bold text-sm shadow-inner opacity-60"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <Label className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] pl-1">Available Units (Stock)</Label>
                        <div className="relative">
                            <Package className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
                            <Input 
                                type="text" 
                                inputMode="numeric"
                                required 
                                value={formData.stock}
                                onChange={(e) => {
                                    if (e.target.value === '' || /^\d*$/.test(e.target.value)) {
                                        setFormData({...formData, stock: e.target.value === '' ? 0 : parseInt(e.target.value)});
                                    }
                                }}
                                placeholder="100" 
                                className="h-14 pl-14 bg-white border-none ring-1 ring-slate-100 focus-visible:ring-amber-500/50 rounded-2xl font-black text-xl shadow-inner tabular-nums"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Label className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] pl-1">Reference SKU</Label>
                        <Input 
                            value={formData.sku}
                            onChange={(e) => setFormData({...formData, sku: e.target.value})}
                            placeholder="SKU-PRD-001" 
                            className="h-14 bg-white border-none ring-1 ring-slate-100 focus-visible:ring-amber-500/50 rounded-2xl font-bold text-sm shadow-inner"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-2">
              <Button 
                variant="ghost" 
                onClick={handleBack} 
                className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 h-12 rounded-2xl"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!formData.basePrice || formData.stock === 0}
                className="flex-[2] bg-amber-500 hover:bg-amber-600 h-12 rounded-2xl text-white font-black"
              >
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        );

      case 2: // MEDIA
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid gap-6 md:grid-cols-4">
                {formData.media.map((mediaItem, idx: number) => (
                    <div key={idx} className="aspect-square relative rounded-3xl overflow-hidden border border-slate-100 group">
                        <Image
                            src={mediaItem.url}
                            alt={`Upload ${idx + 1}`}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                                type="button"
                                size="icon" 
                                variant="destructive" 
                                className="h-8 w-8 rounded-lg"
                                onClick={() => {
                                    const newMedia = [...formData.media];
                                    newMedia.splice(idx, 1);
                                    setFormData({...formData, media: newMedia});
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
                <label className="aspect-square border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer group hover:border-amber-500/50">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={uploadingMedia}
                        onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;

                            setUploadingMedia(true);
                            setError(null);

                            try {
                                const uploadedMedia: Array<{ id: string; url: string }> = [];
                                
                                for (const file of Array.from(files)) {
                                    const uploadFormData = new FormData();
                                    uploadFormData.append('file', file);
                                    
                                    const response = await fetch('/api/media/upload', {
                                        method: 'POST',
                                        body: uploadFormData,
                                    });

                                    if (!response.ok) {
                                        throw new Error(`Failed to upload ${file.name}`);
                                    }

                                    const data = await response.json();
                                    uploadedMedia.push({
                                        id: data.media.id,
                                        url: data.media.url
                                    });
                                }

                                setFormData(prev => ({
                                    ...prev,
                                    media: [...prev.media, ...uploadedMedia]
                                }));
                            } catch (err) {
                                const message = err instanceof Error ? err.message : "Failed to upload media. Please try again.";
                                setError(message);
                            } finally {
                                setUploadingMedia(false);
                                e.target.value = '';
                            }
                        }}
                    />
                    <div className="p-4 bg-amber-50 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/10">
                        {uploadingMedia ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 mt-3 tracking-widest">
                        {uploadingMedia ? "Uploading..." : "Upload Media"}
                    </span>
                </label>
                {formData.media.length === 0 && [1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 shadow-inner">
                        <ImageIcon className="h-10 w-10 text-slate-200" />
                    </div>
                ))}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-8 flex items-center gap-2 opacity-60">
                Accepts PNG, JPG, WEBP. Max 10MB per file.
            </p>

            <div className="flex gap-4 pt-2">
              <Button 
                variant="ghost" 
                onClick={handleBack} 
                className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 h-12 rounded-2xl"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleNext} 
                className="flex-[2] bg-amber-500 hover:bg-amber-600 h-12 rounded-2xl text-white font-black"
              >
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        );

      case 3: // VARIANTS
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {formData.variants.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                    <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-500 mb-4">No variants added yet</p>
                    <Button
                        type="button"
                        onClick={() => {
                            setFormData({
                                ...formData,
                                variants: [...formData.variants, { name: "", sku: "", price: "", stock: "" }]
                            });
                        }}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl h-12 px-6 font-black text-sm uppercase tracking-wider gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Add First Variant
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {formData.variants.map((variant, idx) => (
                        <div key={idx} className="p-6 border border-slate-200 rounded-3xl bg-slate-50/50 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-black uppercase text-slate-700 tracking-wider">Variant #{idx + 1}</h4>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                        const newVariants = [...formData.variants];
                                        newVariants.splice(idx, 1);
                                        setFormData({ ...formData, variants: newVariants });
                                    }}
                                    className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Variant Name</Label>
                                    <Input
                                        value={variant.name}
                                        onChange={(e) => {
                                            const newVariants = [...formData.variants];
                                            newVariants[idx].name = e.target.value;
                                            setFormData({ ...formData, variants: newVariants });
                                        }}
                                        placeholder="e.g., Large, Red, XL"
                                        className="h-12 bg-white border-slate-200 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">SKU</Label>
                                    <Input
                                        value={variant.sku}
                                        onChange={(e) => {
                                            const newVariants = [...formData.variants];
                                            newVariants[idx].sku = e.target.value;
                                            setFormData({ ...formData, variants: newVariants });
                                        }}
                                        placeholder="e.g., PROD-L-001"
                                        className="h-12 bg-white border-slate-200 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Price ($)</Label>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={variant.price}
                                        onChange={(e) => {
                                            if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                                                const newVariants = [...formData.variants];
                                                newVariants[idx].price = e.target.value;
                                                setFormData({ ...formData, variants: newVariants });
                                            }
                                        }}
                                        placeholder="0.00"
                                        className="h-12 bg-white border-slate-200 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Stock</Label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        value={variant.stock}
                                        onChange={(e) => {
                                            if (e.target.value === '' || /^\d*$/.test(e.target.value)) {
                                                const newVariants = [...formData.variants];
                                                newVariants[idx].stock = e.target.value;
                                                setFormData({ ...formData, variants: newVariants });
                                            }
                                        }}
                                        placeholder="0"
                                        className="h-12 bg-white border-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <Button
                        type="button"
                        onClick={() => {
                            setFormData({
                                ...formData,
                                variants: [...formData.variants, { name: "", sku: "", price: "", stock: "" }]
                            });
                        }}
                        variant="outline"
                        className="w-full h-12 border-2 border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50 rounded-2xl font-black text-sm uppercase tracking-wider gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Add Another Variant
                    </Button>
                </div>
            )}

            <div className="flex gap-4 pt-2">
              <Button 
                variant="ghost" 
                onClick={handleBack} 
                className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 h-12 rounded-2xl"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleNext} 
                className="flex-[2] bg-amber-500 hover:bg-amber-600 h-12 rounded-2xl text-white font-black"
              >
                Almost Done <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        );

      case 4: // ADVANCED
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] pl-1">Refund Policy</Label>
                    <select 
                        className="w-full h-14 bg-white border-none ring-1 ring-slate-100 focus:ring-amber-500/50 rounded-2xl font-black text-sm px-6 appearance-none shadow-inner cursor-pointer"
                        value={formData.refundPolicy}
                        onChange={(e) => setFormData({...formData, refundPolicy: e.target.value})}
                    >
                        <option value="14-Days">14-Days Return</option>
                        <option value="7-Days">7-Days Return</option>
                        <option value="5-Days">5-Days Return</option>
                        <option value="Contact Customer Care">No Return (Contact Care)</option>
                    </select>
                </div>
            </div>

            <div className="pt-8 border-t border-slate-100 space-y-8">
                <div className="space-y-4">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] pl-1">SEO Title Override</Label>
                    <Input 
                        value={formData.seoTitle}
                        onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
                        placeholder={formData.name || "Custom SEO Title"} 
                        className="h-14 bg-white border-none ring-1 ring-slate-100 focus-visible:ring-emerald-500/50 rounded-2xl font-bold text-sm shadow-inner"
                    />
                </div>

                <div className="space-y-4">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] pl-1">SEO Description</Label>
                    <Textarea 
                        value={formData.seoDescription}
                        onChange={(e) => setFormData({...formData, seoDescription: e.target.value})}
                        placeholder="Brief summary for search engine results..." 
                        className="min-h-[120px] bg-white border-none ring-1 ring-slate-100 focus-visible:ring-emerald-500/50 rounded-[2rem] font-medium text-sm p-6 shadow-inner resize-none"
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-2">
              <Button 
                variant="ghost" 
                onClick={handleBack} 
                className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 h-12 rounded-2xl"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="flex-[2] bg-amber-500 hover:bg-amber-600 h-12 rounded-2xl text-white font-black gap-3"
              >
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Launching...</> : <><Save className="h-5 w-5" /> Launch Product</>}
              </Button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border border-white/20 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        {/* Progress indicator */}
        <div className="flex gap-2 p-10 pb-0">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "h-2 flex-1 rounded-full transition-all duration-500",
                idx <= currentStep ? "bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]" : "bg-slate-100"
              )}
            />
          ))}
        </div>

        <CardHeader className="p-10 pb-6">
          <div className="text-center">
            <CardTitle className="text-3xl font-black tracking-tight text-slate-900 mb-2">{steps[currentStep].title}</CardTitle>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{steps[currentStep].description}</p>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-0">
          {error && (
              <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 text-sm font-bold flex items-center gap-3 mb-6"
              >
                  <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  {error}
              </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
