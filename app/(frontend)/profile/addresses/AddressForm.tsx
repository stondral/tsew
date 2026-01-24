"use client";

import { useState } from "react";
import { X, Home, Briefcase, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AddressInput,
  createAddressAction,
  updateAddressAction,
} from "./actions";

interface AddressFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editingAddress?: {
    id: string;
    label: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    apartment: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: "home" | "work" | "other";
    isDefault: boolean;
  };
}

export default function AddressForm({
  onClose,
  onSuccess,
  editingAddress,
}: AddressFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<AddressInput>({
    firstName: editingAddress?.firstName || "",
    lastName: editingAddress?.lastName || "",
    email: editingAddress?.email || "",
    phone: editingAddress?.phone || "",
    address: editingAddress?.address || "",
    apartment: editingAddress?.apartment || "",
    city: editingAddress?.city || "",
    state: editingAddress?.state || "",
    postalCode: editingAddress?.postalCode || "",
    country: editingAddress?.country || "India",
    addressType: editingAddress?.addressType || "home",
    isDefault: editingAddress?.isDefault || false,
    label: editingAddress?.label || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = editingAddress
        ? await updateAddressAction(editingAddress.id, formData)
        : await createAddressAction(formData);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Failed to save address");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof AddressInput,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 md:p-8 rounded-t-[2.5rem]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h2>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {editingAddress
                  ? "Update your delivery information"
                  : "Add a new delivery location"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Address Type */}
          <div>
            <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-3">
              Address Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "home", label: "Home", icon: Home },
                { value: "work", label: "Work", icon: Briefcase },
                { value: "other", label: "Other", icon: MapPin },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleInputChange("addressType", value)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    formData.addressType === value
                      ? "border-orange-200 bg-orange-50 text-orange-600"
                      : "border-gray-100 hover:border-gray-200 text-gray-400"
                  }`}
                >
                  <Icon className="w-5 h-5 mb-2" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-2">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-orange-200 focus:outline-none transition-colors"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-2">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-orange-200 focus:outline-none transition-colors"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-orange-200 focus:outline-none transition-colors"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-2">
                Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-orange-200 focus:outline-none transition-colors"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-2">
              Street Address *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-orange-200 focus:outline-none transition-colors"
              placeholder="123 Main Street"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-2">
              Apartment, Suite, etc.
            </label>
            <input
              type="text"
              value={formData.apartment}
              onChange={(e) => handleInputChange("apartment", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-orange-200 focus:outline-none transition-colors"
              placeholder="Apt 4B"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-2">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-orange-200 focus:outline-none transition-colors"
                placeholder="Mumbai"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-2">
                State *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-orange-200 focus:outline-none transition-colors"
                placeholder="Maharashtra"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-2">
                PIN Code *
              </label>
              <input
                type="text"
                required
                value={formData.postalCode}
                onChange={(e) =>
                  handleInputChange("postalCode", e.target.value)
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-orange-200 focus:outline-none transition-colors"
                placeholder="400001"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-2">
              Country *
            </label>
            <input
              type="text"
              required
              value={formData.country}
              onChange={(e) => handleInputChange("country", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-orange-200 focus:outline-none transition-colors"
              placeholder="India"
            />
          </div>

          {/* Default Address */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => handleInputChange("isDefault", e.target.checked)}
              className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <label
              htmlFor="isDefault"
              className="text-sm font-medium text-gray-900"
            >
              Set as default address
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-black uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase tracking-wider transition-colors"
            >
              {isLoading
                ? "Saving..."
                : editingAddress
                  ? "Update Address"
                  : "Add Address"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
