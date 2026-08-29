"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { primaryNav } from "@/lib/content/site";
import { cn } from "@/lib/utils";

export function MobileMenu({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col bg-navy-950 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className="flex h-[72px] items-center justify-between px-5">
            <Logo tone="light" />
            <button
              type="button"
              onClick={onClose}
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-md text-white"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center gap-1 px-6" aria-label="Mobile">
            {primaryNav.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "focus-ring flex min-h-[52px] items-center border-b border-white/10 font-display text-3xl font-semibold text-white/90 transition-colors hover:text-gold-400",
                    pathname === item.href && "text-gold-400"
                  )}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="flex flex-col gap-3 px-6 pb-10 pt-6">
            <Button href="/admission" variant="primary" className="w-full bg-gold-500 text-navy-950 hover:bg-gold-400">
              Admission
            </Button>
            <Button
              href="/contact"
              variant="secondary"
              className="w-full border-white/25 text-white hover:bg-white hover:text-navy-950"
            >
              Contact
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
