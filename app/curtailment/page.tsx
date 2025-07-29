"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const plantNameMap: Record<string, string> = {
  PEREA: "PV-PEREA",
  VEGON: "PV-VEGON",
  ESCATRON: "PV-ESCATRON",
  ENVITERO: "PV-ENVITERO",
  LOGRO: "PV-LOGRO",
  "TORRE BELA": "NON-PV-TORRE BELA BASE",
  "SOBREEQUIP TORRE BELA": "NON-PV-TORRE BELA REEQUIPAMIENTO",
  "RIO MAIOR": "NON-PV-RIO MAIOR BASE",
  "SOBREEQUIP RIO MAIOR": "NON-PV-RIO MAIOR REEQUIPAMIENTO",
  AURIGA: "PV-AURIGA SOLAR",
  "BELINCHON I": "PV-BELINCHON I",
  CEPHEUS: "PV-CEPHEUS SOLAR",
  "MEDINA DEL CAMPO I": "PV-MEDINA DEL CAMPO I",
  TETHYS: "PV-TETHYS SOLAR",
  TELESTO: "PV-TELESTO SOLAR",
  THERMISTO: "PV-THERMISTO",
  "TELESTO 7": "PV-TELESTO SOLAR 7",
  RHEA: "PV-RHEA SOLAR",
  HINOJOSAS: "PV-HINOJOSAS I",
};

export default function CurtailmentPlanner() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string>("");
  const [baseDate, setBaseDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [selectedDate, setSelectedDate] = useState<"today" | "tomorrow">("today");

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


  const convertToCSV = () => {
    const lines = input.trim().split("\n").filter((l) => l.trim() !== "");
    if (lines.length < 2) {
      setOutput("Invalid input format.");
      return;
    }

    let csvRows: string[] = [
      "site;startsAt (yyyy/mm/dd hh:mm);endAt (yyyy/mm/dd hh:mm);power (mw)",
    ];

    const isEmailFormat =
      lines[0].toLowerCase().includes("activo") &&
      lines[0].toLowerCase().includes("setpoint");

    if (isEmailFormat) {
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split("\t");
        if (parts.length < 5) continue;

        const rawNames = parts[0]
          .replace(/ e /gi, ",")
          .split(",")
          .map((s) => s.trim().toUpperCase());

        const startTime = parts[2].trim();
        const endTime = parts[3].trim();
        const rawPower = parts[4].replace("MW", "").trim().replace(",", ".");
        const power = parseFloat(rawPower);

        for (const name of rawNames) {
          const site = plantNameMap[name];
          if (!site) continue;

          const start = new Date(baseDate);
          const end = new Date(baseDate);

          const [startH, startM] = startTime.split(":").map(Number);
          const [endH, endM] = endTime.split(":").map(Number);

          start.setHours(startH, startM);
          end.setHours(endH, endM);

          csvRows.push(`${site};${format(start)};${format(end)};${power}`);
        }
      }

      setOutput(csvRows.join("\n"));
      return;
    }

    // Quarter-based table
    const hourLabels = lines[0].split("\t").slice(1);
    const quarterLabels = lines[1].split("\t").slice(1);
    const dataLines = lines.slice(2);

    for (const line of dataLines) {
      const cols = line.split("\t");
      const rawSite = cols[0].trim().toUpperCase();
      const site = plantNameMap[rawSite];
      if (!site) continue;

      const values = cols.slice(1);
      let hourIndex = 0;

      for (let i = 0; i < values.length; i++) {
        const hourRange = hourLabels[hourIndex];
        const hour = parseInt(hourRange.split("-")[0]);

        const quarter = quarterLabels[i];
        const quarterNum = parseInt(quarter.replace("Q", ""));
        const start = new Date(baseDate);
        start.setHours(hour);
        start.setMinutes((quarterNum - 1) * 15);

        const end = new Date(start);
        end.setMinutes(start.getMinutes() + 15);

        const raw = values[i].replace(",", ".");
        const power = parseFloat(raw);

        csvRows.push(`${site};${format(start)};${format(end)};${power}`);

        if (quarter === "Q4") hourIndex++;
      }
    }

    setOutput(csvRows.join("\n"));
  };

  const format = (d: Date) =>
    `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  const pad = (n: number) => (n < 10 ? "0" + n : n);

  const downloadCSV = () => {
    const blob = new Blob([output], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "curtailment.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Curtailment Planner</h1>

  <div className="flex gap-2">
    <Button
      onClick={useToday}
      variant="outline"
      className={
        selectedDate === "today"
          ? "border-blue-500 ring-2 ring-blue-300"
          : "border-gray-300"
      }
    >
      Select Today ({format(new Date(Date.now())).split(" ")[0]})
    </Button>

    <Button
      onClick={useTomorrow}
      variant="outline"
      className={
        selectedDate === "tomorrow"
          ? "border-blue-500 ring-2 ring-blue-300"
          : "border-gray-300"
      }
    >
      Select Tomorrow ({format(new Date(Date.now() + 86400000)).split(" ")[0]})
    </Button>
  </div>


      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste curtailment table or email data..."
        className="min-h-[150px]"
      />

      <div className="flex gap-2">
        <Button onClick={convertToCSV}>Convert to CSV</Button>
        {output && <Button onClick={downloadCSV}>Download CSV</Button>}
      </div>

      {output && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 mt-4 rounded">
          <pre className="whitespace-pre-wrap text-sm">{output}</pre>
        </div>
      )}
    </div>
  );
}
