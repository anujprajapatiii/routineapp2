"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import GlassKit from "@/lib/liquid-glass";

/**
 * Wires the Liquid Glass kit on every client-side navigation. App Router swaps
 * page content without remounting the root layout, so GlassKit.init() must
 * re-scan the DOM on each pathname change. The kit guards against double-binding,
 * so re-running is safe. A rAF lets the new DOM commit before we scan it.
 */
export default function GlassProvider() {
  const pathname = usePathname();

  useEffect(() => {
    GlassKit.theme.apply();
    const id = requestAnimationFrame(() => GlassKit.init(document));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
