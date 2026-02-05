import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TeamClient from "./TeamClient";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    redirect("/auth?redirect=/seller/team");
  }

  // 1. Find the seller organization this user belongs to
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberships = await (payload as any).find({
    collection: "seller-members",
    where: {
      user: { equals: user.id },
    },
    depth: 2, // Get seller details
    overrideAccess: true,
  });

  if (memberships.docs.length === 0) {
    // FALLBACK: If user is a seller but has no membership, check if they OWN a seller organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ownedSellers = await (payload as any).find({
      collection: "sellers",
      where: {
        owner: { equals: user.id },
      },
      overrideAccess: true,
    });

    if (ownedSellers.docs.length > 0) {
      const seller = ownedSellers.docs[0];
      // Auto-create membership for the owner
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).create({
        collection: "seller-members",
        data: {
          seller: seller.id,
          user: user.id,
          role: "owner",
        },
      });
      // Redirect to refresh the page with the new membership
      redirect("/seller/team");
    }

    // Default "No Seller Organization Found" view
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6">
          <Plus className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">No Seller Organization Found</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">You are a seller, but you haven&apos;t set up your organization yet. Complete your profile to start managing your team.</p>
        
        <form action="/api/seller/organization/create" method="POST">
             <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-10 h-14 shadow-lg shadow-amber-500/20">
               Don&apos;t keep your team waiting! Send invitations below.
             </Button>
        </form>
      </div>
    );
  }

  // Use the first membership for now
  const activeMembership = memberships.docs[0];
  const seller = activeMembership.seller;
  const sellerId = typeof seller === "string" ? seller : seller.id;

  // 2. Fetch all members for this seller
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allMembers = await (payload as any).find({
    collection: "seller-members",
    where: {
      seller: { equals: sellerId },
    },
    depth: 1, // Get user details
    overrideAccess: true,
  });

  // 3. Fetch pending invites
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingInvites = await (payload as any).find({
    collection: "team-invites",
    where: {
      and: [
        { seller: { equals: sellerId } },
        { status: { equals: "pending" } },
      ],
    },
    overrideAccess: true,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Team Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your team members, roles, and invitations for <strong>{seller.name}</strong>.</p>
      </div>

      <TeamClient 
        sellerId={sellerId} 
        initialMembers={allMembers.docs} 
        initialInvites={pendingInvites.docs}
        currentUser={user}
        currentRole={activeMembership.role}
      />
    </div>
  );
}
