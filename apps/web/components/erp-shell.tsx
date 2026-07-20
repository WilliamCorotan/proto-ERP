import Link from "next/link";
import {
  Activity,
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Factory,
  FileText,
  Inbox,
  LayoutDashboard,
  Plug,
  Receipt,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Warehouse,
  type LucideIcon
} from "lucide-react";
import type { NavigationItem } from "@erp/core";
import { CommandPalette } from "./command-palette";
import { DensityControl } from "./design-system";

const icons: Record<string, LucideIcon> = {
  "bar-chart-3": BarChart3,
  "briefcase-business": BriefcaseBusiness,
  "layout-dashboard": LayoutDashboard,
  plug: Plug,
  "building-2": Building2,
  boxes: Boxes,
  "file-text": FileText,
  "clipboard-list": ClipboardList,
  factory: Factory,
  inbox: Inbox,
  receipt: Receipt,
  scale: Scale,
  "shopping-cart": ShoppingCart,
  warehouse: Warehouse,
  settings: Settings
};

export function ErpShell({
  children,
  navigation,
  tenantName
}: {
  children: React.ReactNode;
  navigation: NavigationItem[];
  tenantName: string;
}) {
  return (
    <div className="erp-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark">OE</div>
          <div>
            <strong>Open ERP</strong>
            <span>{tenantName}</span>
          </div>
        </div>
        <nav className="nav-list">
          {navigation.map((item) => {
            const Icon = item.icon ? icons[item.icon] ?? LayoutDashboard : LayoutDashboard;
            return (
              <Link key={item.path} href={item.path} className="nav-item">
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>Tenant scoped command system</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <CommandPalette navigation={navigation} />
          <Link href="/design-system" className="ds-topbar-link">
            Design system
          </Link>
          <DensityControl />
          <div className="operator">
            <span>Admin</span>
            <strong>
              <Activity size={14} aria-hidden="true" /> Live operations
            </strong>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
