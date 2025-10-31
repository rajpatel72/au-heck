"use client";

import { useEffect, useState } from "react";

export default function ComparePage() {
  const [tariffs, setTariffs] = useState([]);
  const [selected, setSelected] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

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
  ];

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
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field}>
                  <td className="border p-2 font-medium">{field}</td>
                  <td className="border p-2 text-center">{data.Origin?.[field] || "-"}</td>
                  <td className="border p-2 text-center">{data.Nectr?.[field] || "-"}</td>
                  <td className="border p-2 text-center">{data.Momentum?.[field] || "-"}</td>
                  <td className="border p-2 text-center">{data.NBE?.[field] || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
