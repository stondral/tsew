import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { originPincode, destinationPincode, weight, cartSubtotal = 0 } = body;

        if (!originPincode || !destinationPincode || weight <= 0) {
            return NextResponse.json(
                { error: "Missing required parameters for shipping calculation" },
                { status: 400 }
            );
        }

        // Local math logic: keep free shipping above 500
        let cost = 40;

        // If the cart subtotal is above 499, shipping is free.
        if (cartSubtotal > 499) {
            cost = 0;
        } else {
            // Basic logic: base rate 40 for up to 1kg (1000g), then 20 for each additional kg
            const extraWeightGrams = Math.max(0, weight - 1000);
            const extraKgs = Math.ceil(extraWeightGrams / 1000);
            cost += extraKgs * 20;
        }

        // Rough estimated delivery days based on generic values
        const estimatedDays = Math.abs(parseInt(originPincode) - parseInt(destinationPincode)) > 500000 ? 5 : 3;

        return NextResponse.json({
            cost,
            estimatedDays,
            serviceName: "Standard Delivery",
        });
    } catch (error) {
        console.error("Shipping calculation error:", error);
        return NextResponse.json(
            { error: "Failed to calculate shipping rates" },
            { status: 500 }
        );
    }
}
