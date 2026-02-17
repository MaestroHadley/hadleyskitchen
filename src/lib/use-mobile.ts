"use client";

import { useEffect, useState } from "react";

export function useMobile(breakpointPx = 900) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [breakpointPx]);

  return isMobile;
}
