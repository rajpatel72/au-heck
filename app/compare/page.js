"use client";
import React, { useEffect, useState } from "react";

export default function ComparePage() {
  const [tariffs, setTariffs] = useState([]);
  const [selected, setSelected] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userInputs, setUserInputs] = useState({});
  const [customRows, setCustomRows] = useState([]);

  useEffect(() => {
    fetch("/api/tariffs")
      .then((res) => res.json())
      .then((list) => setTariffs(list.sort()))
      .catch((err) => console.error("Failed to load tariffs:", err));
  }, []);

  const handleCompare = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/compare?tariff=${encodeURIComponent(selected)}`);
      const result = await res.json();
      setData(result);
      setUserInputs({});
      setCustomRows([]);
    } catch (err) {
      console.error("Compare error:", err);
    } finally {
      setLoading(false);
    }
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

  const noDiscountFields = ["Capacity Charges", "Demand 1", "Demand 2", "Solar"];

  const handleInputChange = (rowType, field, key, value) => {
    if (rowType === "custom") {
      setCustomRows((prev) =>
        prev.map((r) => (r.field === field ? { ...r, [key]: value } : r))
      );
    } else {
      setUserInputs((prev) => ({
        ...prev,
        [field]: { ...prev[field], [key]: value },
      }));
    }
  };

  const addCustomRow = () => {
    const newRow = {
      field: `Custom Row ${customRows.length + 1}`,
      usage: "",
      rate: "",
      discount: "",
      originRate: "",
      originDiscount: "",
      nectrRate: "",
      nectrDiscount: "",
      momentumRate: "",
      momentumDiscount: "",
      nbeRate: "",
      nbeDiscount: "",
    };
    setCustomRows((prev) => [...prev, newRow]);
  };

  const calcTotal = (usage, rate, discount, field) => {
    const u = parseFloat(usage || 0);
    const r = parseFloat(rate || 0);
    const d = parseFloat(discount || 0);
    if (!u || !r) return "-";
    const factor = noDiscountFields.includes(field) ? 1 : 1 - d / 100;
    return (u * r * factor).toFixed(2);
  };

  const calcRetailerTotal = (field, rateInDollars, discount, usage) => {
    const usageVal = parseFloat(usage || 0);
    const rate = parseFloat(rateInDollars || 0) / 100;
    const d = parseFloat(discount || 0);
    if (!usageVal || !rate) return "-";
    const factor = noDiscountFields.includes(field) ? 1 : 1 - d / 100;
    return (usageVal * rate * factor).toFixed(2);
  };

  const formatRate = (rate) => {
    const r = parseFloat(rate);
    if (isNaN(r)) return "-";
    return (r / 100).toFixed(4);
  };

  const totalForRetailer = (retailerKey) => {
    let total = 0;
    fields.forEach((f) => {
      const usage = userInputs[f]?.usage;
      const manualRate = userInputs[f]?.rate;
      const manualDisc = userInputs[f]?.discount;
      if (retailerKey === "manual") {
        const valStr = calcTotal(usage, manualRate, manualDisc, f);
        const val = parseFloat(valStr);
        if (!isNaN(val)) total += val;
      } else {
        const rateFromData = parseFloat(data?.[retailerKey]?.[f]) || 0;
        const discFromData = parseFloat(data?.[retailerKey]?.Discount) || 0;
        const valStr = calcRetailerTotal(f, rateFromData, discFromData, usage);
        const val = parseFloat(valStr);
        if (!isNaN(val)) total += val;
      }
    });

    customRows.forEach((row) => {
      const u = row.usage;
      if (retailerKey === "manual") {
        const valStr = calcTotal(u, row.rate, row.discount, row.field);
        const v = parseFloat(valStr);
        if (!isNaN(v)) total += v;
      } else {
        const prefix = retailerKey.toLowerCase();
        const rate = row[`${prefix}Rate`];
        const disc = row[`${prefix}Discount`];
        const valStr = calcRetailerTotal(row.field, rate, disc, u);
        const v = parseFloat(valStr);
        if (!isNaN(v)) total += v;
      }
    });

    return total.toFixed(2);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-10 bg-gradient-to-r from-blue-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
          ⚡ Electricity Rate Comparison
        </h1>

        {/* Tariff Selector */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-10">
          <select
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-3 rounded-xl w-72 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Select Network Tariff</option>
            {tariffs.map((t) => (
              <option key={t} value={t} className="text-black">
                {t}
              </option>
            ))}
          </select>

          <button
            onClick={handleCompare}
            disabled={loading}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${
              loading
                ? "bg-cyan-400/30 text-cyan-200 animate-pulse"
                : "bg-gradient-to-r from-cyan-400 to-blue-600 hover:scale-105 hover:shadow-cyan-400/40 hover:shadow-lg"
            }`}
          >
            {loading ? "Loading..." : "Compare Rates"}
          </button>
        </div>

        {data && (
          <div className="relative overflow-x-auto rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md bg-white/5">
            <table className="min-w-full text-sm text-left text-gray-200">
              <thead className="sticky top-0 bg-white/10 text-cyan-300 backdrop-blur-md">
                <tr>
                  {[
                    "Field",
                    "Usage",
                    "Manual Rate (¢)",
                    "Manual Discount",
                    "Manual Total",
                    "Origin Total",
                    "Nectr Total",
                    "Momentum Total",
                    "NBE Total",
                  ].map((h) => (
                    <th key={h} className="p-3 border-b border-white/10 text-center">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {fields.map((field) => {
                  const usage = userInputs[field]?.usage || "";
                  const manualRate = userInputs[field]?.rate || "";
                  const manualDisc = userInputs[field]?.discount || "";

                  const originRate = parseFloat(data.Origin?.[field]) || 0;
                  const nectrRate = parseFloat(data.Nectr?.[field]) || 0;
                  const momentumRate = parseFloat(data.Momentum?.[field]) || 0;
                  const nbeRate = parseFloat(data.NBE?.[field]) || 0;

                  const originDisc = parseFloat(data.Origin?.["Discount"]) || 0;
                  const nectrDisc = parseFloat(data.Nectr?.["Discount"]) || 0;
                  const momentumDisc = parseFloat(data.Momentum?.["Discount"]) || 0;
                  const nbeDisc = parseFloat(data.NBE?.["Discount"]) || 0;

                  return (
                    <tr
                      key={field}
                      className="text-center hover:bg-white/10 transition-colors"
                    >
                      <td className="p-3 border-b border-white/10 text-left font-medium text-cyan-300">
                        {field}
                      </td>
                      <td>
                        <input
                          type="number"
                          value={usage}
                          onChange={(e) =>
                            handleInputChange("default", field, "usage", e.target.value)
                          }
                          className="w-20 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={manualRate}
                          onChange={(e) =>
                            handleInputChange("default", field, "rate", e.target.value)
                          }
                          className="w-20 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={manualDisc}
                          onChange={(e) =>
                            handleInputChange("default", field, "discount", e.target.value)
                          }
                          disabled={noDiscountFields.includes(field)}
                          className="w-20 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm disabled:opacity-40"
                        />
                      </td>
                      <td className="text-cyan-300 font-semibold">
                        {calcTotal(usage, manualRate, manualDisc, field)}
                      </td>
                      <td>{calcRetailerTotal(field, originRate, originDisc, usage)}</td>
                      <td>{calcRetailerTotal(field, nectrRate, nectrDisc, usage)}</td>
                      <td>{calcRetailerTotal(field, momentumRate, momentumDisc, usage)}</td>
                      <td>{calcRetailerTotal(field, nbeRate, nbeDisc, usage)}</td>
                    </tr>
                  );
                })}

                <tr className="bg-gradient-to-r from-cyan-600/30 to-blue-700/30 text-center font-bold">
                  <td className="p-3 text-left text-cyan-300">TOTAL</td>
                  <td colSpan={3}></td>
                  <td className="text-cyan-200">{totalForRetailer("manual")}</td>
                  <td>{totalForRetailer("Origin")}</td>
                  <td>{totalForRetailer("Nectr")}</td>
                  <td>{totalForRetailer("Momentum")}</td>
                  <td>{totalForRetailer("NBE")}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-center my-6">
              <button
                onClick={addCustomRow}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-400/40 transition-transform hover:scale-105"
              >
                + Add Custom Row
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
