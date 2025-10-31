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
    // rateInDollars for network data and custom retailer inputs is in cents (like your data),
    // calcRetailerTotal converts cents -> dollars by dividing by 100.
    const rate = parseFloat(rateInDollars || 0) / 100;
    const d = parseFloat(discount || 0);
    if (!usageVal || !rate) return "-";
    const factor = noDiscountFields.includes(field) ? 1 : 1 - d / 100;
    return (usageVal * rate * factor).toFixed(2);
  };

  const formatRate = (rate) => {
    const r = parseFloat(rate);
    if (isNaN(r)) return "-";
    return (r / 100).toFixed(4); // show cents -> dollars with 4 decimals
  };

  // --- New: retailers list + discount presence map ---
  const retailers = ["Origin", "Nectr", "Momentum", "NBE", "1St Energy"];
  // hasDiscountFor: { Origin: true/false, ... }
  const hasDiscountFor = {};
  if (data) {
    retailers.forEach((r) => {
      // explicit check for undefined/null - if Discount not provided, treat as no-discount
      hasDiscountFor[r] = typeof data?.[r]?.Discount !== "undefined" && data?.[r]?.Discount !== null;
    });
  }

  // Sum totals for a column (manual + retailers) — corrected and respects missing discount columns
  const totalForRetailer = (retailerKey) => {
    let total = 0;

    // Sum default rows (fields from network data)
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
        // if retailer doesn't have a Discount field, treat discount as 0
        const discFromData = hasDiscountFor[retailerKey] ? parseFloat(data?.[retailerKey]?.Discount) || 0 : 0;
        const valStr = calcRetailerTotal(f, rateFromData, discFromData, usage);
        const val = parseFloat(valStr);
        if (!isNaN(val)) total += val;
      }
    });

    // Sum custom rows
    customRows.forEach((row) => {
      const u = row.usage;

      if (retailerKey === "manual") {
        const valStr = calcTotal(u, row.rate, row.discount, row.field);
        const v = parseFloat(valStr);
        if (!isNaN(v)) total += v;
      } else {
        const prefix = retailerKey.toLowerCase(); // "origin", "nectr", ...
        const rate = row[`${prefix}Rate`];
        // if the retailer doesn't have discount configured globally (hasDiscountFor false)
        // we also hide the custom discount input — but here we treat missing as 0
        const disc = hasDiscountFor[retailerKey] ? row[`${prefix}Discount`] : 0;

        const valStr = calcRetailerTotal(row.field, rate, disc, u);
        const v = parseFloat(valStr);
        if (!isNaN(v)) total += v;
      }
    });

    return total.toFixed(2);
  };

  return (
  <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-8 text-white font-sans">
    <h1 className="text-4xl font-extrabold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 tracking-wider drop-shadow-lg">
      ⚡ Electricity Rate Comparison
    </h1>

    {/* selector + button */}
    <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-10">
      <select
        className="w-72 bg-gray-900/70 border border-cyan-500 text-cyan-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-400 outline-none transition"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Select Network Tariff</option>
        {tariffs.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <button
        onClick={handleCompare}
        className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold hover:brightness-125 transition shadow-lg tracking-wide"
      >
        {loading ? "Loading..." : "Compare"}
      </button>
    </div>

    {/* table */}
    {data && (
      <div className="overflow-x-auto rounded-xl border border-cyan-600/40 shadow-[0_0_25px_rgba(0,255,255,0.25)] bg-gray-900/60 backdrop-blur-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-800/80 text-cyan-400 uppercase tracking-widest">
            <tr>
              <th className="p-3 border border-gray-700">Field</th>
              <th className="p-3 border border-gray-700">Usage</th>
              <th className="p-3 border border-gray-700">Rate (¢)</th>
              <th className="p-3 border border-gray-700">Disc %</th>
              <th className="p-3 border border-gray-700 text-purple-400">Total</th>

              {retailers.map((ret) => (
                <React.Fragment key={ret}>
                  <th className="p-3 border border-gray-700">{ret} ¢</th>
                  {hasDiscountFor[ret] && (
                    <th className="p-3 border border-gray-700">Disc %</th>
                  )}
                  <th className="p-3 border border-gray-700 text-purple-400">{ret} Total</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {fields.map((field) => {
              const usage = userInputs[field]?.usage || "";
              const rate = userInputs[field]?.rate || "";
              const discount = userInputs[field]?.discount || "";
              const originRate = parseFloat(data.Origin?.[field]) || 0;
              const nectrRate = parseFloat(data.Nectr?.[field]) || 0;
              const momentumRate = parseFloat(data.Momentum?.[field]) || 0;
              const nbeRate = parseFloat(data.NBE?.[field]) || 0;

              if (originRate + nectrRate + momentumRate + nbeRate === 0) return null;

              const originDisc = data.Origin?.Discount || 0;
              const nectrDisc = data.Nectr?.Discount || 0;
              const momentumDisc = data.Momentum?.Discount || 0;
              const nbeDisc = data.NBE?.Discount || 0;

              return (
                <tr key={field} className="hover:bg-gray-800/60 transition">
                  <td className="border border-gray-800 p-2 text-left">{field}</td>

                  <td className="border border-gray-800 p-2">
                    <input
                      type="number"
                      value={usage}
                      onChange={(e) => handleInputChange("default", field, "usage", e.target.value)}
                      className="w-20 bg-black/40 text-cyan-300 border border-cyan-500/40 rounded px-2 py-1 text-xs"
                    />
                  </td>

                  <td className="border border-gray-800 p-2">
                    <input
                      type="number"
                      value={rate}
                      onChange={(e) => handleInputChange("default", field, "rate", e.target.value)}
                      className="w-24 bg-black/40 text-cyan-300 border border-cyan-500/40 rounded px-2 py-1 text-xs"
                    />
                  </td>

                  <td className="border border-gray-800 p-2">
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => handleInputChange("default", field, "discount", e.target.value)}
                      className="w-16 bg-black/40 text-cyan-300 border border-cyan-500/40 rounded px-2 py-1 text-xs"
                      disabled={noDiscountFields.includes(field)}
                    />
                  </td>

                  <td className="border border-gray-800 p-2 font-bold text-purple-300">
                    {calcTotal(usage, rate, discount, field)}
                  </td>

                  {/* retailers */}
                  {[
                    ["Origin", originRate, originDisc],
                    ["Nectr", nectrRate, nectrDisc],
                    ["Momentum", momentumRate, momentumDisc],
                    ["NBE", nbeRate, nbeDisc],
                  ].map(([ret, r, d]) => (
                    <React.Fragment key={ret}>
                      <td className="border border-gray-800 p-2">{formatRate(r)}</td>
                      {hasDiscountFor[ret] && (
                        <td className="border border-gray-800 p-2">{d}%</td>
                      )}
                      <td className="border border-gray-800 p-2 text-purple-300 font-semibold">
                        {calcRetailerTotal(field, r, d, usage)}
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              );
            })}

            {/* TOTAL */}
            <tr className="bg-gray-900/80 font-extrabold text-cyan-300 text-center tracking-wide">
              <td className="p-3 text-left">TOTAL</td>
              <td colSpan={3}></td>
              <td className="p-2">{totalForRetailer("manual")}</td>

              {retailers.map((r) => (
                <React.Fragment key={r}>
                  <td></td>
                  {hasDiscountFor[r] && <td></td>}
                  <td className="p-2 text-purple-300">{totalForRetailer(r)}</td>
                </React.Fragment>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    )}
  </main>
);

}
