import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'

export type CapabilityThemes = "ALL" | readonly ("default" | "modern" | "luxury")[];

export interface PlanCapabilities {
  readonly themes: CapabilityThemes;
  readonly customDomain: boolean;
  readonly layoutControl: boolean | "advanced";
  readonly analytics: "basic" | "standard" | "advanced";
}

export const PLAN_CAPABILITIES: Record<Plan, PlanCapabilities> = {
  starter: {
    themes: ["default"],
    customDomain: false,
    layoutControl: false,
    analytics: "basic",
  },
  pro: {
    themes: ["default", "modern", "luxury"],
    customDomain: true,
    layoutControl: true,
    analytics: "standard",
  },
  elite: {
    themes: "ALL",
    customDomain: true,
    layoutControl: "advanced",
    analytics: "advanced",
  }
} as const

export type Plan = "starter" | "pro" | "elite"

export async function getSellerFromHeaders() {
  const headersList = await headers()
  const sellerId = headersList.get('x-seller-id')
  const sellerPlan = headersList.get('x-seller-plan') as Plan | null
  const sellerUsername = headersList.get('x-seller-username')

  if (!sellerId) return null

  return {
    id: sellerId,
    plan: sellerPlan || 'starter',
    username: sellerUsername,
  }
}

export function getCapabilities(plan: Plan): PlanCapabilities {
  return PLAN_CAPABILITIES[plan] || PLAN_CAPABILITIES.starter
}

export async function getSellerFullData(id: string): Promise<ExtendedUser | null> {
  const payload = await getPayload({ config })
  const seller = await payload.findByID({
    collection: 'users',
    id,
  }) as unknown as ExtendedUser
  return seller || null
}

export interface ResolvedTheme {
  preset: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  layoutVersion: number;
}

export interface ExtendedUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'seller' | 'user';
  plan: Plan;
  theme?: {
    preset?: 'default' | 'modern' | 'luxury';
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
    layoutVersion?: number;
  };
  customDomain?: {
    enabled: boolean;
    domain?: string;
    verifiedAt?: string;
  };
}

export function resolveTheme(sellerTheme: ExtendedUser['theme'], capabilities: PlanCapabilities): ResolvedTheme {
  const theme: ResolvedTheme = {
    preset: 'default',
    colors: (sellerTheme?.colors as Record<string, string>) || {},
    fonts: (sellerTheme?.fonts as Record<string, string>) || {},
    layoutVersion: sellerTheme?.layoutVersion || 1,
  }

  // Enforce preset capability
  if (capabilities.themes === 'ALL') {
    theme.preset = sellerTheme?.preset || 'default'
  } else if (Array.isArray(capabilities.themes)) {
    const allowed = capabilities.themes as readonly string[]
    if (sellerTheme?.preset && allowed.includes(sellerTheme.preset)) {
      theme.preset = sellerTheme.preset
    } else {
      theme.preset = 'default'
    }
  }

  return theme
}
