import { useEffect, useState } from "react";

const FALLBACK_WIDTH = 600;

// Charts are drawn at their real pixel width (viewBox = size) so text keeps a fixed size
// instead of scaling up with the panel.
export function useElementWidth(element: HTMLElement | null): number {
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  useEffect(() => {
    if (!element || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth || FALLBACK_WIDTH));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return width;
}
