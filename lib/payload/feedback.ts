"use server"

import { getPayload } from "payload";
import config from "@/payload.config";

export async function submitFeedback(formData: {
  name: string;
  email: string;
  phone: string;
  userRole: 'buyer' | 'seller';
  visualAppeal?: number;
  discoverySource?: string;
  platformInterest?: string;
  categories?: string[];
  problemsSolved?: string;
  sellerUiFeedback?: string;
  wantsToJoin?: string;
  improvements: string;
  otherCategory?: string;
}) {
  try {
    const payload = await getPayload({ config });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).create({
      collection: "feedback",
      data: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        userRole: formData.userRole,
        // Buyer fields
        visualAppeal: formData.visualAppeal,
        discoverySource: formData.discoverySource,
        platformInterest: formData.platformInterest,
        categories: formData.categories,
        // Seller fields
        problemsSolved: formData.problemsSolved,
        sellerUiFeedback: formData.sellerUiFeedback,
        wantsToJoin: formData.wantsToJoin,
        // Common field
        improvements: formData.improvements,
        otherCategory: formData.otherCategory,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return { success: false, error: "Failed to submit feedback. Please try again." };
  }
}
