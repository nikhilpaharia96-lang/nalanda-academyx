"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { api, ApiError } from "@/lib/api-client";
import { Loader2, Save } from "lucide-react";

interface StoreSettings {
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  pickupInstructions: string;
  contactPhone: string;
  contactEmail: string;
  collectionHours: string;
  deliveryFee: number;
}

export default function AdminStoreSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<StoreSettings>("/store/settings").then(setSettings).catch(() => {});
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await api.put<StoreSettings>("/store/settings", settings);
      setSettings(updated);
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <AdminShell>
        <div className="p-8 text-sm text-neutral-500">Loading…</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">School Store</p>
        <h1 className="font-display text-2xl font-bold text-navy">Store Settings</h1>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 p-8">
        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {saved && <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Settings saved.</p>}

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 font-display text-sm font-bold text-navy">Fulfillment</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={settings.pickupAvailable} onChange={(e) => setSettings({ ...settings, pickupAvailable: e.target.checked })} />
              School Collection (Pickup) available
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={settings.deliveryAvailable} onChange={(e) => setSettings({ ...settings, deliveryAvailable: e.target.checked })} />
              Home Delivery available
            </label>
            {settings.deliveryAvailable && (
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Delivery Fee (₹)</label>
                <input
                  type="number"
                  value={settings.deliveryFee}
                  onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 font-display text-sm font-bold text-navy">Pickup Details</h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Pickup Instructions</label>
              <textarea
                value={settings.pickupInstructions}
                onChange={(e) => setSettings({ ...settings, pickupInstructions: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Collection Hours</label>
              <input
                value={settings.collectionHours}
                onChange={(e) => setSettings({ ...settings, collectionHours: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 font-display text-sm font-bold text-navy">Store Contact Information</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Contact Phone</label>
              <input
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Contact Email</label>
              <input
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
              />
            </div>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:bg-neutral-300"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Settings
        </button>
      </div>
    </AdminShell>
  );
}
