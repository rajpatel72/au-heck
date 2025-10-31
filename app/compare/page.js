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
  const retailers = ["Origin", "Nectr", "Momentum", "NBE"];
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
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-6">⚡ Electricity Rate Comparison</h1>

      <div className="flex flex-col items-center gap-4 mb-8">
        <select className="border px-4 py-2 rounded w-72" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Select Network Tariff</option>
          {tariffs.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <button onClick={handleCompare} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          {loading ? "Loading..." : "Compare Rates"}
        </button>
      </div>

      {data && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 bg-white shadow text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Field</th>
                <th className="p-2 border bg-blue-50">Usage</th>
                <th className="p-2 border bg-blue-50">Current Rate (¢)</th>
                <th className="p-2 border bg-blue-50">Discount (%)</th>
                <th className="p-2 border bg-blue-50">Manual Total</th>

                {/* dynamic retailer headers: rate, optional discount, total */}
                {retailers.map((ret) => (
                  <React.Fragment key={ret}>
                    <th className="p-2 border">{ret} (¢)</th>
                    {hasDiscountFor[ret] && <th className="p-2 border bg-gray-50">{ret} Discount (%)</th>}
                    <th className="p-2 border bg-gray-50">{ret} Total</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {fields.map((field) => {
                const originRate = parseFloat(data.Origin?.[field]) || 0;
                const nectrRate = parseFloat(data.Nectr?.[field]) || 0;
                const momentumRate = parseFloat(data.Momentum?.[field]) || 0;
                const nbeRate = parseFloat(data.NBE?.[field]) || 0;

                const allEmpty = originRate === 0 && nectrRate === 0 && momentumRate === 0 && nbeRate === 0;
                if (allEmpty) return null;

                const originDisc = parseFloat(data.Origin?.["Discount"]) || 0;
                const nectrDisc = parseFloat(data.Nectr?.["Discount"]) || 0;
                const momentumDisc = parseFloat(data.Momentum?.["Discount"]) || 0;
                const nbeDisc = parseFloat(data.NBE?.["Discount"]) || 0;

                const usage = userInputs[field]?.usage || "";
                const manualRate = userInputs[field]?.rate || "";
                const manualDisc = userInputs[field]?.discount || "";

                return (
                  <tr key={field} className="text-center hover:bg-gray-50">
                    <td className="border p-2 text-left">{field}</td>

                    <td className="border p-2">
                      <input
                        type="number"
                        value={usage}
                        onChange={(e) => handleInputChange("default", field, "usage", e.target.value)}
                        className="w-20 border rounded px-2 py-1 text-sm"
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="number"
                        value={manualRate}
                        onChange={(e) => handleInputChange("default", field, "rate", e.target.value)}
                        className="w-24 border rounded px-2 py-1 text-sm"
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="number"
                        value={manualDisc}
                        onChange={(e) => handleInputChange("default", field, "discount", e.target.value)}
                        className="w-20 border rounded px-2 py-1 text-sm"
                        disabled={noDiscountFields.includes(field)}
                      />
                    </td>

                    <td className="border p-2 font-semibold text-blue-700">{calcTotal(usage, manualRate, manualDisc, field)}</td>

                    {/* Retailer cells rendered according to hasDiscountFor */}
                    {/* Origin */}
                    <td className="border p-2">{formatRate(originRate)}</td>
                    {hasDiscountFor["Origin"] && <td className="border p-2 bg-gray-50">{originDisc}%</td>}
                    <td className="border p-2 bg-gray-50">{calcRetailerTotal(field, originRate, originDisc, usage)}</td>

                    {/* Nectr */}
                    <td className="border p-2">{formatRate(nectrRate)}</td>
                    {hasDiscountFor["Nectr"] && <td className="border p-2 bg-gray-50">{nectrDisc}%</td>}
                    <td className="border p-2 bg-gray-50">{calcRetailerTotal(field, nectrRate, nectrDisc, usage)}</td>

                    {/* Momentum */}
                    <td className="border p-2">{formatRate(momentumRate)}</td>
                    {hasDiscountFor["Momentum"] && <td className="border p-2 bg-gray-50">{momentumDisc}%</td>}
                    <td className="border p-2 bg-gray-50">{calcRetailerTotal(field, momentumRate, momentumDisc, usage)}</td>

                    {/* NBE */}
                    <td className="border p-2">{formatRate(nbeRate)}</td>
                    {hasDiscountFor["NBE"] && <td className="border p-2 bg-gray-50">{nbeDisc}%</td>}
                    <td className="border p-2 bg-gray-50">{calcRetailerTotal(field, nbeRate, nbeDisc, usage)}</td>
                  </tr>
                );
              })}

              {/* Custom Rows */}
              {customRows.map((row) => (
                <tr key={row.field} className="text-center bg-yellow-50">
                  <td className="border p-2 text-left font-medium">{row.field}</td>

                  {/* usage, manual rate, manual discount */}
                  {["usage", "rate", "discount"].map((key) => (
                    <td key={key} className="border p-2">
                      <input
                        type="number"
                        value={row[key]}
                        onChange={(e) => handleInputChange("custom", row.field, key, e.target.value)}
                        className="w-20 border rounded px-2 py-1 text-sm"
                      />
                    </td>
                  ))}

                  <td className="border p-2 font-semibold text-blue-700">{calcTotal(row.usage, row.rate, row.discount, row.field)}</td>

                  {/* For each retailer: rate input, optional discount input, total cell */}
                  {retailers.map((ret) => {
                    const prefix = ret.toLowerCase(); // origin, nectr, ...
                    return (
                      <React.Fragment key={ret}>
                        <td className="border p-2">
                          <input
                            type="number"
                            value={row[`${prefix}Rate`]}
                            onChange={(e) => handleInputChange("custom", row.field, `${prefix}Rate`, e.target.value)}
                            className="w-24 border rounded px-2 py-1 text-sm"
                          />
                        </td>

                        {/* only show discount input if retailer has discount configured */}
                        {hasDiscountFor[ret] && (
                          <td className="border p-2 bg-gray-50">
                            <input
                              type="number"
                              value={row[`${prefix}Discount`]}
                              onChange={(e) => handleInputChange("custom", row.field, `${prefix}Discount`, e.target.value)}
                              className="w-20 border rounded px-2 py-1 text-sm"
                            />
                          </td>
                        )}

                        <td className="border p-2 bg-gray-50">
                          {calcRetailerTotal(row.field, row[`${prefix}Rate`], hasDiscountFor[ret] ? row[`${prefix}Discount`] : 0, row.usage)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}

              {/* TOTAL row - respects whether each retailer has a discount column (we still show totals regardless) */}
              <tr className="font-bold bg-blue-100 text-center">
                <td className="border p-2 text-left">TOTAL</td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>

                <td className="border p-2 text-blue-700">{totalForRetailer("manual")}</td>

                {/* render totals for each retailer with placeholder empty header cells aligned to their columns */}
                {retailers.map((ret) => (
                  <React.Fragment key={ret}>
                    <td className="border p-2"></td>
                    {hasDiscountFor[ret] && <td className="border p-2"></td>}
                    <td className="border p-2 bg-gray-50">{totalForRetailer(ret)}</td>
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
