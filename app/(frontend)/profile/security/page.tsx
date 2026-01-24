// app/(frontend)/profile/security/page.tsx
import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  Phone,
  User as UserIcon,
  Lock,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";

export default async function SecurityPage() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    redirect("/auth");
  }

  const securitySections = [
    {
      title: "Name",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: (user as any).username || "Not set",
      icon: <UserIcon className="w-6 h-6 text-gray-400" />,
      actionLabel: "Edit",
    },
    {
      title: "Email",
      value: user.email,
      icon: <Mail className="w-6 h-6 text-gray-400" />,
      actionLabel: "Edit",
    },
    {
      title: "Mobile Phone Number",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: (user as any).phone || "Not set",
      icon: <Phone className="w-6 h-6 text-gray-400" />,
      actionLabel: "Edit",
    },
    {
      title: "Password",
      value: "********",
      icon: <Lock className="w-6 h-6 text-gray-400" />,
      actionLabel: "Edit",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-8 items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest hidden md:flex">
          <Link href="/profile" className="hover:text-orange-600 transition-colors">Your Account</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900">Login & Security</span>
        </div>

        <div className="mb-12">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">
              <ShieldCheck className="w-3 h-3" />
              Secure Profile
            </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Login & Security</h1>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
          {securitySections.map((section, index) => (
            <div 
              key={index} 
              className={`flex flex-col xs:flex-row items-start xs:items-center justify-between p-4 xs:p-6 md:p-8 hover:bg-gray-50/50 transition-colors gap-4 ${
                index !== securitySections.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="flex items-center gap-6">
                 <div className="p-4 bg-gray-50 rounded-2xl">
                    {section.icon}
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">{section.title}</h3>
                    <p className="text-lg font-extrabold text-gray-900">{section.value}</p>
                 </div>
              </div>
              
              <button className="px-6 py-2 bg-white border border-gray-200 hover:border-orange-600 hover:text-orange-600 text-gray-900 font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-sm">
                {section.actionLabel}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 md:p-8 bg-orange-50/50 rounded-[2.5rem] border border-orange-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <ShieldCheck className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                 <p className="font-black text-gray-900">Two-Step Verification</p>
                 <p className="text-sm text-gray-500 font-medium">Add an extra layer of security to your account.</p>
              </div>
           </div>
           <button className="px-8 py-4 bg-gray-900 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-black transition-all">
              Manage 2FA
           </button>
        </div>

        {/* Back Link mobile */}
        <Link 
          href="/profile" 
          className="mt-12 flex items-center justify-center gap-2 py-4 text-gray-400 font-black uppercase tracking-widest"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Account
        </Link>
      </div>
    </div>
  );
}
