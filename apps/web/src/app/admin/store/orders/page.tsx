"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api-client";
import { formatCurrency, formatDate, statusBadgeClass, humanize } from "@/lib/fees";
import { ClipboardList } from "lucide-react";

interface OrderRow {
  id: string;
  orderNumber: string;
  studentName: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

const STATUS_OPTIONS = ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_COLLECTION", "DELIVERED", "CANCELLED"];

export default function AdminStoreOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: "1", pageSize: "100" });
    if (statusFilter) params.set("status", statusFilter);
    api
      .get<{ items: OrderRow[] }>(`/store/orders?${params.toString()}`)
      .then((r) => setOrders(r.items))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/store/orders/${id}/status`, { status });
    load();
  };

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">School Store</p>
        <h1 className="font-display text-2xl font-bold text-navy">Orders</h1>
      </div>

      <div className="p-8">
        <div className="mb-4">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs uppercase text-neutral-500">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-neutral-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-navy">{o.orderNumber}</p>
                    <p className="text-xs text-neutral-400">{formatDate(o.createdAt)}</p>
                  </td>
                  <td className="px-5 py-3">{o.studentName}</td>
                  <td className="px-5 py-3 text-neutral-500">{o.itemCount}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(o.paymentStatus)}`}>{humanize(o.paymentStatus)}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium">{formatCurrency(o.totalAmount)}</td>
                  <td className="px-5 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="rounded-md border border-neutral-300 px-2 py-1 text-xs outline-none focus:border-academic"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {humanize(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-neutral-400">
                    <ClipboardList className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                    No orders found.
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
