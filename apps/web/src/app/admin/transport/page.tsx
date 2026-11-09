"use client";

import { useCallback, useEffect, useState } from "react";
import { Bus, MapPin, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api } from "@/lib/api-client";
import { Empty, ErrorBox, Field, PageHeader, Spinner, StudentPicker, errMsg, ghostBtn, inputClass, primaryBtn, type StudentHit } from "@/components/campus-ui";

interface Stop { id: string; name: string; pickupTime: string | null; stopOrder: number }
interface Route { id: string; name: string; vehicleNumber: string | null; driverName: string | null; driverPhone: string | null; monthlyFee: number | null; active: boolean; riders: number; stops: Stop[] }
interface Rider { assignmentId: string; studentName: string; stopName: string | null; pickupTime: string | null }

export default function AdminTransportPage() {
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [routeModal, setRouteModal] = useState(false);
  const [rForm, setRForm] = useState({ name: "", vehicleNumber: "", driverName: "", driverPhone: "", monthlyFee: "" });
  const [stopFor, setStopFor] = useState<Route | null>(null);
  const [sForm, setSForm] = useState({ name: "", pickupTime: "" });
  const [assignFor, setAssignFor] = useState<Route | null>(null);
  const [pick, setPick] = useState<StudentHit | null>(null);
  const [stopId, setStopId] = useState("");

  const load = useCallback(() => api.get<Route[]>("/transport/routes").then((r) => { setRoutes(r); setError(null); }).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);
  const loadRiders = useCallback((id: string) => api.get<Rider[]>(`/transport/routes/${id}/riders`).then(setRiders).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { if (open) loadRiders(open); }, [open, loadRiders]);

  async function run(fn: () => Promise<unknown>) {
    setSaving(true); setModalError(null);
    try { await fn(); return true; } catch (e) { setModalError(errMsg(e)); return false; } finally { setSaving(false); }
  }

  return (
    <AdminShell>
      <PageHeader title="Transport" icon={Bus}>
        <button className={primaryBtn} onClick={() => { setRForm({ name: "", vehicleNumber: "", driverName: "", driverPhone: "", monthlyFee: "" }); setModalError(null); setRouteModal(true); }}><Plus className="h-4 w-4" /> Add Route</button>
      </PageHeader>
      <div className="space-y-3 p-6 md:p-8">
        {error && <ErrorBox message={error} />}
        <p className="rounded-md bg-amber-50 px-4 py-3 text-xs text-amber-800">The monthly fee shown here is for reference. It is not yet added to student fee invoices automatically.</p>
        {!routes ? <Spinner /> : routes.length === 0 ? <Empty text="No routes yet. Add your first bus route." /> : routes.map((r) => (
          <div key={r.id} className="rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <button className="text-left" onClick={() => setOpen(open === r.id ? null : r.id)}>
                <p className="font-semibold text-navy">{r.name}{!r.active && <span className="ml-2 text-xs text-neutral-400">(inactive)</span>}</p>
                <p className="text-xs text-neutral-500">{[r.vehicleNumber, r.driverName, r.driverPhone].filter(Boolean).join(" · ") || "No vehicle details"} · {r.riders} riders{r.monthlyFee != null ? ` · ₹${r.monthlyFee}/month` : ""}</p>
              </button>
              <div className="flex gap-2">
                <button className={ghostBtn} onClick={() => { setSForm({ name: "", pickupTime: "" }); setModalError(null); setStopFor(r); }}>Add stop</button>
                <button className={ghostBtn} onClick={() => { setPick(null); setStopId(""); setModalError(null); setAssignFor(r); }}>Assign student</button>
              </div>
            </div>
            {open === r.id && (
              <div className="space-y-3 border-t border-neutral-100 px-4 py-3">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-neutral-500">Stops</p>
                  {r.stops.length === 0 ? <p className="text-sm text-neutral-500">No stops yet.</p> : r.stops.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-1 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-navy"><MapPin className="h-3.5 w-3.5 text-academic" />{s.name}{s.pickupTime ? <span className="font-mono text-xs text-neutral-500"> {s.pickupTime}</span> : null}</span>
                      <button className="text-xs text-red-600 hover:underline" onClick={async () => { if (!window.confirm(`Remove stop "${s.name}"?`)) return; try { await api.del(`/transport/stops/${s.id}`); load(); } catch (e) { setError(errMsg(e)); } }}>Remove</button>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-neutral-500">Riders</p>
                  {riders.length === 0 ? <p className="text-sm text-neutral-500">No riders.</p> : riders.map((x) => (
                    <div key={x.assignmentId} className="flex items-center justify-between border-b border-neutral-50 py-1.5 text-sm last:border-0">
                      <span><span className="font-medium text-navy">{x.studentName}</span> <span className="text-neutral-500">· {x.stopName || "no stop"}</span></span>
                      <button className={ghostBtn} onClick={async () => { try { await api.post(`/transport/assignments/${x.assignmentId}/end`); loadRiders(r.id); load(); } catch (e) { setError(errMsg(e)); } }}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {routeModal && (
        <Modal title="Add route" onClose={() => setRouteModal(false)}>
          <div className="space-y-3">
            <Field label="Route name"><input className={inputClass} placeholder="Route 1 – North" value={rForm.name} onChange={(e) => setRForm({ ...rForm, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vehicle no."><input className={inputClass} value={rForm.vehicleNumber} onChange={(e) => setRForm({ ...rForm, vehicleNumber: e.target.value })} /></Field>
              <Field label="Monthly fee (₹)"><input type="number" min={0} className={inputClass} value={rForm.monthlyFee} onChange={(e) => setRForm({ ...rForm, monthlyFee: e.target.value })} /></Field>
              <Field label="Driver name"><input className={inputClass} value={rForm.driverName} onChange={(e) => setRForm({ ...rForm, driverName: e.target.value })} /></Field>
              <Field label="Driver phone"><input className={inputClass} value={rForm.driverPhone} onChange={(e) => setRForm({ ...rForm, driverPhone: e.target.value })} /></Field>
            </div>
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving || !rForm.name.trim()} onClick={async () => {
              if (await run(() => api.post("/transport/routes", { name: rForm.name.trim(), vehicleNumber: rForm.vehicleNumber || undefined, driverName: rForm.driverName || undefined, driverPhone: rForm.driverPhone || undefined, monthlyFee: rForm.monthlyFee ? Number(rForm.monthlyFee) : undefined }))) { setRouteModal(false); load(); }
            }}>Save route</button>
          </div>
        </Modal>
      )}

      {stopFor && (
        <Modal title={`Add stop · ${stopFor.name}`} onClose={() => setStopFor(null)}>
          <div className="space-y-3">
            <Field label="Stop name"><input className={inputClass} value={sForm.name} onChange={(e) => setSForm({ ...sForm, name: e.target.value })} /></Field>
            <Field label="Pickup time"><input type="time" className={inputClass} value={sForm.pickupTime} onChange={(e) => setSForm({ ...sForm, pickupTime: e.target.value })} /></Field>
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving || !sForm.name.trim()} onClick={async () => {
              if (await run(() => api.post(`/transport/routes/${stopFor.id}/stops`, { name: sForm.name.trim(), pickupTime: sForm.pickupTime || undefined, stopOrder: stopFor.stops.length }))) { setStopFor(null); load(); }
            }}>Save stop</button>
          </div>
        </Modal>
      )}

      {assignFor && (
        <Modal title={`Assign student · ${assignFor.name}`} onClose={() => setAssignFor(null)}>
          <div className="space-y-3">
            <StudentPicker value={pick} onPick={setPick} />
            <Field label="Pickup stop">
              <select className={inputClass} value={stopId} onChange={(e) => setStopId(e.target.value)}>
                <option value="">No specific stop</option>
                {assignFor.stops.map((s) => <option key={s.id} value={s.id}>{s.name}{s.pickupTime ? ` (${s.pickupTime})` : ""}</option>)}
              </select>
            </Field>
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving || !pick} onClick={async () => {
              if (await run(() => api.post("/transport/assignments", { studentId: pick!.id, routeId: assignFor.id, stopId: stopId || undefined }))) { setAssignFor(null); load(); if (open === assignFor.id) loadRiders(assignFor.id); }
            }}>Assign</button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
