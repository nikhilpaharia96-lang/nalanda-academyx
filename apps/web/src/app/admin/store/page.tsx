"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api-client";
import { formatCurrency, formatDate, statusBadgeClass, humanize } from "@/lib/fees";
import { ShoppingCart, Package, ClipboardList, Clock, TrendingUp, AlertTriangle, IndianRupee } from "lucide-react";

interface Summary {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  todaySales: number;
  monthSales: number;
  totalRevenue: number;
  lowStockProducts: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  studentName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface TopProduct {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

interface LowStockRow {
  productId: string;
  productName: string;
  variantLabel: string | null;
  available: number;
  lowStockThreshold: number;
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-neutral-500">{label}</span>
        <Icon className="h-4 w-4 text-academic" />
      </div>
      <p className="font-display text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}

export default function AdminStoreDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStock, setLowStock] = useState<LowStockRow[]>([]);

  useEffect(() => {
    api.get<Summary>("/store/dashboard/summary").then(setSummary).catch(() => {});
    api.get<RecentOrder[]>("/store/dashboard/recent-orders?limit=8").then(setRecentOrders).catch(() => {});
    api.get<TopProduct[]>("/store/dashboard/top-products?limit=5").then(setTopProducts).catch(() => {});
    api.get<LowStockRow[]>("/store/dashboard/low-stock").then(setLowStock).catch(() => {});
  }, []);

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">School Store</p>
        <h1 className="font-display text-2xl font-bold text-navy">Store Dashboard</h1>
      </div>

      <div className="space-y-6 p-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={Package} label="Total Products" value={summary?.totalProducts ?? "—"} />
          <StatCard icon={ShoppingCart} label="Active Products" value={summary?.activeProducts ?? "—"} />
          <StatCard icon={ClipboardList} label="Total Orders" value={summary?.totalOrders ?? "—"} />
          <StatCard icon={Clock} label="Pending Orders" value={summary?.pendingOrders ?? "—"} />
          <StatCard icon={IndianRupee} label="Today's Sales" value={formatCurrency(summary?.todaySales ?? 0)} />
          <StatCard icon={TrendingUp} label="This Month's Sales" value={formatCurrency(summary?.monthSales ?? 0)} />
          <StatCard icon={IndianRupee} label="Total Revenue" value={formatCurrency(summary?.totalRevenue ?? 0)} />
          <StatCard icon={AlertTriangle} label="Low Stock Products" value={summary?.lowStockProducts ?? "—"} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 bg-white lg:col-span-2">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
              <h2 className="font-display text-sm font-bold text-navy">Recent Orders</h2>
              <Link href="/admin/store/orders" className="text-xs font-medium text-academic hover:underline">
                View all
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left text-xs uppercase text-neutral-500">
                  <th className="px-5 py-2">Order</th>
                  <th className="px-5 py-2">Student</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-neutral-50">
                    <td className="px-5 py-2.5">
                      <p className="font-medium text-navy">{o.orderNumber}</p>
                      <p className="text-xs text-neutral-400">{formatDate(o.createdAt)}</p>
                    </td>
                    <td className="px-5 py-2.5">{o.studentName}</td>
                    <td className="px-5 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(o.status)}`}>{humanize(o.status)}</span>
                    </td>
                    <td className="px-5 py-2.5 text-right font-medium">{formatCurrency(o.totalAmount)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-neutral-400">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-5 py-3">
              <h2 className="font-display text-sm font-bold text-navy">Top Selling Products</h2>
            </div>
            <ul className="divide-y divide-neutral-100">
              {topProducts.map((p) => (
                <li key={p.productId} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium text-navy">{p.name}</p>
                    <p className="text-xs text-neutral-400">{p.quantitySold} sold</p>
                  </div>
                  <span className="font-medium text-navy">{formatCurrency(p.revenue)}</span>
                </li>
              ))}
              {topProducts.length === 0 && <li className="px-5 py-6 text-center text-sm text-neutral-400">No sales yet.</li>}
            </ul>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
            <h2 className="font-display text-sm font-bold text-navy">Low Stock Alerts</h2>
            <Link href="/admin/store/inventory" className="text-xs font-medium text-academic hover:underline">
              View inventory
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs uppercase text-neutral-500">
                <th className="px-5 py-2">Product</th>
                <th className="px-5 py-2">Variant</th>
                <th className="px-5 py-2 text-right">Available</th>
                <th className="px-5 py-2 text-right">Threshold</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((r) => (
                <tr key={`${r.productId}-${r.variantLabel}`} className="border-b border-neutral-50">
                  <td className="px-5 py-2.5">{r.productName}</td>
                  <td className="px-5 py-2.5 text-neutral-500">{r.variantLabel ?? "—"}</td>
                  <td className="px-5 py-2.5 text-right font-medium text-red-600">{r.available}</td>
                  <td className="px-5 py-2.5 text-right text-neutral-400">{r.lowStockThreshold}</td>
                </tr>
              ))}
              {lowStock.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-neutral-400">
                    All stock levels are healthy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
