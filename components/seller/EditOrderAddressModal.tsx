"use client";

import { useState } from "react";
import { X, MapPin, Phone, User, Landmark, Building2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateOrderAddressAction } from "@/app/(frontend)/seller/actions/orders";

interface EditOrderAddressModalProps {
  order: {
    id: string;
    orderNumber?: string;
    shippingAddress?: string | {
      id: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    };
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function EditOrderAddressModal({ order, onClose, onSuccess }: EditOrderAddressModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const address = typeof order.shippingAddress === 'object' ? order.shippingAddress : null;
  
  const [formData, setFormData] = useState({
    firstName: address?.firstName || "",
    lastName: address?.lastName || "",
    phone: address?.phone || "",
    address: address?.addressLine1 || "",
    apartment: address?.addressLine2 || "",
    city: address?.city || "",
    state: address?.state || "",
    postalCode: address?.postalCode || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await updateOrderAddressAction(order.id, formData);
      if (result.ok) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Failed to update address");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 p-8 rounded-t-[2.5rem] z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white italic">
                Edit Shipping Address
              </h2>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                Correction Node for {order.orderNumber || order.id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <p className="text-rose-500 text-xs font-bold">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3 text-amber-500" /> First Name
              </label>
              <input
                required
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-amber-500/50 transition-all font-bold text-sm"
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3 text-amber-500" /> Last Name
              </label>
              <input
                required
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-amber-500/50 transition-all font-bold text-sm"
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Phone className="w-3 h-3 text-amber-500" /> Phone Number
            </label>
            <input
              required
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-amber-500/50 transition-all font-bold text-sm"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-3 h-3 text-amber-500" /> Shipping Address Line 1
            </label>
            <input
              required
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-amber-500/50 transition-all font-bold text-sm"
              placeholder="Building name, Street..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Building2 className="w-3 h-3 text-amber-500" /> Apartment / Area (Line 2)
            </label>
            <input
              value={formData.apartment}
              onChange={(e) => handleInputChange("apartment", e.target.value)}
              className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-amber-500/50 transition-all font-bold text-sm"
              placeholder="Flat/Apartment No."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Landmark className="w-3 h-3 text-amber-500" /> City
              </label>
              <input
                required
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-amber-500/50 transition-all font-bold text-sm"
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3 h-3 text-amber-500" /> State
              </label>
              <input
                required
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-amber-500/50 transition-all font-bold text-sm"
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Building2 className="w-3 h-3 text-amber-500" /> Pincode
              </label>
              <input
                required
                value={formData.postalCode}
                onChange={(e) => handleInputChange("postalCode", e.target.value)}
                className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-amber-500/50 transition-all font-bold text-sm"
                placeholder="400XXX"
              />
            </div>
          </div>

          <div className="pt-8 flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              {isLoading ? "Synchronizing..." : "Update Shipping Data"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
