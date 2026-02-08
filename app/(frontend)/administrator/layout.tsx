import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeProvider } from "@/components/ThemeProvider";

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  // Strict Admin Authentication Check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || (user as any).role !== "admin") {
    redirect("/auth?redirect=/administrator");
  }

  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
