// app/(frontend)/profile/page.tsx
import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
import { 
  Package, 
  User, 
  MapPin, 
  ShieldCheck, 
  CreditCard, 
  MessageSquare, 
  LogOut,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    redirect("/auth");
  }

  // Fetch some stats for the cards
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ordersRes = await (payload as any).find({
    collection: "orders",
    where: {
      user: { equals: user.id },
    },
    limit: 1,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addressesRes = await (payload as any).find({
    collection: "addresses",
    where: {
      user: { equals: user.id },
    },
    limit: 5,
  });

  const menuItems = [
    {
      title: "Your Orders",
      description: "Track, return, or buy things again",
      icon: <Package className="w-8 h-8 text-orange-600" />,
      href: "/orders",
      badge: ordersRes.totalDocs > 0 ? `${ordersRes.totalDocs} orders` : undefined,
    },
    {
      title: "Login & Security",
      description: "Edit login, name, and mobile number",
      icon: <ShieldCheck className="w-8 h-8 text-blue-600" />,
      href: "/profile/security",
    },
    {
      title: "Your Addresses",
      description: "Edit addresses for orders and gifts",
      icon: <MapPin className="w-8 h-8 text-red-600" />,
      href: "/profile/addresses",
      badge: addressesRes.totalDocs > 0 ? `${addressesRes.totalDocs} saved` : undefined,
    },
    {
      title: "Payment Options",
      description: "View all transactions & manage payment methods",
      icon: <CreditCard className="w-8 h-8 text-emerald-600" />,
      href: "/profile/payments",
    },
    {
      title: "Customer Service",
      description: "Contact us for help with your orders",
      icon: <MessageSquare className="w-8 h-8 text-purple-600" />,
      href: "/support",
    },
    {
      title: "Account Settings",
      description: "Manage your profile and preferences",
      icon: <User className="w-8 h-8 text-gray-700" />,
      href: "/profile/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Your Account</h1>
            <p className="text-gray-500 mt-2 font-medium">
              Manage your orders, addresses and security settings
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 text-2xl font-black">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(user as any).username?.[0].toUpperCase() || user.email?.[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Welcome back,</p>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <p className="text-xl font-black text-gray-900 leading-none">{(user as any).username || "Explorer"}</p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <Link 
              key={index} 
              href={item.href}
              className="group bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-orange-100/50 transition-all duration-300 hover:-translate-y-1 block"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-gray-50 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                    {item.icon}
                  </div>
                  {item.badge && (
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-black rounded-full uppercase tracking-tighter">
                      {item.badge}
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-extrabold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6">
                  {item.description}
                </p>
                
                <div className="mt-auto flex items-center text-gray-400 text-xs font-black uppercase tracking-widest group-hover:text-orange-600 transition-colors">
                  Check Details
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Access or Logout */}
        <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-gray-400 font-bold">
            Need help? Visit our <Link href="/help" className="text-orange-600 hover:underline">Help Center</Link>
          </div>
          
          <Link 
            href="/logout" 
            className="flex items-center gap-3 px-8 py-4 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-2xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Link>
        </div>
      </div>
    </div>
  );
}
