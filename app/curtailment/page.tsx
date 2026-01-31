"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/BackButton";

// Mapping from short plant names to full site names
const plantNameMap: Record<string, string> = {
  VALEGRANDE: "WF-VALE GRANDE",
  PEREA: "PV-PEREA",
  VEGON: "PV-VEGON",
  ESCATRON: "PV-ESCATRON",
  ENVITERO: "PV-ENVITERO",
  LOGRO: "PV-LOGRO",
  "TORRE BELA": "NON-PV-TORRE BELA BASE",
  "SOBREEQUI TORRE BELA": "NON-PV-TORRE BELA REEQUIPAMIENTO",
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
  ALBERCAS: "PV-ALBERCAS",
  "SÃO MARCOS": "PV-SÃOMARCOS",  // normal input from Excel/email
  "SAO MARCOS": "PV-SÃOMARCOS",  // safety for unaccented versions
  VIÇOSO: "PV-VIÇOSO",
  PEREIRO: "PV-PEREIRO",
  PEREIRO2: "PV-PEREIRO2",
  TRINDADE: "GBT-PV-TRINDADE",
  "FV_DOURO": "SDX-PV-DOURO SOLAR BASE",
  "FV_DOURO REPOWERING": "SDX-PV-DOURO SOLAR REEQ",
  MONTEGORDO: "SAT-WF MONTEGORDO",
  "PE LAS VEGAS": "SAT-VEGAS",
  "PE LOS ISLETES": "SAT-ISLETES",
  "PE SERÓN II": "SAT-SERON II",
  "PE ABUELA SANTA ANA": "SAT-ABUELA SANTA ANA",
  "PE TIJOLA": "SAT-TIJOLA",
  "PE SERÓN I": "SAT-SERON I",
  "PE LA NOGUERA":  "SAT-NOGUERA"


};

// ✅ Cluster definitions — short names only
const clusters: Record<string, Record<string, number>> = {
  Alcoutim: {
    ALBERCAS: 25.5,
    "SAO MARCOS": 44.9,
    VIÇOSO: 43.7,
    PEREIRO: 25.9,
    TRINDADE: 13.2,
  },
  NEOEN: {
    "RIO MAIOR": 150,
    "SOBREEQUIP RIO MAIOR": 30,
    "TORRE BELA": 50,
    "SOBREEQUI TORRE BELA": 10,
  },
  Solaria: { 
    AURIGA: 25,
    "BELINCHON I": 25,
    CEPHEUS: 25,
    "MEDINA DEL CAMPO I": 25,
  },
  Douro: {
    "FV_DOURO": 100,
    "FV_DOURO REPOWERING": 20,
  },
  Valegrande: {
    VALEGRANDE: 12.3, // or its nominal MW value (update if known)
  },

  

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

  const header = lines[0].toLowerCase();
  let csvRows: string[] = [
    "site;startsAt (yyyy/mm/dd hh:mm);endAt (yyyy/mm/dd hh:mm);power (mw)",
  ];

  // --- Recognize supported formats ---
  const isEmailFormat = header.includes("activo") && header.includes("setpoint");
  const isSpanishFormat =
    header.includes("instalación") && header.includes("inicio") && header.includes("setpoint");

  const isMatrixFormat =
    header.includes("instalación") &&
    lines[1]?.toLowerCase().includes("q1");

    
  // ================================
  // MATRIX FORMAT (hour x Q tables)
  // ================================
  if (isMatrixFormat) {
    const hourHeaders = lines[0].split("\t").slice(1);
    const quarterHeaders = lines[1].split("\t").slice(1);

    for (let r = 2; r < lines.length; r++) {
      const cols = lines[r].split("\t").map(c => c.trim());
      if (cols.length < 2) continue;

      const rawPlant = cols[0]
        .replace(/^'+/, "")
        .trim()
        .toUpperCase();

      const site =
        plantNameMap[rawPlant] ??
        plantNameMap[rawPlant.replace(/\s+/g, " ")] ??
        rawPlant;

      for (let c = 1; c < cols.length; c++) {
        if (!cols[c]) continue;

        const power = parseFloat(cols[c].replace(",", "."));
        if (isNaN(power)) continue;

        const [startHour] = hourHeaders[c - 1].split("-").map(Number);
        const quarter = quarterHeaders[c - 1];

        let startMin = 0;
        if (quarter === "Q2") startMin = 15;
        else if (quarter === "Q3") startMin = 30;
        else if (quarter === "Q4") startMin = 45;

        const start = new Date(baseDate);
        start.setHours(startHour, startMin, 0, 0);

        const end = new Date(start);
        end.setMinutes(start.getMinutes() + 15);

        csvRows.push(
          `${site};${format(start)};${format(end)};${power.toFixed(2)}`
        );
      }
    }

    setOutput(csvRows.join("\n"));
    return;
  }


  if (isEmailFormat || isSpanishFormat) {
    for (let i = 1; i < lines.length; i++) {
      // split safely by tabs or multiple spaces
      const parts = lines[i].split(/\t+/).map((p) => p.trim());
      if (parts.length < 5) continue;

      const rawNames = parts[0]
        .replace(/ e /gi, ",")
        .split(",")
        .map((s) => s.trim().toUpperCase());

      const startTime = parts[isSpanishFormat ? 2 : 2].trim();
      const endTime = parts[isSpanishFormat ? 3 : 3].trim();
      const rawPower = (parts[isSpanishFormat ? 5 : 4] || "")
        .replace(/[^\d.,-]/g, "")
        .replace(",", ".");
      const clusterSetpoint = parseFloat(rawPower);
      if (isNaN(clusterSetpoint)) continue;

      // --- Determine which cluster type this row belongs to ---
      let clusterName = "";
      if (rawNames.some((n) => n.includes("RIO MAIOR") || n.includes("TORRE BELA")))
        clusterName = "NEOEN";
      else if (
        rawNames.some((n) =>
          ["ALBERCAS", "SÃO MARCOS", "SAO MARCOS", "VIÇOSO", "PEREIRO", "TRINDADE"].some((p) =>
            n.includes(p)
          )
        )
      )
        clusterName = "Alcoutim";
      else if (
        rawNames.some((n) =>
          ["AURIGA", "BELINCHON I", "CEPHEUS", "MEDINA DEL CAMPO I"].includes(n)
        )
      )
        clusterName = "Solaria";
      
      else if (
        rawNames.some((n) => 
          ["FV_DOURO", "FV_DOURO REPOWERING"].includes(n)
      )
      )
        clusterName = "Douro";
      else if (rawNames.some((n) => n.includes("VALEGRANDE")))
         clusterName = "Valegrande";


      if (!clusterName) continue;

      const clusterParks = clusters[clusterName];
      const selectedParks = Object.entries(clusterParks).filter(([name]) =>
        rawNames.some((n) => n === name.toUpperCase())
      );

      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const start = new Date(baseDate);
      start.setHours(startH, startM, 0, 0);
      const end = new Date(baseDate);
      end.setHours(endH, endM, 0, 0);

      // --- For Solaria: use the SetPoint directly (no proportional split) ---
      if (clusterName === "Solaria") {
        for (const [parkName] of selectedParks) {
          const site =
            plantNameMap[parkName.toUpperCase()] ??
            `PV-${parkName.replace(/\s+/g, "").toUpperCase()}`;
          csvRows.push(`${site};${format(start)};${format(end)};${clusterSetpoint.toFixed(2)}`);
        }
        continue;
      }

      // --- For NEOEN/Alcoutim: distribute proportionally ---
      const totalNominal = selectedParks.reduce((sum, [, p]) => sum + p, 0);
      if (totalNominal === 0) continue;

      for (const [parkName, nominal] of selectedParks) {
        const allocatedPower = (nominal / totalNominal) * clusterSetpoint;
        const site = plantNameMap[parkName.toUpperCase()] ?? parkName;
        csvRows.push(`${site};${format(start)};${format(end)};${allocatedPower.toFixed(2)}`);
      }
    }

    setOutput(csvRows.join("\n"));
    return;
  }

  setOutput("Unknown table format — please check your pasted data.");
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
        placeholder="Paste curtailment table (email or XLS export)..."
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

      <BackButton />
    </div>
  );
}
