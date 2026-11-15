"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { lockScreenAction } from "@/app/(auth)/actions";

const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

/** Kassa qurilmasida harakatsizlikdan keyin ekranni qulflaydi. Qulf server cookie’sida saqlanadi. */
export function IdleLock({ minutes }: { minutes: number }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ms = Math.max(1, minutes) * 60_000;
    const arm = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        await lockScreenAction();
        router.refresh();
      }, ms);
    };
    arm();
    for (const e of EVENTS) window.addEventListener(e, arm, { passive: true });
    return () => {
      if (timer.current) clearTimeout(timer.current);
      for (const e of EVENTS) window.removeEventListener(e, arm);
    };
  }, [minutes, router]);

  return null;
}
