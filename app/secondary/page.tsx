"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BackButton } from "@/components/ui/BackButton";

export default function SecondaryActivePowerCalc() {
  const [input, setInput] = useState("");
  const [pairs, setPairs] = useState<Array<{ site: string; power: number }>>([]);
  const [total, setTotal] = useState<number | null>(null);

  // Parse using the logic you provided: site line starts with PV- or SAT-, value is on the next line
  const calculateTotal = () => {
    const lines = input.split(/\r?\n/).map((l) => l.trim());
    const found: Array<{ site: string; power: number }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // match PV- or SAT- at start (case-insensitive)
      if (/^(PV-|SAT-)/i.test(line)) {
        const site = line;
        const nextLine = (lines[i + 1] ?? "").trim();

        // Extract first numeric token (supports comma or dot decimals)
        const m = nextLine.match(/[-+]?\d+(?:[.,]\d+)?/);
        if (m) {
          const value = parseFloat(m[0].replace(",", "."));
          if (!isNaN(value)) {
            found.push({ site, power: value });
          }
        }
      }
    }

    setPairs(found);
    setTotal(found.reduce((s, p) => s + p.power, 0));
  };

  const downloadCSV = () => {
    if (pairs.length === 0) return;
    const rows = ["site;activePower (MW)"];
    for (const p of pairs) {
      rows.push(`${p.site};${p.power}`);
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "secondary_active_power.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    setInput("");
    setPairs([]);
    setTotal(null);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Secondary Active Power Calculator</h1>
        <BackButton />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <label className="block text-sm font-medium">Paste table or text here</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Paste the table.`}
            className="min-h-[160px]"
          />

          <div className="flex gap-2">
            <Button onClick={calculateTotal}>Calculate Total</Button>
            <Button onClick={clear} variant="outline">Clear</Button>

          </div>
        </CardContent>
      </Card>

      {pairs.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="font-semibold">Extracted Active Powers</div>
            <div className="space-y-1 text-sm">
              {pairs.map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{p.site}</span>
                  <span>{p.power.toFixed(3)} MW</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-2 mt-2 flex justify-between items-center">
              <strong>Total:</strong>
              <div className="text-lg font-semibold">{(total ?? 0).toFixed(3)} MW</div>
            </div>
          </CardContent>
        </Card>
      )}

      {pairs.length === 0 && total === null && (
        <div className="text-sm text-gray-500">          
          Tip: The parser expects site lines that start with <code>PV-</code> or <code>SAT-</code>, and the active power value on the next line.
        </div>
      )}
    </div>
  );
}
