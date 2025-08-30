"use client";
import ThemeToggle from "@/components/ui/ThemeToggle"; 
import Link from "next/link";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";

const clusters = {
  NEOEN: {
    "NON-PV-RIO MAIOR BASE": 150,
    "NON-PV-RIO MAIOR REEQUIPAMIENTO": 30,
    "NON-PV-TORRE BELA BASE": 50,
    "NON-PV-TORRE BELA REEQUIPAMIENTO": 10,
  },
  Alcoutim: {
    Albercas: 25.5,
    "São Marcos": 44.9,
    Viçoso: 43.7,
    Pereiro: 15.9,
    Pereiro2: 10,
  },
  Pitarco: {
    "Pitarco 1": 30.3,
    "Pitarco 2": 8.5,
    "Pitarco 3": 9,
  },
};

type ClusterName = keyof typeof clusters;
type ParkName = keyof (typeof clusters)[ClusterName];

type Allocation = {
  [key: string]: {
    type: "fixed" | "dynamic";
    value: number;
  };
};

export default function SolarEnergyWebApp() {
  const [cluster, setCluster] = useState<ClusterName>("NEOEN");
  const [energyLimit, setEnergyLimit] = useState<number>(100);
  const [battery, setBattery] = useState<number>(0);
  const [isPereiro2Fixed, setIsPereiro2Fixed] = useState<boolean>(true);
  const [pereiro2Energy, setPereiro2Energy] = useState<number>(10);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [commsState, setCommsState] = useState<Record<string, boolean>>({});
  const [availabilityState, setAvailabilityState] = useState<Record<string, number>>({});

  const parks = clusters[cluster];

  const handleCommsToggle = (park: string) => {
    setCommsState((prev) => ({
      ...prev,
      [park]: prev[park] === undefined ? false : !prev[park],
    }));
  };

  // New: compute max output respecting corrected order (merge Pereiro2 → apply availability)
  const getMaxClusterOutput = (
    clusterName: ClusterName,
    availability: Record<string, number>,
    isP2Fixed: boolean,
    p2Energy: number
  ): number => {
    const base: Record<string, number> = { ...clusters[clusterName] };

    if (clusterName === "Alcoutim") {
      const effectiveP2 = isP2Fixed ? p2Energy : clusters.Alcoutim.Pereiro2;
      base["Pereiro"] = (base["Pereiro"] ?? 0) + effectiveP2;
      delete base["Pereiro2"]; // remove after merge
    }

    let sum = 0;
    for (const [park, nominal] of Object.entries(base)) {
      const a = availability[park] ?? 100;
      sum += (nominal * a) / 100;
    }
    return sum;
  };

  const calculate = () => {
    // 1) Start from nominal
    let clusterParks: Record<string, number> = { ...clusters[cluster] };

    // 2) If Alcoutim, merge Pereiro2 into Pereiro first (before availability)
    if (cluster === "Alcoutim") {
      const effectiveP2 = isPereiro2Fixed ? pereiro2Energy : clusters.Alcoutim.Pereiro2;
      clusterParks["Pereiro"] = (clusterParks["Pereiro"] ?? 0) + effectiveP2;
      delete clusterParks["Pereiro2"];
    }

    // 3) Apply availability to all active parks (after any merges)
    for (const [park, nominal] of Object.entries(clusterParks)) {
      const availability = availabilityState[park] ?? 100; // default 100%
      clusterParks[park] = (nominal * availability) / 100;
    }

    // 4) Compute max output with the same order for the guard check
    const maxClusterOutput = getMaxClusterOutput(
      cluster,
      availabilityState,
      isPereiro2Fixed,
      pereiro2Energy
    );

    // 5) Now proceed with allocation variables
    let availableEnergy = energyLimit;
    let fixedOutput = 0;
    let dynamicParks: Record<string, number> = {};
    let visosoBatteryCompensation = 0;

    // Battery charging: Viçoso compensates alone (we'll add later)
    if (cluster === "Alcoutim" && battery < 0) {
      visosoBatteryCompensation = -battery;
    }

    // Classify parks as fixed or dynamic
    for (const [park, power] of Object.entries(clusterParks)) {
      const comms = commsState[park] ?? true;
      if (!comms) {
        fixedOutput += power; // offline control → fixed
      } else {
        dynamicParks[park] = power;
      }
    }

    // If Pereiro2 is fixed, treat that portion as fixed energy (scaled by Pereiro availability)
    if (cluster === "Alcoutim" && isPereiro2Fixed) {
      const pereiroAvail = availabilityState["Pereiro"] ?? 100;
      const p2FixedPortion = (pereiro2Energy * pereiroAvail) / 100;
      fixedOutput += p2FixedPortion;
    }

    // Battery discharging: subtract from total available
    if (cluster === "Alcoutim" && battery > 0) {
      availableEnergy -= battery;
    }

    // Guard: setpoint above max available → show nominal (after availability)
    const effectiveMax = maxClusterOutput;
    if (energyLimit > effectiveMax) {
      window.alert("⚠️ Setpoint above max cluster power value. Showing nominal values.");
      const fallback: Allocation = {};
      for (const [park, power] of Object.entries(clusterParks)) {
        fallback[park] = {
          type: "fixed",
          value: power,
        };
      }
      setAllocation(fallback);
      return;
    }

    // Remaining energy after fixed portions
    availableEnergy = Math.max(0, availableEnergy - fixedOutput);

    const totalDynamicPower = Object.values(dynamicParks).reduce((a, b) => a + b, 0);

    const dynamicAllocation: Record<string, number> = {};
    for (const [park, power] of Object.entries(dynamicParks)) {
      // proportionally allocate but never exceed the park's (availability-adjusted) max
      dynamicAllocation[park] = Math.min(
        power,
        totalDynamicPower > 0 ? (power / totalDynamicPower) * availableEnergy : 0
      );
    }

    // Apply Viçoso compensation for charging (and clamp to its max)
    if (visosoBatteryCompensation > 0 && dynamicAllocation["Viçoso"] !== undefined) {
      dynamicAllocation["Viçoso"] = Math.min(
        clusterParks["Viçoso"] ?? 0,
        (dynamicAllocation["Viçoso"] ?? 0) + visosoBatteryCompensation
      );
    }

    const fullAllocation: Allocation = {};
    for (const [park, power] of Object.entries(clusterParks)) {
      if (dynamicAllocation[park] !== undefined) {
        fullAllocation[park] = {
          type: "dynamic",
          value: dynamicAllocation[park],
        };
      } else {
        fullAllocation[park] = {
          type: "fixed",
          value: power,
        };
      }
    }

    setAllocation(fullAllocation);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        calculate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [calculate]);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Cluster Energy Allocator</h1>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Select a cluster</label>
          <Select
            value={cluster}
            onValueChange={(value) => {
              setCluster(value as keyof typeof clusters);
              setCommsState({});
              setAvailabilityState({});
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a cluster" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(clusters).map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Power Setpoint to apply (MW)</label>
          <Input
            type="number"
            value={energyLimit}
            onChange={(e) => setEnergyLimit(Number(e.target.value))}
          />
        </div>

        {cluster === "Alcoutim" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Battery contribution (MW)</label>
            <Input
              type="number"
              value={battery}
              onChange={(e) => setBattery(Number(e.target.value))}
              inputMode="decimal"
              pattern="^-?\d*\.?\d*$"
            />
          </div>
        )}
      </div>

      {cluster === "Alcoutim" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPereiro2Fixed}
                onChange={(e) => setIsPereiro2Fixed(e.target.checked)}
              />
              <span>Pereiro2 is fixed</span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Pereiro2 fixed output (MW)</label>
            <Input
              type="number"
              value={pereiro2Energy}
              onChange={(e) => setPereiro2Energy(Number(e.target.value))}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Park Conditions — Uncheck if fixed • Set availability (%) per park
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(parks).map((park) => {
            if (cluster === "Alcoutim" && park === "Pereiro2") return null;
            return (
              <div
                key={park}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                {/* Left: park name + comms toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={commsState[park] ?? true}
                    onChange={() => handleCommsToggle(park)}
                  />
                  <span>{park}</span>
                </div>

                {/* Right: availability input */}
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={availabilityState[park] ?? 100}
                    onChange={(e) =>
                      setAvailabilityState((prev) => ({
                        ...prev,
                        [park]: Number(e.target.value),
                      }))
                    }
                    className="w-20"
                  />
                  <span className="text-sm">%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={calculate}>Allocate Energy</Button>
        <Button asChild variant="secondary">
          <Link href="/curtailment">Curtailment Planner</Link>
        </Button>
      </div>

      {allocation && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="font-semibold">Dynamic Parks</div>
            {Object.entries(allocation)
              .filter(([_, v]) => v.type === "dynamic")
              .map(([park, info]) => (
                <div key={park} className="flex justify-between">
                  <span>{park}</span>
                  <span>{info.value.toFixed(2)} MW</span>
                </div>
              ))}

            <div className="font-semibold mt-4">Fixed Parks</div>
            {Object.entries(allocation)
              .filter(([_, v]) => v.type === "fixed")
              .map(([park, info]) => (
                <div key={park} className="flex justify-between text-gray-500">
                  <span>{park}</span>
                  <span>{info.value.toFixed(2)} MW (Fixed)</span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
