"use client";
import { useEffect, useState } from "react";

export default function ComparePage() {
  const [tariffs, setTariffs] = useState([]);
  const [selected, setSelected] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userInputs, setUserInputs] = useState({}); // usage + rate + discount per field

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
    setUserInputs({});
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
    "Solar",
  ];

  // Fields where discount is NOT applied
  const noDiscountFields = ["Capacity Charges", "Demand 1", "Demand 2", "Solar"];

  // Handle manual input
  const handleInputChange = (field, key, value) => {
    setUserInputs((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: value,
      },
    }));
  };

  // --- Manual Total: Usage × Rate × (1 - Discount%)
  const calcManualTotal = (field) => {
    const usage = parseFloat(userInputs[field]?.usage || 0);
    const rate = parseFloat(userInputs[field]?.rate || 0);
    const discount = parseFloat(userInputs[field]?.discount || 0);

    if (!usage || !rate) return "-";

    const discountFactor = noDiscountFields.includes(field)
      ? 1
      : 1 - discount / 100;

    const total = usage * rate * discountFactor;
    return total.toFixed(4);
  };

  // --- Retailer Total: Usage × (Rate × 100) × (1 - Discount%)
  const calcRetailerTotal = (field, rateInDollars, discount) => {
    const usage = parseFloat(userInputs[field]?.usage || 0);
    const rate = parseFloat(rateInDollars || 0) / 100; // convert $ → ¢
    const d = parseFloat(discount || 0);

    if (!usage || !rate) return "-";

    const discountFactor = noDiscountFields.includes(field)
      ? 1
      : 1 - d / 100;

    const total = usage * rate * discountFactor;
    return total.toFixed(4);
  };

  // Format rates to always show ¢ instead of $
  const formatRate = (rate) => {
    const r = parseFloat(rate);
    if (isNaN(r)) return "-";
    return (r / 100).toFixed(4); // convert to cents
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
          <table className="min-w-full border border-gray-300 bg-white shadow text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Field</th>

                {/* Manual Input Columns */}
                <th className="p-2 border bg-blue-50">Usage</th>
                <th className="p-2 border bg-blue-50">Current Rate (¢)</th>
                <th className="p-2 border bg-blue-50">Discount (%)</th>
                <th className="p-2 border bg-blue-50">Manual Total</th>

                {/* Retailer Columns */}
                <th className="p-2 border">Origin (¢)</th>
                <th className="p-2 border bg-gray-50">Origin Discount (%)</th>
                <th className="p-2 border bg-gray-50">Origin Total</th>

                <th className="p-2 border">Nectr (¢)</th>
                <th className="p-2 border bg-gray-50">Nectr Discount (%)</th>
                <th className="p-2 border bg-gray-50">Nectr Total</th>

                <th className="p-2 border">Momentum (¢)</th>
                <th className="p-2 border bg-gray-50">Momentum Discount (%)</th>
                <th className="p-2 border bg-gray-50">Momentum Total</th>

                <th className="p-2 border">NBE (¢)</th>
                <th className="p-2 border bg-gray-50">NBE Discount (%)</th>
                <th className="p-2 border bg-gray-50">NBE Total</th>
              </tr>
            </thead>

            <tbody>
              {fields.map((field) => {
                const originRate = parseFloat(data.Origin?.[field]) || 0;
                const nectrRate = parseFloat(data.Nectr?.[field]) || 0;
                const momentumRate = parseFloat(data.Momentum?.[field]) || 0;
                const nbeRate = parseFloat(data.NBE?.[field]) || 0;

                const originDisc = parseFloat(data.Origin?.["Discount"]) || 0;
                const nectrDisc = parseFloat(data.Nectr?.["Discount"]) || 0;
                const momentumDisc = parseFloat(data.Momentum?.["Discount"]) || 0;
                const nbeDisc = parseFloat(data.NBE?.["Discount"]) || 0;

                return (
                  <tr key={field} className="text-center hover:bg-gray-50">
                    <td className="border p-2 font-medium text-left">{field}</td>

                    {/* Manual Inputs */}
                    <td className="border p-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={
  userInputs[field]?.rate
    ? parseFloat(userInputs[field]?.rate).toFixed(4)
    : ""
}
                        onChange={(e) =>
                          handleInputChange(field, "usage", e.target.value)
                        }
                        className="w-24 border rounded px-2 py-1 text-sm"
                        placeholder="kWh"
                      />
                    </td>

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

                    <td className="border p-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={userInputs[field]?.discount || ""}
                        onChange={(e) =>
                          handleInputChange(field, "discount", e.target.value)
                        }
                        className="w-20 border rounded px-2 py-1 text-sm"
                        placeholder="%"
                        disabled={noDiscountFields.includes(field)}
                      />
                    </td>

                    <td className="border p-2 font-semibold text-blue-700">
                      {calcManualTotal(field)}
                    </td>

                    {/* Retailers */}
                    <td className="border p-2">{formatRate(originRate)}</td>
                    <td className="border p-2 bg-gray-50">{originDisc}%</td>
                    <td className="border p-2 bg-gray-50">
                      {calcRetailerTotal(field, originRate, originDisc)}
                    </td>

                    <td className="border p-2">{formatRate(nectrRate)}</td>
                    <td className="border p-2 bg-gray-50">{nectrDisc}%</td>
                    <td className="border p-2 bg-gray-50">
                      {calcRetailerTotal(field, nectrRate, nectrDisc)}
                    </td>

                    <td className="border p-2">{formatRate(momentumRate)}</td>
                    <td className="border p-2 bg-gray-50">{momentumDisc}%</td>
                    <td className="border p-2 bg-gray-50">
                      {calcRetailerTotal(field, momentumRate, momentumDisc)}
                    </td>

                    <td className="border p-2">{formatRate(nbeRate)}</td>
                    <td className="border p-2 bg-gray-50">{nbeDisc}%</td>
                    <td className="border p-2 bg-gray-50">
                      {calcRetailerTotal(field, nbeRate, nbeDisc)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
