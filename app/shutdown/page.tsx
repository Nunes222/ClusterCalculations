"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/BackButton";

// All known plants
const ALL_PLANTS = [
  "WF-VALE GRANDE",
  "PV-PEREA",
  "PV-EL VEGON",
  "PV-ESCATRON",
  "PV-ENVITERO",
  "PV-LOGRO",
  "PV-ALBERCAS",
  "PV-ICTIO ALBARREAL",
  "PV-SÃOMARCOS",
  "PV-VIÇOSO",
  "PV-PEREIRO",
  "PV-PEREIRO2",
  "PV-VALDECARRO",
  "PV-ALCAZAR I",
  "PV-ALCAZAR II",
  "PV-VALDIVIESO",
];

// Grouped for display
const GROUPS: Record<string, string[]> = {
  Isotrol: [
    "PV-ALBERCAS",
    "PV-SÃOMARCOS",
    "PV-VIÇOSO",
    "PV-PEREIRO",
    "PV-PEREIRO2",
  ],

  Other: [
    "WF-VALE GRANDE",
    "PV-PEREA",
    "PV-EL VEGON",
    "PV-ESCATRON",
    "PV-ENVITERO",
    "PV-LOGRO",
    "PV-ICTIO ALBARREAL",
    "PV-VALDECARRO",
    "PV-ALCAZAR I",
    "PV-ALCAZAR II",
    "PV-VALDIVIESO",
  ],
};

const pad = (n: number) => (n < 10 ? "0" + n : String(n));

const formatDate = (d: Date) =>
  `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function ShutdownCSV() {
  const [selectedDate, setSelectedDate] = useState<"today" | "tomorrow">("today");
  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [shutdownHour, setShutdownHour] = useState("12:00");
  const [endHour, setEndHour] = useState("23:45");
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_PLANTS.map((p) => [p, true]))
  );
  const [output, setOutput] = useState("");

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

  const toggleGroup = (group: string) => {
    const plants = GROUPS[group];
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

  const generate = () => {
    const [sh, sm] = shutdownHour.split(":").map(Number);
    const [eh, em] = endHour.split(":").map(Number);

    const start = new Date(baseDate);
    start.setHours(sh, sm, 0, 0);

    const end = new Date(baseDate);
    end.setHours(eh, em, 0, 0);

    if (end <= start) {
      setOutput("End time must be after start time.");
      return;
    }

    const activePlants = ALL_PLANTS.filter((p) => selected[p]);
    if (activePlants.length === 0) {
      setOutput("No plants selected.");
      return;
    }

    const rows = [
      "site;startsAt (yyyy/mm/dd hh:mm);endAt (yyyy/mm/dd hh:mm);power (mw)",
    ];

    for (const plant of activePlants) {
      rows.push(`${plant};${formatDate(start)};${formatDate(end)};0.00`);
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

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Shutdown CSV Generator</h1>
      <p className="text-sm text-gray-500">
        Sets selected plants to 0 MW for a chosen time window.
      </p>

      {/* Date selection */}
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

      {/* Time range */}
      <div className="flex gap-4 items-end">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Shutdown from</label>
          <input
            type="time"
            value={shutdownHour}
            onChange={(e) => setShutdownHour(e.target.value)}
            className="border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Until</label>
          <input
            type="time"
            value={endHour}
            onChange={(e) => setEndHour(e.target.value)}
            className="border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Plant selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Select plants to shut down</label>
          <button
            onClick={toggleAll}
            className="text-xs text-blue-500 underline"
          >
            {ALL_PLANTS.every((p) => selected[p]) ? "Deselect all" : "Select all"}
          </button>
        </div>

        {Object.entries(GROUPS).map(([group, plants]) => (
          <div key={group} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{group}</span>
              <button
                onClick={() => toggleGroup(group)}
                className="text-xs text-blue-500 underline"
              >
                {plants.every((p) => selected[p]) ? "Deselect" : "Select"} all
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {plants.map((plant) => (
                <label key={plant} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected[plant] ?? false}
                    onChange={() =>
                      setSelected((prev) => ({ ...prev, [plant]: !prev[plant] }))
                    }
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
        {output && !output.includes("time") && output.includes(";") && (
          <Button onClick={download}>Download CSV</Button>
        )}
      </div>

      {/* Preview */}
      {output && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <pre className="whitespace-pre-wrap text-sm">{output}</pre>
        </div>
      )}

      <BackButton />
    </div>
  );
}