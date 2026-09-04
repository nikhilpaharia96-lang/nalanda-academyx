"use client";

import { X } from "lucide-react";
import { type ReactNode } from "react";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  width = "max-w-lg",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 px-4 py-10 backdrop-blur-sm">
      <div className={`w-full ${width} rounded-lg border border-neutral-200 bg-white shadow-xl`}>
        <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
