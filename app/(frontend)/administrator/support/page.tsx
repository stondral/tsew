import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { SupportPanelClient } from "./SupportPanelClient";

export const dynamic = 'force-dynamic';

export default async function SupportPanelPage() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  const { user } = await payload.auth({ headers: requestHeaders });

  const { docs: tickets } = await payload.find({
    collection: 'support-tickets',
    sort: '-updatedAt',
    depth: 2,
    overrideAccess: true,
  });

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <SupportPanelClient 
        initialTickets={JSON.parse(JSON.stringify(tickets))} 
        adminId={user?.id || 'admin-placeholder'}
      />
    </div>
  );
}
