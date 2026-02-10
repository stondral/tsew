"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import StarRating from "./StarRating";
import Image from "next/image";
import { submitReview, updateReview } from "@/app/(frontend)/products/actions/reviews";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
  initialData?: {
    id: string;
    rating: number;
    comment: string;
    images: string[];
  };
  onCancel?: () => void;
}

export default function ReviewForm({ productId, onSuccess, initialData, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(initialData?.rating || 5);
  const [comment, setComment] = useState(initialData?.comment || "");
  const [media, setMedia] = useState<Array<{ id: string; url: string }>>(
    initialData?.images?.map(url => ({ id: url, url })) || []
  );
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isEditing = !!initialData;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const newMedia = [...media];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        newMedia.push({ id: data.media.id, url: data.media.url });
      }
      setMedia(newMedia);
    } catch (err) {
      setError("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please write a comment.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = isEditing 
        ? await updateReview(initialData.id, {
            rating,
            comment,
            images: media.map((m) => m.id),
          })
        : await submitReview({
            productId,
            rating,
            comment,
            images: media.map((m) => m.id),
          });

      if (res.success) {
        if (!isEditing) setSubmitted(true);
        onSuccess?.();
      } else {
        setError(res.error || `Failed to ${isEditing ? 'update' : 'submit'} review.`);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 bg-emerald-50 rounded-[2.5rem] border border-emerald-100"
      >
        <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Review Published!</h3>
        <p className="text-slate-500 font-medium max-w-sm mx-auto">
          Thank you for sharing your experience. Your feedback helps others shop with confidence.
        </p>
      </motion.div>
    );
  }

  return (
    <div className={cn(
      "bg-slate-50/50 rounded-[2.5rem] p-8 md:p-10 border border-slate-100",
      isEditing && "bg-white p-0 border-none shadow-none"
    )}>
      <h3 className="text-2xl font-black text-slate-900 mb-2">
        {isEditing ? "Edit Your Review" : "Write a Review"}
      </h3>
      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">
        {isEditing ? "Refine your feedback" : "Share your masterpiece experience"}
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] pl-1">Your Rating</Label>
          <StarRating 
            rating={rating} 
            size={32} 
            interactive 
            onRatingChange={setRating}
          />
        </div>

        <div className="space-y-4">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] pl-1">Your Thoughts</Label>
          <Textarea 
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you love about this product? How's the quality?"
            className="min-h-[150px] bg-white border-none ring-1 ring-slate-100 focus-visible:ring-amber-500/50 rounded-[2rem] font-medium text-base p-6 shadow-inner resize-none"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] pl-1">Photo Evidence (Optional)</Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {media.map((item, idx) => (
                <motion.div 
                  key={item.id || idx}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="aspect-square relative rounded-2xl overflow-hidden shadow-md group"
                >
                  <Image src={item.url} alt="Review upload" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setMedia(media.filter((_, i) => i !== idx))}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <label className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer group hover:border-amber-500/50">
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={uploading} 
              />
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              ) : (
                <Plus className="h-6 w-6 text-slate-400 group-hover:text-amber-500" />
              )}
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                Add Photo
              </span>
            </label>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          {isEditing && (
            <Button 
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-14 border-slate-200 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-[0.98] transition-all"
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading || uploading}
            className="flex-[2] h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] gap-3 shadow-xl active:scale-[0.98] transition-all"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {isEditing ? 'Updating...' : 'Submitting...'}</>
            ) : (
              isEditing ? "Update Review" : "Publish Review"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
