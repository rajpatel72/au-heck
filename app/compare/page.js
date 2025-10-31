"use client";
import { useEffect, useState } from "react";

export default function ComparePage() {
  const [tariffs, setTariffs] = useState([]);
  const [selected, setSelected] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userInputs, setUserInputs] = useState({}); // 👈 store usage + current rate

  // Fetch tariff list once
  useEffect(() => {
    fetch("/api/tariffs")
      .then((res) => res.json())
      .then((list) => setTariffs(list.sort()));
  }, []);

  const handleCompare = async () => {
    if (!selected) return;
    setLoading(true);
    const res = await fetch(`/api/compare?tariff=${encodeURIComponent(selected)}`);
    const result = await res.json();
    setData(result);
    setUserInputs({}); // reset on new selection
    setLoading(false);
  };

  const fields = [
    "Daily supply charge",
    "Peak",
    "Peak 2",
    "Shoulder",
    "Off Peak",
    "CL1",
    "CL2",
    "CL3",
    "Capacity Charges",
    "Demand 1",
    "Demand 2",
    "Solar"
  ];

  const handleInputChange = (field, key, value) => {
    setUserInputs((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: value,
      },
    }));
  };

  const calculateTotal = (field) => {
    const usage = parseFloat(userInputs[field]?.usage || 0);
    const rate = parseFloat(userInputs[field]?.rate || 0);
    if (isNaN(usage) || isNaN(rate)) return "-";
    return (usage * rate).toFixed(2);
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-6">
        ⚡ Electricity Rate Comparison
      </h1>

      <div className="flex flex-col items-center gap-4 mb-8">
        <select
          className="border px-4 py-2 rounded w-72"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Select Network Tariff</option>
          {tariffs.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <button
          onClick={handleCompare}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Loading..." : "Compare Rates"}
        </button>
      </div>

      {data && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 bg-white shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Field</th>
                <th className="p-2 border">Origin</th>
                <th className="p-2 border">Nectr</th>
                <th className="p-2 border">Momentum</th>
                <th className="p-2 border">NBE</th>

                {/* new columns */}
                <th className="p-2 border bg-blue-50">Usage</th>
                <th className="p-2 border bg-blue-50">Current Rate</th>
                <th className="p-2 border bg-blue-50">Total</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field} className="text-center">
                  <td className="border p-2 font-medium">{field}</td>
                  <td className="border p-2">{data.Origin?.[field] || "-"}</td>
                  <td className="border p-2">{data.Nectr?.[field] || "-"}</td>
                  <td className="border p-2">{data.Momentum?.[field] || "-"}</td>
                  <td className="border p-2">{data.NBE?.[field] || "-"}</td>

                  {/* Input for usage */}
                  <td className="border p-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={userInputs[field]?.usage || ""}
                      onChange={(e) =>
                        handleInputChange(field, "usage", e.target.value)
                      }
                      className="w-24 border rounded px-2 py-1 text-sm"
                      placeholder="kWh"
                    />
                  </td>

                  {/* Input for current rate */}
                  <td className="border p-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={userInputs[field]?.rate || ""}
                      onChange={(e) =>
                        handleInputChange(field, "rate", e.target.value)
                      }
                      className="w-24 border rounded px-2 py-1 text-sm"
                      placeholder="¢/kWh"
                    />
                  </td>

                  {/* Total = Usage × Rate */}
                  <td className="border p-2 font-semibold text-blue-700">
                    {calculateTotal(field)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
