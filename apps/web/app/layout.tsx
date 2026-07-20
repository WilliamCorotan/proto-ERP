import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { ErpShell } from "../components/erp-shell";
import { getDashboard } from "./data";

export const metadata: Metadata = {
  title: "Open ERP Ecosystem",
  description: "Modular ERP platform shell"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("erp_token")?.value;
  if (!token) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  const dashboard = await getDashboard();

  return (
    <html lang="en">
      <body>
        <ErpShell navigation={dashboard.navigation} tenantName={dashboard.tenant.name}>
          {children}
        </ErpShell>
      </body>
    </html>
  );
}
