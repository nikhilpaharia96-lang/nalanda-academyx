"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Plus, Trash2 } from "lucide-react";
import { ghostBtn, inputClass } from "@/components/campus-ui";
import { ImageUploadButton } from "@/components/image-upload";

type Json = any;

const humanize = (k: string) =>
  k.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const isObj = (v: unknown): v is Record<string, Json> => typeof v === "object" && v !== null && !Array.isArray(v);
const isImageKey = (k: string, v: string) => /(^|[^a-z])(src|image|photo|logo|banner|cover)(url)?$/i.test(k) || /\.(webp|png|jpe?g|svg|gif)$/i.test(v);
const isLongText = (k: string, v: string) => v.length > 70 || /(description|body|content|message|bio|text|answer|note|intro|summary|quote)$/i.test(k);

/** Union of keys across the default items, with empty values — what "Add item" inserts. */
export function blankLike(tpl: Json): Json {
  if (Array.isArray(tpl)) return [];
  if (isObj(tpl)) return Object.fromEntries(Object.entries(tpl).map(([k, v]) => [k, blankLike(v)]));
  if (typeof tpl === "number") return 0;
  if (typeof tpl === "boolean") return true;
  return "";
}

function itemTemplate(def: Json[]): Json {
  const objs = def.filter(isObj);
  if (!objs.length) return def[0];
  const out: Record<string, Json> = {};
  for (const o of objs) for (const [k, v] of Object.entries(o)) if (!(k in out)) out[k] = v;
  return out;
}

function summary(item: Json, i: number): string {
  if (typeof item === "string") return item || `Item ${i + 1}`;
  if (isObj(item)) {
    for (const k of ["title", "label", "name", "heading", "question", "year", "eyebrow"]) if (typeof item[k] === "string" && item[k]) return item[k];
    const first = Object.values(item).find((v) => typeof v === "string" && v);
    if (first) return String(first).slice(0, 60);
  }
  return `Item ${i + 1}`;
}

interface NodeProps { def: Json; value: Json; onChange: (v: Json) => void; name: string; icons: string[]; colour?: boolean }

function Leaf({ def, value, onChange, name, icons, colour }: NodeProps) {
  const label = humanize(name);
  if (typeof def === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {label}
      </label>
    );
  }
  if (typeof def === "number") {
    return (
      <Row label={label}><input type="number" className={inputClass} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} /></Row>
    );
  }
  const str = typeof value === "string" ? value : "";
  if (colour) {
    return (
      <Row label={label}>
        <div className="flex items-center gap-2">
          <input type="color" className="h-9 w-12 cursor-pointer rounded border border-neutral-300" value={/^#[0-9a-f]{6}$/i.test(str) ? str : "#000000"} onChange={(e) => onChange(e.target.value)} />
          <input className={inputClass} value={str} placeholder="#rrggbb" onChange={(e) => onChange(e.target.value)} />
        </div>
      </Row>
    );
  }
  const image = isImageKey(name, str);
  const isIcon = name === "icon";
  return (
    <Row label={label}>
      {isLongText(name, str) ? (
        <textarea className={inputClass} rows={Math.min(8, Math.max(3, Math.ceil(str.length / 70)))} value={str} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={inputClass} value={str} list={isIcon ? "site-icons" : undefined} onChange={(e) => onChange(e.target.value)} />
      )}
      {image && /^https?:\/\//.test(str) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={str} alt="" className="mt-2 h-16 rounded border border-neutral-200 object-cover" />
      )}
      {image && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <ImageUploadButton onUploaded={onChange} />
          <p className="text-xs text-neutral-500">or paste an image link (https://…) / a site path like /images/hero/photo.webp.</p>
        </div>
      )}
    </Row>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      {children}
    </div>
  );
}

function ListEditor({ def, value, onChange, name, icons }: NodeProps) {
  const list: Json[] = Array.isArray(value) ? value : [];
  const tpl = useMemo(() => itemTemplate(def), [def]);
  const [open, setOpen] = useState<number | null>(null);
  const primitive = !isObj(tpl);

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(null);
  };

  return (
    <div className="space-y-2">
      {list.map((item, i) => (
        <div key={i} className="rounded-md border border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-1 px-2 py-1.5">
            {!primitive ? (
              <button type="button" className="flex flex-1 items-center gap-1 text-left text-sm font-medium text-neutral-800" onClick={() => setOpen(open === i ? null : i)}>
                {open === i ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="truncate">{summary(item, i)}</span>
              </button>
            ) : (
              <input className={inputClass} value={item ?? ""} onChange={(e) => onChange(list.map((x, k) => (k === i ? e.target.value : x)))} />
            )}
            <button type="button" aria-label="Move up" className="rounded p-1 hover:bg-neutral-200" onClick={() => move(i, -1)}><ChevronUp className="h-4 w-4" /></button>
            <button type="button" aria-label="Move down" className="rounded p-1 hover:bg-neutral-200" onClick={() => move(i, 1)}><ChevronDown className="h-4 w-4" /></button>
            <button type="button" aria-label="Remove" className="rounded p-1 text-red-600 hover:bg-red-50" onClick={() => { onChange(list.filter((_, k) => k !== i)); setOpen(null); }}><Trash2 className="h-4 w-4" /></button>
          </div>
          {!primitive && open === i && (
            <div className="border-t border-neutral-200 p-3">
              <Node def={tpl} value={item} onChange={(v) => onChange(list.map((x, k) => (k === i ? v : x)))} name={name} icons={icons} />
            </div>
          )}
        </div>
      ))}
      <button type="button" className={ghostBtn} onClick={() => { onChange([...list, blankLike(tpl)]); if (!primitive) setOpen(list.length); }}>
        <Plus className="mr-1 inline h-4 w-4" /> Add {humanize(name).toLowerCase()} item
      </button>
    </div>
  );
}

export function Node(props: NodeProps) {
  const { def, value, onChange, icons } = props;
  if (Array.isArray(def)) return <ListEditor {...props} />;
  if (isObj(def)) {
    const v = isObj(value) ? value : {};
    return (
      <div className="space-y-3">
        {Object.keys(def).map((k) => {
          const child = def[k];
          const complex = Array.isArray(child) || isObj(child);
          const node = (
            <Node def={child} value={v[k]} name={k} icons={icons} colour={props.colour} onChange={(nv) => onChange({ ...v, [k]: nv })} />
          );
          return complex ? (
            <fieldset key={k} className="rounded-md border border-neutral-200 p-3">
              <legend className="px-1 text-sm font-semibold text-neutral-800">{humanize(k)}</legend>
              {node}
            </fieldset>
          ) : (
            <div key={k}>{node}</div>
          );
        })}
      </div>
    );
  }
  return <Leaf {...props} />;
}

/** Homepage blocks: fixed set, only show/hide and order are editable. */
export function HomepageEditor({ value, onChange }: { value: Json; onChange: (v: Json) => void }) {
  const list: { id: string; label: string; visible: boolean }[] = value.sections;
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 1 || j >= list.length) return; // hero (index 0) stays first
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ sections: next });
  };
  return (
    <div className="space-y-2">
      <p className="text-sm text-neutral-600">Tick a block to show it on the homepage and use the arrows to reorder. The hero banner always stays at the top.</p>
      {list.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
          <input type="checkbox" disabled={s.id === "hero"} checked={s.visible} onChange={(e) => onChange({ sections: list.map((x, k) => (k === i ? { ...x, visible: e.target.checked } : x)) })} />
          <span className="flex-1 text-sm font-medium">{s.label}</span>
          <button type="button" aria-label="Move up" disabled={i < 2} className="rounded p-1 hover:bg-neutral-200 disabled:opacity-30" onClick={() => move(i, -1)}><ChevronUp className="h-4 w-4" /></button>
          <button type="button" aria-label="Move down" disabled={i === 0 || i === list.length - 1} className="rounded p-1 hover:bg-neutral-200 disabled:opacity-30" onClick={() => move(i, 1)}><ChevronDown className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}
