"use client";

import { useEffect, useState } from "react";

export function useMobile(breakpointPx = 900) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const HYSTERESIS = 24;

    const getWidth = () => {
      // visualViewport is less sensitive to scrollbar appearance/disappearance.
      return window.visualViewport?.width ?? window.innerWidth;
    };

    const apply = () => {
      const width = getWidth();
      setIsMobile((prev) => {
        if (prev) {
          return width <= breakpointPx + HYSTERESIS;
        }
        return width <= breakpointPx - HYSTERESIS;
      });
    };

    apply();
    window.addEventListener("resize", apply);
    window.visualViewport?.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      window.visualViewport?.removeEventListener("resize", apply);
    };
  }, [breakpointPx]);

  return isMobile;
}
