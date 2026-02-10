import { Payload } from 'payload'
import { cache } from 'react'

// ============================================================================
// GRANULAR PERMISSIONS - Always check permissions, not roles!
// ============================================================================
export type Permission =
  // Product permissions
  | 'product.view'
  | 'product.create'
  | 'product.edit'
  | 'product.delete'
  | 'product.edit_description'
  // Inventory permissions
  | 'inventory.view'
  | 'inventory.adjust'
  | 'inventory.transfer'
  | 'inventory.mark_damaged'
  // Order permissions
  | 'order.view'
  | 'order.fulfill'
  | 'order.update_status'
  | 'order.cancel'
  // Return permissions
  | 'return.view'
  | 'return.request'
  | 'return.approve'
  // Customer permissions
  | 'customer.view'
  | 'customer.message'
  // Payout permissions
  | 'payout.view'
  | 'payout.withdraw'
  // Analytics permissions
  | 'analytics.view'
  | 'analytics.export'
  // Team permissions
  | 'team.view'
  | 'team.invite'
  | 'team.remove'
  | 'team.assign_role'
  // Seller settings
  | 'seller.manage'
  | 'seller.billing'
  | 'seller.delete'
  | 'seller.transfer_ownership'
  // Marketing
  | 'discount.create'
  | 'campaign.manage'
  // Warehouse
  | 'warehouse.view'
  | 'warehouse.ship'
  | 'warehouse.pack'
  | 'warehouse.scan'

// ============================================================================
// ROLES - Just permission bundles. Never check roles directly!
// ============================================================================
export type Role =
  | 'owner'
  | 'admin'
  | 'operations_manager'
  | 'inventory_manager'
  | 'warehouse_staff'
  | 'customer_support'
  | 'finance'
  | 'marketing_manager'
  | 'viewer'

// Role metadata for UI display
export const RoleMetadata: Record<Role, { label: string; description: string; icon: string; color: string; securityLevel: 'critical' | 'high' | 'medium' | 'low' }> = {
  owner: {
    label: 'Owner',
    description: 'Full control. Can delete seller, transfer ownership, manage billing.',
    icon: '👑',
    color: 'bg-red-500',
    securityLevel: 'critical'
  },
  admin: {
    label: 'Admin',
    description: 'Full operations access. Cannot withdraw payouts or delete seller.',
    icon: '🛡️',
    color: 'bg-amber-500',
    securityLevel: 'high'
  },
  operations_manager: {
    label: 'Operations Manager',
    description: 'Manage orders, returns, inventory. View analytics.',
    icon: '📦',
    color: 'bg-blue-500',
    securityLevel: 'medium'
  },
  inventory_manager: {
    label: 'Inventory Manager',
    description: 'Adjust stock, transfer between warehouses, mark damaged items.',
    icon: '📊',
    color: 'bg-indigo-500',
    securityLevel: 'medium'
  },
  warehouse_staff: {
    label: 'Warehouse Staff',
    description: 'Pack, ship, scan barcodes. Cannot adjust stock manually.',
    icon: '🏭',
    color: 'bg-teal-500',
    securityLevel: 'low'
  },
  customer_support: {
    label: 'Customer Support',
    description: 'View orders, message customers, create return requests.',
    icon: '💬',
    color: 'bg-emerald-500',
    securityLevel: 'low'
  },
  finance: {
    label: 'Finance / Accountant',
    description: 'View payouts, invoices, tax reports. Read-only for orders.',
    icon: '💰',
    color: 'bg-purple-500',
    securityLevel: 'medium'
  },
  marketing_manager: {
    label: 'Marketing Manager',
    description: 'Create discounts, manage campaigns. View analytics.',
    icon: '📣',
    color: 'bg-pink-500',
    securityLevel: 'low'
  },
  viewer: {
    label: 'Viewer (Read-Only)',
    description: 'View dashboard, orders, products. Cannot edit anything.',
    icon: '👁️',
    color: 'bg-slate-500',
    securityLevel: 'low'
  }
}

// Permission bundles per role
const RolePermissions: Record<Role, Permission[] | '*'> = {
  owner: '*',
  admin: [
    'product.view', 'product.create', 'product.edit', 'product.delete', 'product.edit_description',
    'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.mark_damaged',
    'order.view', 'order.fulfill', 'order.update_status', 'order.cancel',
    'return.view', 'return.request', 'return.approve',
    'customer.view', 'customer.message',
    'payout.view',
    'analytics.view', 'analytics.export',
    'team.view', 'team.invite', 'team.remove', 'team.assign_role',
    'seller.manage',
    'discount.create', 'campaign.manage',
    'warehouse.view', 'warehouse.ship', 'warehouse.pack', 'warehouse.scan',
  ],
  operations_manager: [
    'product.view', 'product.edit',
    'inventory.view', 'inventory.adjust',
    'order.view', 'order.fulfill', 'order.update_status',
    'return.view', 'return.request', 'return.approve',
    'customer.view',
    'analytics.view',
  ],
  inventory_manager: [
    'product.view',
    'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.mark_damaged',
    'warehouse.view',
  ],
  warehouse_staff: [
    'inventory.view',
    'order.view',
    'warehouse.view', 'warehouse.ship', 'warehouse.pack', 'warehouse.scan',
  ],
  customer_support: [
    'order.view',
    'customer.view', 'customer.message',
    'return.view', 'return.request',
  ],
  finance: [
    'order.view',
    'payout.view',
    'analytics.view',
  ],
  marketing_manager: [
    'product.view', 'product.edit_description',
    'analytics.view',
    'discount.create', 'campaign.manage',
  ],
  viewer: [
    'product.view',
    'inventory.view',
    'order.view',
    'analytics.view',
    'warehouse.view',
    'team.view',
  ],
}

// ============================================================================
// PERMISSION CHECKING FUNCTIONS
// ============================================================================

/**
 * Checks if a user has a specific permission for a given seller.
 * Always use this instead of checking roles directly!
 */
export async function hasPermission(
  payload: Payload,
  userId: string,
  sellerId: string,
  permission: Permission
): Promise<boolean> {
  // We need to determine the actual Organization ID.
  // The provided 'sellerId' might be an Org ID or a User ID (legacy).
  let targetOrgId = sellerId
  
  // Check if sellerId is a valid organization ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sellerOrg = await (payload as any).findByID({
    collection: 'sellers',
    id: sellerId,
    overrideAccess: true,
  }).catch(() => null)
  
  if (!sellerOrg) {
    // If not an organization, it might be a User ID. 
    // Let's find an organization owned by this user.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orgs = await (payload as any).find({
        collection: 'sellers',
        where: { owner: { equals: sellerId } },
        limit: 1,
        overrideAccess: true,
    })
    
    if (orgs.docs.length > 0) {
        targetOrgId = orgs.docs[0].id
    } else {
        // If it's a User ID but they don't own any org, maybe they are just a standalone seller.
        // In the new system, we expect an organization.
        // For backwards compatibility: if user is the provided sellerId, they are the owner.
        if (userId === sellerId) return true
        return false
    }
  }

  // Double check ownership of the resolved organization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolvedOrg = sellerOrg || (await (payload as any).findByID({
      collection: 'sellers',
      id: targetOrgId,
      overrideAccess: true,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sellerOwnerId = typeof resolvedOrg?.owner === 'string' ? resolvedOrg.owner : (resolvedOrg as any)?.owner?.id
  
  if (sellerOwnerId === userId) {
    return true // Owner has all permissions
  }
  
  // Check membership-based permissions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberships = await (payload as any).find({
    collection: 'seller-members',
    where: {
      and: [
        { user: { equals: userId } },
        { seller: { equals: targetOrgId } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (memberships.docs.length === 0) {
    return false
  }

  const role = memberships.docs[0].role as Role
  const permissions = RolePermissions[role]

  if (permissions === '*') return true
  return Array.isArray(permissions) && permissions.includes(permission)
}

/**
 * Shorthand for permission check - use like: can(payload, userId, sellerId, 'order.fulfill')
 */
export const can = hasPermission

/**
 * Gets all seller IDs where the user has a specific permission.
 */
export const getSellersWithPermission = cache(async function(
  payload: Payload,
  userId: string,
  permission: Permission
): Promise<string[]> {
  const allowedIds = new Set<string>()

  // 1. Check direct ownership of sellers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownedSellers = await (payload as any).find({
    collection: 'sellers',
    where: {
      owner: { equals: userId },
    },
    limit: 100,
    overrideAccess: true,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ownedSellers.docs.forEach((s: any) => {
      allowedIds.add(s.id)
      allowedIds.add(userId) // Owners can see their legacy products
  })

  // 2. Check membership-based permissions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberships = await (payload as any).find({
    collection: 'seller-members',
    where: {
      user: { equals: userId },
    },
    limit: 100,
    depth: 1, // Get seller details to find owner
    overrideAccess: true,
  })

  for (const membership of memberships.docs) {
    const role = membership.role as Role
    const permissions = RolePermissions[role]

    if (permissions === '*' || (Array.isArray(permissions) && permissions.includes(permission))) {
      const seller = membership.seller
      const sId = typeof seller === 'string' ? seller : seller.id
      allowedIds.add(sId)
      
      // Legacy support: also allow access to products owned by the owner of this org
      if (typeof seller === 'object' && seller.owner) {
          const ownerId = typeof seller.owner === 'string' ? seller.owner : seller.owner.id
          allowedIds.add(ownerId)
      }
    }
  }

  return Array.from(allowedIds)
})

/**
 * Get permissions for a specific role (for UI display)
 */
export function getPermissionsForRole(role: Role): Permission[] | '*' {
  return RolePermissions[role]
}

/**
 * Get all available roles (for UI display)
 */
export function getAllRoles(): Role[] {
  return Object.keys(RoleMetadata) as Role[]
}
/**
 * Checks if a user is part of at least one active seller organization.
 * Checks both ownership and membership.
 */
export async function isUserPartOfActiveSeller(
  payload: Payload,
  userId: string
): Promise<boolean> {
  // 1. Check if user owns an active seller
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownedActive = await (payload as any).find({
    collection: 'sellers',
    where: {
      and: [
        { owner: { equals: userId } },
        { subscriptionStatus: { equals: 'active' } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (ownedActive.docs.length > 0) return true

  // 2. Check if user belongs to an active seller
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberships = await (payload as any).find({
    collection: 'seller-members',
    where: { user: { equals: userId } },
    depth: 1,
    overrideAccess: true,
  })

  for (const membership of memberships.docs) {
      const seller = membership.seller
      if (typeof seller === 'object' && seller.subscriptionStatus === 'active') {
          return true
      }
  }

  return false
}
