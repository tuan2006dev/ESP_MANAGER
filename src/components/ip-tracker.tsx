"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export function IpTracker() {
  const { data: session } = useSession();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (session?.user && !hasTracked.current) {
      hasTracked.current = true;
      fetch("/api/user/track-ip", {
        method: "POST",
      }).catch((error) => {
        console.error("Failed to track IP", error);
      });
    }
  }, [session]);

  return null;
}
