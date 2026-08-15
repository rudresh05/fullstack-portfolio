"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { RelationshipOverview } from "@/lib/relationship-types";

type RelationshipContextValue = { data: RelationshipOverview | null; loading: boolean; error: string | null; refresh: () => Promise<void> };
const RelationshipContext = createContext<RelationshipContextValue | null>(null);

export function RelationshipProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RelationshipOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = async () => {
    setLoading(true);
    const response = await fetch("/api/relationship", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    setData(response.ok ? payload.data : null);
    setError(response.ok ? null : typeof payload.error === "string" ? payload.error : "Unable to load this space.");
    setLoading(false);
  };
  useEffect(() => {
    let active = true;
    void fetch("/api/relationship", { cache: "no-store" })
      .then(async (response) => ({ response, payload: await response.json().catch(() => ({})) }))
      .then(({ response, payload }) => {
        if (!active) return;
        setData(response.ok ? payload.data : null);
        setError(response.ok ? null : typeof payload.error === "string" ? payload.error : "Unable to load this space.");
      })
      .catch(() => { if (active) setError("Unable to load this space."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <RelationshipContext.Provider value={{ data, loading, error, refresh }}>{children}</RelationshipContext.Provider>;
}

export function useRelationship() {
  const value = useContext(RelationshipContext);
  if (!value) throw new Error("useRelationship must be used within RelationshipProvider.");
  return value;
}
