"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/BackButton";

// ─── DELAY TIERS ─────────────────────────────────────────────────────────────
const TIERS: { label: string; delayMinutes: number; color: string; plants: string[] }[] = [
  {
    label: "0–15 min",
    delayMinutes: 0,
    color: "border-red-500 bg-red-50 dark:bg-red-950/20",
    plants: [
      "PV-VIÇOSO",
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
    label: "15–30 min",
    delayMinutes: 15,
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
    label: "30–45 min",
    delayMinutes: 30,
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
    label: "45–60 min",
    delayMinutes: 45,
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
// ─── SUPPLIERS (Fornecedor → plants mapping) ─────────────────────────────
const SUPPLIERS: Record<string, string[]> = {
  ISOTROL: [
    "PV-VIÇOSO","WF-VALE GRANDE","PV-SÃOMARCOS","PV-PEREIRO","PV-ALBERCAS",
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO","PV-EMOCION",
    "PV-ESCATRON","PV-ENVITERO","PV-ESCARNES","PV-IGNIS","PV-MEDIOMONTE",
    "PV-MOCATERO","PV-VALDECARRO","PV-VALDIVIESO","PV-ALCAZAR II","PV-ALCAZAR I",
    "PV-ICTIO ALCAZAR 1","PV-ICTIO ALCAZAR 2","PV-ICTIO ALCAZAR 3",
    "PV-ICTIO ALBARREAL","PV-MANZANARES","PV-PEREA","PV-EL VEGON",
    "PV-PITARCO1","PV-PITARCO3","PV-PITARCO2","PV-ALMARAZ"
  ],

  GALP: [
    "PV-VIÇOSO","PV-SÃOMARCOS","PV-PEREIRO","PV-ALBERCAS",
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO","PV-EMOCION",
    "PV-ESCATRON","PV-ENVITERO","PV-ESCARNES","PV-IGNIS","PV-MEDIOMONTE",
    "PV-MOCATERO","PV-VALDECARRO","PV-VALDIVIESO","PV-ALCAZAR II","PV-ALCAZAR I",
    "PV-ICTIO ALCAZAR 1","PV-ICTIO ALCAZAR 2","PV-ICTIO ALCAZAR 3",
    "PV-ICTIO ALBARREAL","PV-MANZANARES","PV-PEREA","PV-EL VEGON",
    "PV-PITARCO1","PV-PITARCO3","PV-PITARCO2"
  ],

  "POWER ELECTRONICS": [
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO","PV-EMOCION",
    "PV-ESCATRON","PV-ENVITERO","PV-ESCARNES","PV-IGNIS","PV-MEDIOMONTE",
    "PV-MOCATERO","PV-VALDECARRO","PV-VALDIVIESO","PV-ALCAZAR II","PV-ALCAZAR I",
    "PV-ICTIO ALCAZAR 1","PV-ICTIO ALCAZAR 2","PV-ICTIO ALCAZAR 3",
    "PV-ICTIO ALBARREAL","PV-MANZANARES"
  ],

  SECOEX: [
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO","PV-EMOCION",
    "PV-ESCATRON","PV-ENVITERO","PV-ESCARNES","PV-IGNIS","PV-MEDIOMONTE",
    "PV-MOCATERO","PV-VALDECARRO","PV-VALDIVIESO","PV-ALCAZAR II","PV-ALCAZAR I",
    "PV-ICTIO ALBARREAL","PV-PEREA","PV-EL VEGON",
    "PV-PITARCO1","PV-PITARCO3","PV-PITARCO2"
  ],

  ASON: [
    "PV-VIÇOSO","PV-SÃOMARCOS","PV-PEREIRO","PV-ALBERCAS",
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO","PV-EMOCION",
    "PV-ESCATRON","PV-ENVITERO","PV-ESCARNES","PV-IGNIS","PV-MEDIOMONTE",
    "PV-MOCATERO","PV-VALDECARRO","PV-VALDIVIESO","PV-ALCAZAR II","PV-ALCAZAR I"
  ],

  SUNGROW: [
    "PV-VIÇOSO","PV-SÃOMARCOS","PV-PEREIRO","PV-ALBERCAS",
    "PV-PEREA","PV-EL VEGON",
    "PV-PITARCO1","PV-PITARCO3","PV-PITARCO2","PV-ALMARAZ"
  ],

  "ARAGON SOLAR": [
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO","PV-EMOCION",
    "PV-ESCATRON","PV-ENVITERO","PV-ESCARNES","PV-IGNIS","PV-MEDIOMONTE",
    "PV-MOCATERO"
  ],

  IGNIS: [
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO","PV-EMOCION",
    "PV-ESCATRON","PV-ENVITERO","PV-ESCARNES","PV-IGNIS","PV-MEDIOMONTE",
    "PV-MOCATERO"
  ],

  P4Q: [
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO",
    "PV-VALDECARRO","PV-VALDIVIESO","PV-ALCAZAR II","PV-ALCAZAR I"
  ],

  SOLTEC: [
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-ICTIO ALCAZAR 1","PV-ICTIO ALCAZAR 2","PV-ICTIO ALCAZAR 3",
    "PV-ICTIO ALBARREAL","PV-MANZANARES"
  ],

  NEXTRACKER: [
    "PV-LOGRO","PV-RIBAGRANDE","PV-SIERREZUELA","PV-VALDELAGUA","PV-ROBLEDO",
    "PV-PEREA","PV-EL VEGON"
  ],

  TRINA: [
    "WF-VALE GRANDE",
    "PV-VALDECARRO","PV-VALDIVIESO","PV-ALCAZAR II","PV-ALCAZAR I","PV-ALMARAZ"
  ],

  COBRA: [
    "PV-ICTIO ALBARREAL","PV-PEREA","PV-EL VEGON"
  ],

  EOSOL: [
    "PV-ICTIO ALCAZAR 1","PV-ICTIO ALCAZAR 2","PV-ICTIO ALCAZAR 3","PV-MANZANARES"
  ],

  PVH: [
    "PV-ESPLENDOR","PV-PALABRA","PV-HAZAÑA","PV-TALENTO",
    "PV-PITARCO1","PV-PITARCO3","PV-PITARCO2"
  ],

  "COLWAY (IAZ)": [
    "PV-ICTIO ALCAZAR 1","PV-ICTIO ALCAZAR 2","PV-ICTIO ALCAZAR 3","PV-MANZANARES"
  ],

  EFACEC: [
    "PV-VIÇOSO","PV-SÃOMARCOS","PV-PEREIRO","PV-ALBERCAS"
  ],

  VEOLIA: [
    "PV-PITARCO1","PV-PITARCO3","PV-PITARCO2"
  ],

  MEGAOM: [
    "PV-VIÇOSO","PV-SÃOMARCOS","PV-PEREIRO","PV-ALBERCAS"
  ],

  GPM: [
    "PV-PITARCO1","PV-PITARCO3","PV-PITARCO2"
  ],

  "HITACHI ENERGY": [
    "PV-VIÇOSO","PV-SÃOMARCOS","PV-PEREIRO","PV-ALBERCAS"
  ],

  SOLARIG: [
    "PV-VALDECARRO","PV-VALDIVIESO","PV-ALCAZAR II","PV-ALCAZAR I"
  ],

  WHS: [
    "PV-VIÇOSO","PV-SÃOMARCOS","PV-PEREIRO","PV-ALBERCAS"
  ],

  ELECNOR: [
    "PV-ICTIO ALBARREAL"
  ],
};

// ─── NAME MAPPING ─────────────────────────────────────────────────────────────
// Maps display names (used in UI/tiers) → exact system names (written to CSV).
// Only entries that differ need to be listed here.
const SYSTEM_NAME: Record<string, string> = {
  "PV-ALCAZAR I":  "PV-ALCAZAR1",
  "PV-ALCAZAR II": "PV-ALCAZAR2",
  "PV-AHIN":       "PV-AHÍN",
};
const toSystemName = (plant: string): string => SYSTEM_NAME[plant] ?? plant;
// ──────────────────────────────────────────────────────────────────────────────

const pad = (n: number) => (n < 10 ? "0" + n : String(n));
const formatDate = (d: Date) =>
  `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
const addMinutes = (d: Date, mins: number): Date => {
  const copy = new Date(d);
  copy.setMinutes(copy.getMinutes() + mins);
  return copy;
};

export default function ShutdownCSV() {
  const [selectedDate, setSelectedDate] = useState<"today" | "tomorrow">("today");
  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [shutdownHour, setShutdownHour] = useState("12:00");
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_PLANTS.map((p) => [p, true]))
  );
  const [output, setOutput] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");

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
  const applySupplier = (supplier: string) => {
    setSelectedSupplier(supplier);

    if (!supplier) return;

    const plants = SUPPLIERS[supplier];

    setSelected((prev) => {
      const next = { ...prev };

      // Reset all
      ALL_PLANTS.forEach((p) => (next[p] = false));

      // Activate supplier plants
      plants.forEach((p) => {
        if (next.hasOwnProperty(p)) {
          next[p] = true;
        }
      });

      return next;
    });
  };

  const generate = () => {
    const [sh, sm] = shutdownHour.split(":").map(Number);
    const shutdownStart = new Date(baseDate);
    shutdownStart.setHours(sh, sm, 0, 0);
    const end = getEndDate();

    const rows = [
      "site;startsAt (yyyy/mm/dd hh:mm);endAt (yyyy/mm/dd hh:mm);power (mw)",
    ];

    let count = 0;
    for (const tier of TIERS) {
      for (const plant of tier.plants) {
        if (!selected[plant]) continue;
        const plantStart = addMinutes(shutdownStart, tier.delayMinutes);
        rows.push(`${toSystemName(plant)};${formatDate(plantStart)};${formatDate(end)};0.00`);
        count++;
      }
    }

    if (count === 0) {
      setOutput("No plants selected.");
      return;
    }

    setOutput(rows.join("\n"));
  };

  const download = () => {
    const blob = new Blob([output], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const dd = pad(baseDate.getDate());
    const mm = pad(baseDate.getMonth() + 1);
    const yyyy = baseDate.getFullYear();
    const a = document.createElement("a");
    a.href = url;
    a.download = `SHUTDOWN_${dd}${mm}${yyyy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const endDate = getEndDate();
  const [sh, sm] = shutdownHour.split(":").map(Number);
  const previewStart = new Date(baseDate);
  previewStart.setHours(sh || 0, sm || 0, 0, 0);

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Shutdown CSV Generator</h1>
      <p className="text-sm text-gray-500">
        Plants shut down in staggered tiers. End time is always next day at 23:59.
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
          <label className="block text-sm font-medium">Shutdown from</label>
          <input
            type="time"
            value={shutdownHour}
            onChange={(e) => setShutdownHour(e.target.value)}
            className="border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
        <div className="space-y-1 text-sm">
          <span className="block font-medium text-gray-700 dark:text-gray-300">Until (auto)</span>
          <span className="block px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-600 text-gray-500">
            {formatDate(endDate)}
          </span>
        </div>
      </div>

      {/* Tier timing preview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {TIERS.map((tier) => (
          <div key={tier.label} className={`rounded p-2 border ${tier.color}`}>
            <div className="font-semibold">{tier.label}</div>
            <div className="text-gray-600 dark:text-gray-400">
              → {formatDate(addMinutes(previewStart, tier.delayMinutes)).split(" ")[1]}
            </div>
          </div>
        ))}
      </div>

        {/* Supplier selection */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">
          Shutdown by Entidade / Fornecedor
        </label>

        <select
          value={selectedSupplier}
          onChange={(e) => applySupplier(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-full dark:bg-gray-800 dark:border-gray-600"
        >
          <option value="">-- Select supplier --</option>
          {Object.keys(SUPPLIERS).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{tier.label}</span>
                <span className="text-xs text-gray-500">+{tier.delayMinutes} min</span>
              </div>
              <button
                onClick={() => toggleTier(tier.plants)}
                className="text-xs text-blue-500 underline"
              >
                {tier.plants.every((p) => selected[p]) ? "Deselect" : "Select"} all
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {tier.plants.map((plant) => (
                <label key={plant} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected[plant] ?? false}
                    onChange={() => setSelected((prev) => ({ ...prev, [plant]: !prev[plant] }))}
                  />
                  <span className="truncate">{plant}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={generate}>Generate CSV</Button>
        {output && output.includes(";") && (
          <Button onClick={download}>Download CSV</Button>
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