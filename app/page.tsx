"use client";
import ThemeToggle from "@/components/ui/ThemeToggle"; 
import Link from "next/link";
import { useState } from "react";
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

  const parks = clusters[cluster];

  const handleCommsToggle = (park: string) => {
    setCommsState((prev) => ({
      ...prev,
      [park]: prev[park] === undefined ? false : !prev[park],
    }));
  };

  const calculate = () => {
    let clusterParks = { ...clusters[cluster] };

    let availableEnergy = energyLimit - battery;
    let fixedOutput = 0;
    let dynamicParks: Record<string, number> = {};

  if (cluster === "Alcoutim") {
    const alcoutimParks = clusterParks as typeof clusters["Alcoutim"];

    if (isPereiro2Fixed) {
      alcoutimParks.Pereiro += pereiro2Energy;
      fixedOutput += pereiro2Energy;
    } else {
      alcoutimParks.Pereiro += clusters.Alcoutim.Pereiro2;
    }

    // Cast to any to suppress error on delete
    delete (alcoutimParks as any).Pereiro2;
  }



    for (const [park, power] of Object.entries(clusterParks)) {
      const comms = commsState[park] ?? true;
      if (!comms) {
        fixedOutput += power;
      } else {
        dynamicParks[park] = power;
      }
    }

    availableEnergy = Math.max(0, availableEnergy - fixedOutput);

    const totalDynamicPower = Object.values(dynamicParks).reduce((a, b) => a + b, 0);
    const dynamicAllocation: Record<string, number> = {};

    for (const [park, power] of Object.entries(dynamicParks)) {
      dynamicAllocation[park] = Math.max(0, (power / totalDynamicPower) * availableEnergy);
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

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Cluster Energy Allocator</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Select a cluster</label>
        <Select value={cluster} onValueChange={(value) => {
          setCluster(value as keyof typeof clusters);
          setCommsState({});
        }}>
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
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Battery contribution (MW)
            </label>
            <Input
              type="number"
              value={battery}
              onChange={(e) => setBattery(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPereiro2Fixed}
                onChange={(e) => setIsPereiro2Fixed(e.target.checked)}
              />
              <span>Pereiro2 is fixed</span>
            </label>
          </div>
        </>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium">Park Communication State - uncheck if park can't be controlled</label>
        {Object.keys(parks).map((park) => {
          if (cluster === "Alcoutim" && park === "Pereiro2") return null;
          return (
            <div key={park} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={commsState[park] ?? true}
                onChange={() => handleCommsToggle(park)}
              />
              <span>{park}</span>
            </div>
          );
        })}
      </div>

      <Button onClick={calculate}>Allocate Energy</Button>

          <div>
              <Button> {<Link href="/curtailment">Curtailment Planner</Link>}</Button>  
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
      <div>Toggle Dark/Light Mode<ThemeToggle /></div>
      
      

    </div>
  );
}
