"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { bedrockClient, NOVA_LITE_MODEL_ID } from "@/lib/ai/client";
import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { headers } from "next/headers";

/**
 * Analyzes user's style based on order history
 */
export async function analyzeUserStyleAction() {
    const payload = await getPayload({ config });
    const headerStack = await headers();
    const { user } = await payload.auth({ headers: headerStack });

    if (!user) {
        return { error: "Please log in to see your personalized style analysis." };
    }

    try {
        // 1. Get last 10 orders for this user
        const orders = await payload.find({
            collection: 'orders',
            where: {
                user: { equals: user.id }
            },
            sort: '-createdAt',
            limit: 10,
        });

        if (orders.totalDocs === 0) {
            return { 
                analysis: "It looks like you haven't made any orders yet! Once you do, I'll be able to analyze your specific taste. For now, I can suggest some of our most popular trends.",
                recommendations: await getTrendingProducts(payload)
            };
        }

        // 2. Extract unique product IDs and fetch their tags
        const productIds = new Set<string>();
        orders.docs.forEach(order => {
            order.items?.forEach((item: Record<string, unknown>) => {
                if (item.productId) productIds.add(String(item.productId));
            });
        });

        const products = await payload.find({
            collection: 'products',
            where: {
                id: { in: Array.from(productIds) }
            },
            depth: 0
        });

        const allTags = new Set<string>();
        products.docs.forEach((product: Record<string, unknown>) => {
            if (product.tags && Array.isArray(product.tags)) {
                product.tags.forEach((t: Record<string, unknown>) => {
                   if (t.tag) allTags.add(String(t.tag).toLowerCase());
                });
            }
        });

        const tagsList = Array.from(allTags);

        if (tagsList.length === 0) {
            return {
                analysis: "I see your orders, but I'm still learning about the specific styles you like. Check out these curated pieces in the meantime!",
                recommendations: await getTrendingProducts(payload)
            };
        }

        // 3. Send to Nova for analysis
        const analysisPrompt = `
            Analyze this list of fashion tags from a user's purchase history and define their style profile.
            Tags: ${tagsList.join(", ")}
            
            Return a JSON object with:
            1. "analysis": A 2-sentence sophisticated summary of their style (e.g. "You lean towards minimalist urban aesthetics...").
            2. "searchKeywords": Top 3 keywords to search for products they would LOVE (e.g. ["monochrome", "linen", "oversized"]).
            3. "explanation": A very brief explanation of WHY you picked these.
            
            Return ONLY the raw JSON.
        `;

        const aiResponse = await callNova(analysisPrompt);
        
        // 4. Fetch actual recommendations based on AI keywords
        const recommendations = await getActualProductsFromKeywords(payload, aiResponse.searchKeywords || []);

        return {
            analysis: aiResponse.analysis,
            explanation: aiResponse.explanation,
            recommendations: recommendations
        };

    } catch (err) {
        console.error("[StyleAdvisor] Action Error:", err);
        return { error: "I had a bit of trouble analyzing your style. Let's try again in a moment." };
    }
}

/**
 * Gets style recommendations based on a user's text query, chat history, and optional image
 */
export async function getStyleRecommendationsAction(query: string, history: Record<string, unknown>[] = [], image?: string | null) {
    const payload = await getPayload({ config });
    const headerStack = await headers();
    const { user } = await payload.auth({ headers: headerStack });

    try {
        // Sanitise history to avoid "temporary client reference" dotting errors in Next.js
        const cleanHistory = history.map(m => ({
            role: String(m.role || ""),
            content: String(m.content || "")
        }));

        const historyContext = cleanHistory.slice(-4).map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
        
        const prompt = `
            You are "Nova", a sophisticated AI Discovery Expert for "TSEW". 
            Your goal is to provide expert, direct advice on products and orchestrate demo-ready shopping actions.
            
            ${image ? "The user has uploaded a photo of an item. Analyze its features, style, and use-case from the image provided." : ""}

            CONTEXT HISTORY:
            ${historyContext}

            CURRENT USER REQUEST: "${query}"
            
            TASK: 
            - Help the user find and explore products across all categories (electronics, lifestyle, home goods, etc.).
            - Respond DIRECTLY to the user with helpful and sophisticated advice. 
            
            Return a JSON object with:
            1. "analysis": A CONCISE (max 2 sentences), expert response addressed TO THE USER. 
            2. "recommendedItems": A list of 2-3 specific property-based product descriptors (e.g., ["noise cancelling headphones", "minimalist desk lamp", "leather backpack"]). 
               IMPORTANT: Be specific about materials, colors, or technical features. Avoid broad terms like "mens" or "casual".
            3. "filters": An optional object containing search filters like "maxPrice".
            4. "actions": An optional array of valid action strings. Currently supported: ["reserve_pickup"]. Include this if the user asks for a specific item and might want to pick it up.
            
            Return ONLY the raw JSON.
        `;

        const aiResponse = await callNova(prompt, image);
        let recommendations = await getActualProductsFromKeywords(
            payload, 
            aiResponse.recommendedItems || [], 
            aiResponse.filters
        );

        // Fallback: If no recommendations found, get trending products
        let isFallback = false;
        if (recommendations.length === 0) {
            recommendations = await getTrendingProducts(payload);
            isFallback = true;
            
            // Log to product requests if nothing found from AI keywords
            await payload.create({
                collection: 'product-requests' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                data: {
                    query: query,
                    user: user?.id || null,
                    history: cleanHistory.slice(-4)
                }
            });
        }

        const fallbackMessage = isFallback ? "\n\nI couldn't find exact matches for that specific request, but check out these curated discoveries from our marketplace:" : "";

        return {
            analysis: aiResponse.analysis + fallbackMessage,
            recommendations: recommendations,
            actions: aiResponse.actions,
            notFound: recommendations.length === 0 
        };
    } catch (err) {
        console.error("[StyleAdvisor] Query Error:", err);
        return { analysis: "I'm sorry, I couldn't process that request right now.", recommendations: [] };
    }
}

async function callNova(prompt: string, imageBase64?: string | null) {
    const content: Record<string, unknown>[] = [{ text: prompt }];

    if (imageBase64) {
        // Handle data URL prefix if present
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        const format = imageBase64.includes('image/png') ? 'png' : 
                      imageBase64.includes('image/gif') ? 'gif' : 
                      imageBase64.includes('image/webp') ? 'webp' : 'jpeg';

        content.push({
            image: {
                format: format,
                source: {
                    bytes: Buffer.from(base64Data, 'base64')
                }
            }
        });
    }

    const command = new ConverseCommand({
        modelId: NOVA_LITE_MODEL_ID,
        // @ts-expect-error - Bedrock content type is complex
        messages: [{ role: "user", content }],
        inferenceConfig: { maxTokens: 500, temperature: 0.7 },
    });

    const result = await bedrockClient.send(command);
    const resultText = result.output?.message?.content?.[0]?.text || "{}";
    
    return JSON.parse(resultText.replace(/```json|```/g, "").trim());
}

async function getActualProductsFromKeywords(payload: any, recommendedItems: string[], filters?: Record<string, unknown>) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!recommendedItems || recommendedItems.length === 0) return [];

    const allMatchedProducts: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    const productIds = new Set<string>();

    for (const item of recommendedItems) {
        // Strip common search verbs and filler words - broadened for more categories
        const fillerWords = [
            'show', 'find', 'me', 'search', 'look', 'for', 'get', 'give', 'the', 'some', 'with', 
            'mens', 'womens', 'casual', 'lifestyle', 'premium', 'best', 'latest'
        ];
        const tokens = item.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2 && !fillerWords.includes(word));
        
        if (tokens.length === 0) continue;

        // Try strict AND match first
        const andFilters: Record<string, unknown>[] = [
            { status: { equals: 'live' } }
        ];

        if (filters?.maxPrice) {
            andFilters.push({ basePrice: { less_than_equal: Number(filters.maxPrice) } });
        }

        andFilters.push(...tokens.map(token => ({
            or: [
                { name: { contains: token } },
                { 'tags.tag': { contains: token } }
            ]
        })));

        let products = await payload.find({
            collection: 'products',
            where: {
                and: andFilters
            },
            limit: 2,
            depth: 1
        });

        // Fallback: If no strict matches, try OR match for tokens
        if (products.docs.length === 0) {
            const orFilters: Record<string, unknown>[] = tokens.map(token => ({
                or: [
                    { name: { contains: token } },
                    { 'tags.tag': { contains: token } }
                ]
            }));

            products = await payload.find({
                collection: 'products',
                where: {
                    and: [
                        { status: { equals: 'live' } },
                        { or: orFilters }
                    ]
                },
                limit: 2,
                depth: 1
            });
        }
        products.docs.forEach((p: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (!productIds.has(String(p.id))) {
                allMatchedProducts.push(p);
                productIds.add(String(p.id));
            }
        });
    }

    return allMatchedProducts.map((p: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        id: p.id,
        name: p.name,
        price: p.basePrice,
        category: typeof p.category === 'object' ? p.category?.title : 'Collection',
        image: p.media?.[0]?.url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
        slug: p.slug
    }));
}

async function getTrendingProducts(payload: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const products = await payload.find({
        collection: 'products',
        where: { status: { equals: 'live' } },
        limit: 4,
        depth: 1
    });

    return products.docs.map((p: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        id: p.id,
        name: p.name,
        price: p.basePrice,
        category: typeof p.category === 'object' ? p.category?.title : 'Collection',
        image: p.media?.[0]?.url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
        slug: p.slug
    }));
}
