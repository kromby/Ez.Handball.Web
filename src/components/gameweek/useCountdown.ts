import { useEffect, useState } from "react";

export interface Countdown {
  locked: boolean;
  label: string;
}

const pad = (n: number): string => String(n).padStart(2, "0");

/** Pure formatter — `label` is "Dd HHh MMm" at >= 1 day, else "HHh MMm SSs". */
export function formatCountdown(msRemaining: number): Countdown {
  if (msRemaining <= 0) return { locked: true, label: "" };
  const total = Math.floor(msRemaining / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const label =
    days >= 1
      ? `${days}d ${pad(hours)}h ${pad(minutes)}m`
      : `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  return { locked: false, label };
}

/** Live countdown to an ISO deadline; re-renders every second. */
export function useCountdown(deadlineIso: string): Countdown {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return formatCountdown(new Date(deadlineIso).getTime() - now);
}
