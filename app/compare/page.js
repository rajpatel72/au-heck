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
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-10">
      <h1 className="text-4xl font-extrabold text-center mb-10 tracking-wide drop-shadow-[0_0_8px_#00f0ff]">
        ⚡ Electricity Rate Comparison
      </h1>

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <select
          className="bg-gray-800 text-white border border-cyan-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
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
          className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg text-white font-semibold shadow-lg hover:from-cyan-400 hover:to-blue-500 transition-all"
        >
          {loading ? "Loading..." : "Compare Rates"}
        </button>

        <button
          onClick={addCustomRow}
          className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-lg text-white font-semibold shadow-lg hover:from-purple-400 hover:to-pink-400 transition-all"
        >
          + Add Custom Row
        </button>
      </div>

      {data && (
        <div className="overflow-x-auto rounded-xl shadow-xl bg-white/10 backdrop-blur-lg border border-cyan-400/40">
          <table className="min-w-full text-sm">
            <thead className="bg-gradient-to-r from-cyan-700 to-blue-700 text-white">
              <tr>
                {[
                  "Field",
                  "Usage",
                  "Current Rate (¢)",
                  "Discount (%)",
                  "Manual Total",
                  "Origin (¢)",
                  "Origin Disc",
                  "Origin Total",
                  "Nectr (¢)",
                  "Nectr Disc",
                  "Nectr Total",
                  "Momentum (¢)",
                  "Momentum Disc",
                  "Momentum Total",
                  "NBE (¢)",
                  "NBE Disc",
                  "NBE Total",
                ].map((header) => (
                  <th key={header} className="p-2 border border-cyan-500/40">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {[...fields, ...customRows.map((r) => r.field)].map((field) => {
                const isCustom = field.toLowerCase().includes("custom");
                const row = customRows.find((r) => r.field === field);
                const usage = isCustom
                  ? row?.usage
                  : userInputs[field]?.usage || "";
                const manualRate = isCustom
                  ? row?.rate
                  : userInputs[field]?.rate || "";
                const manualDisc = isCustom
                  ? row?.discount
                  : userInputs[field]?.discount || "";

                const originRate = isCustom
                  ? row?.originRate
                  : data.Origin?.[field];
                const originDisc = isCustom
                  ? row?.originDiscount
                  : data.Origin?.Discount || 0;

                const nectrRate = isCustom ? row?.nectrRate : data.Nectr?.[field];
                const nectrDisc = isCustom
                  ? row?.nectrDiscount
                  : data.Nectr?.Discount || 0;

                const momentumRate = isCustom
                  ? row?.momentumRate
                  : data.Momentum?.[field];
                const momentumDisc = isCustom
                  ? row?.momentumDiscount
                  : data.Momentum?.Discount || 0;

                const nbeRate = isCustom ? row?.nbeRate : data.NBE?.[field];
                const nbeDisc = isCustom
                  ? row?.nbeDiscount
                  : data.NBE?.Discount || 0;

                return (
                  <tr
                    key={field}
                    className={`text-center border-t border-cyan-300/30 ${
                      isCustom ? "bg-purple-900/20" : "hover:bg-gray-900/30"
                    }`}
                  >
                    <td className="border border-cyan-300/30 text-left p-2 font-medium">
                      {field}
                    </td>

                    {["usage", "rate", "discount"].map((key) => (
                      <td key={key} className="p-2 border border-cyan-300/30">
                        <input
                          type="number"
                          value={
                            isCustom ? row?.[key] || "" : userInputs[field]?.[key] || ""
                          }
                          onChange={(e) =>
                            handleInputChange(
                              isCustom ? "custom" : "default",
                              field,
                              key,
                              e.target.value
                            )
                          }
                          className="w-20 bg-gray-800 border border-cyan-500/40 rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                        />
                      </td>
                    ))}

                    <td className="p-2 font-semibold text-cyan-400 border border-cyan-300/30">
                      {calcTotal(usage, manualRate, manualDisc, field)}
                    </td>

                    {[["Origin", originRate, originDisc],
                      ["Nectr", nectrRate, nectrDisc],
                      ["Momentum", momentumRate, momentumDisc],
                      ["NBE", nbeRate, nbeDisc]].map(([name, rate, disc]) => (
                        <React.Fragment key={name}>
                          <td className="border border-cyan-300/30 p-2">
                            {formatRate(rate)}
                          </td>
                          <td className="border border-cyan-300/30 p-2 text-gray-300">
                            {disc}%
                          </td>
                          <td className="border border-cyan-300/30 p-2 text-cyan-300">
                            {calcRetailerTotal(field, rate, disc, usage)}
                          </td>
                        </React.Fragment>
                      ))}
                  </tr>
                );
              })}

              <tr className="font-bold bg-gradient-to-r from-cyan-700 to-blue-700 text-center text-white">
                <td className="p-2 text-left border border-cyan-500/40">TOTAL</td>
                <td colSpan={3}></td>
                <td className="border border-cyan-500/40">{totalForRetailer("manual")}</td>
                <td colSpan={2}></td>
                <td className="border border-cyan-500/40">{totalForRetailer("Origin")}</td>
                <td colSpan={2}></td>
                <td className="border border-cyan-500/40">{totalForRetailer("Nectr")}</td>
                <td colSpan={2}></td>
                <td className="border border-cyan-500/40">{totalForRetailer("Momentum")}</td>
                <td colSpan={2}></td>
                <td className="border border-cyan-500/40">{totalForRetailer("NBE")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
