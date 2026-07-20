"use client";

import { useEffect, useState } from "react";
import { Button } from "./button";

type Density = "compact" | "comfortable";

function isDensity(value: string | null): value is Density {
  return value === "compact" || value === "comfortable";
}

export function DensityControl() {
  const [density, setDensity] = useState<Density>("comfortable");

  useEffect(() => {
    const stored = window.localStorage.getItem("erp-density");
    const nextDensity = isDensity(stored) ? stored : "comfortable";
    setDensity(nextDensity);
    document.documentElement.dataset.density = nextDensity;
  }, []);

  function toggleDensity() {
    const nextDensity = density === "compact" ? "comfortable" : "compact";
    setDensity(nextDensity);
    document.documentElement.dataset.density = nextDensity;
    window.localStorage.setItem("erp-density", nextDensity);
  }

  return (
    <Button aria-pressed={density === "compact"} onClick={toggleDensity} size="sm" type="button" variant="secondary">
      {density === "compact" ? "Compact" : "Comfort"}
    </Button>
  );
}
