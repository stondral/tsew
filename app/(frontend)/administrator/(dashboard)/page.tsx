import { getPayload } from "payload";
import config from "@/payload.config";
import { 
  Package, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  AlertCircle,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const payload = await getPayload({ config });

  // Fetch some basic stats
  const pendingProducts = await payload.count({
    collection: 'products',
    where: { status: { equals: 'pending' } },
  });

  const totalOrders = await payload.count({
    collection: 'orders',
  });

  const totalUsers = await payload.count({
    collection: 'users',
  });

  const openTickets = await payload.count({
    collection: 'support-tickets',
    where: { status: { equals: 'open' } },
  });

  const stats = [
    { label: "Pending Products", value: pendingProducts.totalDocs, icon: ShoppingBag, color: "text-amber-500", bg: "bg-amber-500/10", href: "/administrator/products" },
    { label: "Total Orders", value: totalOrders.totalDocs, icon: Package, color: "text-indigo-500", bg: "bg-indigo-500/10", href: "/administrator/orders" },
    { label: "Active Users", value: totalUsers.totalDocs, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/administrator/users" },
    { label: "Open Tickets", value: openTickets.totalDocs, icon: MessageSquare, color: "text-rose-500", bg: "bg-rose-500/10", href: "/administrator/support" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter">Command Center</h1>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Global Administrative Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className="group p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-500/50 shadow-sm hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                <div className={cn("absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-20", stat.bg)} />
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className={cn("p-4 rounded-2xl", stat.bg)}>
                        <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                </div>
                <div className="relative z-10">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
                <ChevronRight className="absolute bottom-6 right-6 h-5 w-5 text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions / Recent Activity Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black tracking-tight">System Pulse</h3>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Real-time analytics matrix coming soon</p>
            </div>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black tracking-tight mb-8">Urgent Notifications</h3>
            <div className="space-y-4">
                {pendingProducts.totalDocs > 0 && (
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-4">
                        <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                            <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{pendingProducts.totalDocs} Products await approval</p>
                            <p className="text-[10px] font-bold text-amber-600 uppercase mt-1">Sellers are waiting for store visibility</p>
                        </div>
                        <Link href="/administrator/products">
                            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase rounded-lg">Review</Button>
                        </Link>
                    </div>
                )}
                {openTickets.totalDocs > 0 && (
                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center gap-4">
                        <div className="h-10 w-10 bg-rose-500 rounded-xl flex items-center justify-center shrink-0">
                            <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{openTickets.totalDocs} Support tickets open</p>
                            <p className="text-[10px] font-bold text-rose-600 uppercase mt-1">Customers require immediate assistance</p>
                        </div>
                        <Link href="/administrator/support">
                            <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase rounded-lg">Reply</Button>
                        </Link>
                    </div>
                )}
                {pendingProducts.totalDocs === 0 && openTickets.totalDocs === 0 && (
                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-30 grayscale">
                         <ShieldCheck className="h-12 w-12 text-slate-400 mb-4" />
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Protocol 10: All clear</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

// Helper component within the same file for now if not reusable
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
