"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/BackButton";

// ─── BATCH CONFIG ─────────────────────────────────────────────────────────────
const BATCH_INTERVAL_MINUTES = 10; // minutes between waves
// ──────────────────────────────────────────────────────────────────────────────

// ─── NOMINAL POWER (MW) per plant (display name) ──────────────────────────────
const NOMINAL: Record<string, number> = {
  "WF-VALE GRANDE":      12.20,
  "PV-SÃOMARCOS":        44.9,
  "PV-VIÇOSO":           25.9,
  "VICOSO BESS":          5,
  "PV-PEREIRO":          43.7,
  "PV-ALBERCAS":         25.5,
  "PV-LOGRO":            44.1,
  "PV-RIBAGRANDE":       38.1,
  "PV-SIERREZUELA":      38.2,
  "PV-VALDELAGUA":       40.45,
  "PV-ROBLEDO":          38.05,
  "PV-ESPLENDOR":        40.20,
  "PV-PALABRA":          46,
  "PV-HAZAÑA":           38.1,
  "PV-TALENTO":          38.2,
  "PV-EMOCION":          38.1,
  "PV-ESCATRON":         38,
  "PV-ENVITERO":         35,
  "PV-ESCARNES":         32.8,
  "PV-IGNIS":            37.9,
  "PV-MEDIOMONTE":       37.95,
  "PV-MOCATERO":         30.35,
  "PV-VALDECARRO":       41,
  "PV-VALDIVIESO":       41,
  "PV-ALCAZAR II":       36.08,  // maps to PV-ALCAZAR2
  "PV-ALCAZAR I":        36.08,  // maps to PV-ALCAZAR1
  "PV-ICTIO ALCAZAR 1":  44.4,
  "PV-ICTIO ALCAZAR 2":  44.4,
  "PV-ICTIO ALCAZAR 3":  44.4,
  "PV-ICTIO ALBARREAL":  44.2,
  "PV-MANZANARES":       35.09,
  "PV-PEREA":            40.8,
  "PV-EL VEGON":         40.8,
  "PV-PITARCO1":         30.3,
  "PV-PITARCO3":         9,
  "PV-PITARCO2":         8.5,
  "PV-TOLEDO":           47.19, 
  "PV-AHÍN":             14.52,
  "PV-ALMARAZ":          42.03,
};

// ─── TIERS (visual grouping only — rank = order in ALL_PLANTS) ────────────────
const TIERS: { label: string; color: string; plants: string[] }[] = [
  {
    label: "Group A",
    color: "border-red-500 bg-red-50 dark:bg-red-950/20",
    plants: [
      "PV-VIÇOSO",
      "VICOSO BESS",
      "WF-VALE GRANDE",
      "PV-SÃOMARCOS",
      "PV-PEREIRO",
      "PV-ALBERCAS",
      "PV-LOGRO",
      "PV-RIBAGRANDE",
      "PV-SIERREZUELA",
      "PV-VALDELAGUA",
      "PV-ROBLEDO",
      "PV-ESPLENDOR",
      "PV-PALABRA",
      "PV-HAZAÑA",
      "PV-TALENTO",
    ],
  },
  {
    label: "Group B",
    color: "border-orange-500 bg-orange-50 dark:bg-orange-950/20",
    plants: [
      "PV-EMOCION",
      "PV-ESCATRON",
      "PV-ENVITERO",
      "PV-ESCARNES",
      "PV-IGNIS",
      "PV-MEDIOMONTE",
      "PV-MOCATERO",
      "PV-VALDECARRO",
      "PV-VALDIVIESO",
      "PV-ALCAZAR II",
      "PV-ALCAZAR I",
    ],
  },
  {
    label: "Group C",
    color: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
    plants: [
      "PV-ICTIO ALCAZAR 1",
      "PV-ICTIO ALCAZAR 2",
      "PV-ICTIO ALCAZAR 3",
      "PV-ICTIO ALBARREAL",
      "PV-MANZANARES",
      "PV-PEREA",
      "PV-EL VEGON",
    ],
  },
  {
    label: "Group D",
    color: "border-green-500 bg-green-50 dark:bg-green-950/20",
    plants: [
      "PV-PITARCO1",
      "PV-PITARCO3",
      "PV-PITARCO2",
      "PV-ALMARAZ",
      "PV-AHÍN",
      "PV-TOLEDO",
    ],
  },
];

const ALL_PLANTS = TIERS.flatMap((t) => t.plants);

const PLANT_RANK: Record<string, number> = Object.fromEntries(
  ALL_PLANTS.map((p, i) => [p, i + 1])
);

// ─── SUPPLIERS ────────────────────────────────────────────────────────────────
const SUPPLIERS: Record<string, string[]> = {
  "ALL": ALL_PLANTS,
  ISOTROL: [
    "PV-VIÇOSO","VICOSO BESS","PV-SÃOMARCOS","PV-PEREIRO","PV-ALBERCAS",
    "PV-PEREA","PV-EL VEGON","PV-ALMARAZ", "PV-AHÍN", "PV-TOLEDO", "PV-ICTIO ALBARREAL",
  ], 
  "POWER ELECTRONICS": [
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO","PV-EMOCION",
    "PV-ESCATRON","PV-ENVITERO","PV-ESCARNES","PV-IGNIS","PV-MEDIOMONTE",
    "PV-MOCATERO","PV-VALDECARRO","PV-VALDIVIESO","PV-ALCAZAR II","PV-ALCAZAR I",
    "PV-ICTIO ALCAZAR 1","PV-ICTIO ALCAZAR 2","PV-ICTIO ALCAZAR 3",
    "PV-ICTIO ALBARREAL","PV-MANZANARES",
  ],
  SECOEX: [
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO","PV-EMOCION",
    "PV-ESCATRON","PV-ENVITERO","PV-ESCARNES","PV-IGNIS","PV-MEDIOMONTE",
    "PV-MOCATERO","PV-VALDECARRO","PV-VALDIVIESO","PV-ALCAZAR II","PV-ALCAZAR I",
    "PV-ICTIO ALBARREAL","PV-PEREA","PV-EL VEGON",
    "PV-PITARCO1","PV-PITARCO3","PV-PITARCO2",
  ],
  ASON: [
    "PV-VIÇOSO","VICOSO BESS","PV-SÃOMARCOS","PV-PEREIRO","PV-ALBERCAS",
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO","PV-EMOCION",
    "PV-ESCATRON","PV-ENVITERO","PV-ESCARNES","PV-IGNIS","PV-MEDIOMONTE",
    "PV-MOCATERO","PV-VALDECARRO","PV-VALDIVIESO","PV-ALCAZAR II","PV-ALCAZAR I",
  ],
  SUNGROW: [
    "PV-VIÇOSO","VICOSO BESS","PV-SÃOMARCOS","PV-PEREIRO","PV-ALBERCAS",
    "PV-PEREA","PV-EL VEGON",
    "PV-PITARCO1","PV-PITARCO3","PV-PITARCO2","PV-ALMARAZ",
  ],
  "ARAGON SOLAR": [
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO","PV-EMOCION",
    "PV-ESCATRON","PV-ENVITERO","PV-ESCARNES","PV-IGNIS","PV-MEDIOMONTE",
    "PV-MOCATERO",
  ],
  IGNIS: [
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO","PV-EMOCION",
    "PV-ESCATRON","PV-ENVITERO","PV-ESCARNES","PV-IGNIS","PV-MEDIOMONTE",
    "PV-MOCATERO",
  ],
  P4Q: [
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO",
    "PV-VALDECARRO","PV-VALDIVIESO","PV-ALCAZAR II","PV-ALCAZAR I",
  ],
  SOLTEC: [
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-ICTIO ALCAZAR 1","PV-ICTIO ALCAZAR 2","PV-ICTIO ALCAZAR 3",
    "PV-ICTIO ALBARREAL","PV-MANZANARES",
  ],
  NEXTRACKER: [
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-PEREA","PV-EL VEGON",
  ],
  TRINA: [
    "WF-VALE GRANDE",
    "PV-VALDECARRO","PV-VALDIVIESO","PV-ALCAZAR II","PV-ALCAZAR I","PV-ALMARAZ",
  ],
  COBRA: ["PV-ICTIO ALBARREAL","PV-PEREA","PV-EL VEGON"],
  EOSOL: ["PV-ICTIO ALCAZAR 1","PV-ICTIO ALCAZAR 2","PV-ICTIO ALCAZAR 3","PV-MANZANARES"],
  PVH: [
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO",
    "PV-PITARCO1","PV-PITARCO3","PV-PITARCO2",
  ],
  "COLWAY (IAZ)": ["PV-ICTIO ALCAZAR 1","PV-ICTIO ALCAZAR 2","PV-ICTIO ALCAZAR 3","PV-MANZANARES"],
  EFACEC: ["PV-VIÇOSO","VICOSO BESS","PV-SÃOMARCOS","PV-PEREIRO","PV-ALBERCAS"],
  VEOLIA: ["PV-PITARCO1","PV-PITARCO3","PV-PITARCO2"],
  MEGAOM: ["PV-VIÇOSO","VICOSO BESS","PV-SÃOMARCOS","PV-PEREIRO","PV-ALBERCAS"],
  GPM: ["PV-PITARCO1","PV-PITARCO3","PV-PITARCO2"],
  "HITACHI ENERGY": ["PV-VIÇOSO","VICOSO BESS","PV-SÃOMARCOS","PV-PEREIRO","PV-ALBERCAS"],
  SOLARIG: ["PV-VALDECARRO","PV-VALDIVIESO","PV-ALCAZAR II","PV-ALCAZAR I"],
  ELECNOR: ["PV-ICTIO ALBARREAL"],
};

// ─── NAME MAPPING ─────────────────────────────────────────────────────────────
const SYSTEM_NAME: Record<string, string> = {
  "PV-ALCAZAR I":  "PV-ALCAZAR1",
  "PV-ALCAZAR II": "PV-ALCAZAR2",
  "PV-AHIN":       "PV-AHÍN",
};
const toSystemName = (plant: string): string => SYSTEM_NAME[plant] ?? plant;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const pad = (n: number) => (n < 10 ? "0" + n : String(n));
const formatDate = (d: Date) =>
  `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
const addMinutes = (d: Date, mins: number): Date => {
  const copy = new Date(d);
  copy.setMinutes(copy.getMinutes() + mins);
  return copy;
};

// Generate ramp rows for one plant starting at waveStart.
// Produces RAMP_STEPS rows, each 1 minute wide:
//   step 0: nominal * 0.9  (T+0 → T+1)
//   step 1: nominal * 0.8  (T+1 → T+2)
//   ...
//   step 9: 0.00           (T+9 → T+10)
// After T+10 the plant stays at 0 until endDate (one final row).
const buildRamp = (
  systemName: string,
  nominal: number,
  waveStart: Date,
  endDate: Date,
  rampSteps: number
): string[] => {
  const rows: string[] = [];

  for (let step = 0; step < rampSteps; step++) {
    const stepStart = addMinutes(waveStart, step);
    const stepEnd   = addMinutes(waveStart, step + 1);
    const factor    = 1 - (step + 1) / rampSteps; // 0.9, 0.8, ... 0.0
    const power     = nominal * factor;
    rows.push(`${systemName};${formatDate(stepStart)};${formatDate(stepEnd)};${power.toFixed(2)}`);
  }

  // Final row: hold at 0 from end of ramp until endDate
  const rampEnd = addMinutes(waveStart, rampSteps);
  if (rampEnd < endDate) {
    rows.push(`${systemName};${formatDate(rampEnd)};${formatDate(endDate)};0.00`);
  }

  return rows;
};

// Reverse ramp: 0 → nominal (activation)
const buildRampUp = (
  systemName: string,
  nominal: number,
  waveStart: Date,
  endDate: Date,
  rampSteps: number
): string[] => {
  const rows: string[] = [];

  // Ramp up from 0 → nominal
  for (let step = 0; step < rampSteps; step++) {
    const stepStart = addMinutes(waveStart, step);
    const stepEnd   = addMinutes(waveStart, step + 1);
    const factor    = (step + 1) / rampSteps; // 0.1 → 1.0
    const power     = nominal * factor;

    rows.push(
      `${systemName};${formatDate(stepStart)};${formatDate(stepEnd)};${power.toFixed(2)}`
    );
  }

  // After ramp: hold nominal until end
  const rampEnd = addMinutes(waveStart, rampSteps);
  if (rampEnd < endDate) {
    rows.push(
      `${systemName};${formatDate(rampEnd)};${formatDate(endDate)};${nominal.toFixed(2)}`
    );
  }

  return rows;
};

export default function ShutdownCSV() {
  const [selectedDate, setSelectedDate] = useState<"today" | "tomorrow">("today");
  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [hour, setHour]     = useState("12");
  const [minute, setMinute] = useState("00");
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_PLANTS.map((p) => [p, true]))
  );
  const [output, setOutput] = useState("");
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const [rampSteps, setRampSteps] = useState(10); // User-configurable ramp duration
  const [batchSize, setBatchSize] = useState(10); // User-configurable plants per wave

  const getEndDate = (): Date => {
    const end = new Date(baseDate);
    end.setDate(end.getDate() + 1);
    end.setHours(23, 59, 0, 0);
    return end;
  };

  const useToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setBaseDate(d);
    setSelectedDate("today");
  };

  const useTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    setBaseDate(d);
    setSelectedDate("tomorrow");
  };

  const toggleTier = (plants: string[]) => {
    const allOn = plants.every((p) => selected[p]);
    setSelected((prev) => {
      const next = { ...prev };
      plants.forEach((p) => (next[p] = !allOn));
      return next;
    });
  };

  const toggleAll = () => {
    const allOn = ALL_PLANTS.every((p) => selected[p]);
    setSelected(Object.fromEntries(ALL_PLANTS.map((p) => [p, !allOn])));
  };

  const toggleSupplier = (supplier: string) => {
    setSelectedSuppliers((prev) => {
      const next = new Set(prev);
      const plants = SUPPLIERS[supplier] || [];

      const isActive = next.has(supplier);

      if (isActive) {
        // ❌ REMOVE supplier → deselect ONLY its plants
        next.delete(supplier);

        setSelected((prevSelected) => {
          const updated = { ...prevSelected };
          plants.forEach((p) => {
            updated[p] = false;
          });
          return updated;
        });

      } else {
        // ✅ ADD supplier → select its plants (without touching others)
        next.add(supplier);

        setSelected((prevSelected) => {
          const updated = { ...prevSelected };
          plants.forEach((p) => {
            updated[p] = true;
          });
          return updated;
        });
      }

      return next;
    });
  };

  // Selected plants sorted by global rank
  const selectedByRank = ALL_PLANTS.filter((p) => selected[p]);
  const numWaves = Math.ceil(selectedByRank.length / batchSize) || 1;

  const generate = () => {
    const sh = Number(hour);
    const sm = Number(minute);
    const shutdownStart = new Date(baseDate);
    shutdownStart.setHours(sh, sm, 0, 0);
    const end = getEndDate();

    if (selectedByRank.length === 0) {
      setOutput("No plants selected.");
      return;
    }

    const rows = [
      "site;startsAt (yyyy/mm/dd hh:mm);endAt (yyyy/mm/dd hh:mm);power (mw)",
    ];

    selectedByRank.forEach((plant, idx) => {
      const wave       = Math.floor(idx / batchSize);
      const waveDelay  = wave * BATCH_INTERVAL_MINUTES;
      const waveStart  = addMinutes(shutdownStart, waveDelay);
      const nominal    = NOMINAL[plant] ?? 50; // fallback 50 MW if missing
      const sysName    = toSystemName(plant);
      const rampRows   = buildRamp(sysName, nominal, waveStart, end, rampSteps);
      rows.push(...rampRows);
    });

    setOutput(rows.join("\n"));
  };
  
  const generateActivation = () => {
    const sh = Number(hour);
    const sm = Number(minute);

    const activationStart = new Date(baseDate);
    activationStart.setHours(sh, sm, 0, 0);

    const end = getEndDate();

    if (selectedByRank.length === 0) {
      setOutput("No plants selected.");
      return;
    }

    const rows = [
      "site;startsAt (yyyy/mm/dd hh:mm);endAt (yyyy/mm/dd hh:mm);power (mw)",
    ];

    // 🔥 IMPORTANT: reverse order
    const reversed = [...selectedByRank].reverse();

    reversed.forEach((plant, idx) => {
      const wave       = Math.floor(idx / batchSize);
      const waveDelay  = wave * BATCH_INTERVAL_MINUTES;
      const waveStart  = addMinutes(activationStart, waveDelay);

      const nominal  = NOMINAL[plant] ?? 50;
      const sysName  = toSystemName(plant);

      const rampRows = buildRampUp(sysName, nominal, waveStart, end, rampSteps);
      rows.push(...rampRows);
    });

    setOutput(rows.join("\n"));
  };

  const download = () => {
    const blob = new Blob([output], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const dd   = pad(baseDate.getDate());
    const mm   = pad(baseDate.getMonth() + 1);
    const yyyy = baseDate.getFullYear();
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `GAS_${dd}${mm}${yyyy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewStart = new Date(baseDate);
  previewStart.setHours(Number(hour) || 0, Number(minute) || 0, 0, 0);
  const endDate = getEndDate();

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">GAS - Generation Automatic Shutdown</h1>
      <p className="text-sm text-gray-500">
        Select plants ramp from nominal → 0 over {rampSteps} min, in waves of {batchSize} every {BATCH_INTERVAL_MINUTES} min.
        End time is always next day at 23:59.
      </p>

      {/* Date */}
      <div className="flex gap-2">
        <Button
          onClick={useToday}
          variant="outline"
          className={selectedDate === "today" ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-300"}
        >
          Today ({formatDate(new Date()).split(" ")[0]})
        </Button>
        <Button
          onClick={useTomorrow}
          variant="outline"
          className={selectedDate === "tomorrow" ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-300"}
        >
          Tomorrow ({formatDate(new Date(Date.now() + 86400000)).split(" ")[0]})
        </Button>
      </div>

      {/* Time */}
      <div className="flex gap-6 items-end flex-wrap">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Start: </label>
          <div className="flex gap-2 items-center">
            <input
              type="number" min="0" max="23" value={hour}
              onChange={(e) => setHour(e.target.value.padStart(2, "0"))}
              className="w-16 border rounded px-2 py-2 text-sm dark:bg-gray-800"
            />
            :
            <input
              type="number" min="0" max="59" value={minute}
              onChange={(e) => setMinute(e.target.value.padStart(2, "0"))}
              className="w-16 border rounded px-2 py-2 text-sm dark:bg-gray-800"
            />
          </div>
        </div>
        <div className="space-y-1 text-sm">
          <span className="block font-medium text-gray-700 dark:text-gray-300">Until (auto)</span>
          <span className="block px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-600 text-gray-500">
            {formatDate(endDate)}
          </span>
        </div>
      </div>

      {/* Ramp Configuration */}
      <div className="flex gap-6 items-end flex-wrap">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Ramp Duration (minutes)</label>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map((mins) => (
              <button
                key={mins}
                onClick={() => setRampSteps(mins)}
                className={`px-4 py-2 text-sm rounded border transition ${
                  rampSteps === mins
                    ? "bg-blue-500 text-white border-blue-600"
                    : "bg-gray-100 dark:bg-gray-800 border-gray-300"
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Plants per Wave</label>
          <input
            type="number"
            min="1"
            max="50"
            value={batchSize}
            onChange={(e) => setBatchSize(Math.max(1, Number(e.target.value)))}
            className="w-24 border rounded px-3 py-2 text-sm dark:bg-gray-800"
          />
        </div>
      </div>

      {/* Wave preview */}
      <div className="space-y-1">
        <span className="text-sm font-medium">Wave schedule preview</span>
        <div className="flex flex-wrap gap-2 text-xs">
          {Array.from({ length: numWaves }).map((_, i) => {
            const waveStart   = addMinutes(previewStart, i * BATCH_INTERVAL_MINUTES);
            const rampEndTime = addMinutes(waveStart, rampSteps);
            const from = i * batchSize + 1;
            const to   = Math.min((i + 1) * batchSize, selectedByRank.length);
            return (
              <div key={i} className="border rounded px-2 py-1 bg-gray-50 dark:bg-gray-800">
                <span className="font-semibold">Wave {i + 1}</span>
                <span className="text-gray-500 ml-1">
                  #{from}–#{to} · ramp {formatDate(waveStart).split(" ")[1]} → {formatDate(rampEndTime).split(" ")[1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supplier */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Shutdown by Entity / Supplier
        </label>

        <div className="flex flex-wrap gap-2">
          {Object.keys(SUPPLIERS).map((supplier) => {
            const active = selectedSuppliers.has(supplier);

            return (
              <button
                key={supplier}
                onClick={() => toggleSupplier(supplier)}
                className={`px-3 py-1 text-xs rounded border transition
                  ${active
                    ? "bg-blue-500 text-white border-blue-600"
                    : "bg-gray-100 dark:bg-gray-800 border-gray-300"}
                `}
              >
                {supplier}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plant selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Select plants to shut down</label>
          <button onClick={toggleAll} className="text-xs text-blue-500 underline">
            {ALL_PLANTS.every((p) => selected[p]) ? "Deselect all" : "Select all"}
          </button>
        </div>

        {TIERS.map((tier) => (
          <div key={tier.label} className={`border rounded-lg p-3 space-y-2 ${tier.color}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{tier.label}</span>
              <button onClick={() => toggleTier(tier.plants)} className="text-xs text-blue-500 underline">
                {tier.plants.every((p) => selected[p]) ? "Deselect" : "Select"} all
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {tier.plants.map((plant) => {
                const posInSelected = selectedByRank.indexOf(plant);
                const wave = posInSelected >= 0 ? Math.floor(posInSelected / batchSize) + 1 : null;
                const nominal = NOMINAL[plant] ?? 50;
                return (
                  <label key={plant} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected[plant] ?? false}
                      onChange={() => setSelected((prev) => ({ ...prev, [plant]: !prev[plant] }))}
                    />
                    <span className="text-gray-400 dark:text-gray-500 font-mono text-xs w-5 shrink-0">
                      #{PLANT_RANK[plant]}
                    </span>
                    <span className="truncate flex-1">{plant}</span>
                    <span className="text-gray-400 text-xs shrink-0">{nominal} MW</span>
                    {wave !== null && (
                      <span className="text-xs font-medium text-blue-500 shrink-0">W{wave}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={generate}>
          Generate GAS CSV
        </Button>

        <Button onClick={generateActivation} variant="secondary">
          Generate Restart CSV
        </Button>

        {output && output.includes(";") && (
          <Button onClick={download}>Download Generated CSV</Button>
        )}
      </div>

      {output && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <pre className="whitespace-pre-wrap text-sm">{output}</pre>
        </div>
      )}

      <BackButton />
    </div>
  );
}