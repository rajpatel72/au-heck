"use client";
import React, { useEffect, useState, useMemo } from "react";

/**
 * Full futuristic UI while preserving all business logic.
 * Paste/replace your old file with this.
 */

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
      setCustomRows((prev) => prev.map((r) => (r.field === field ? { ...r, [key]: value } : r)));
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
      // note: 1St Energy keys left out for brevity — consistent with earlier usage
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
    // rateInDollars for network data and custom retailer inputs is in cents — convert to dollars
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

  // Retailers and discount map
  const retailers = ["Origin", "Nectr", "Momentum", "NBE", "1St Energy"];
  const hasDiscountFor = {};
  if (data) {
    retailers.forEach((r) => {
      hasDiscountFor[r] =
        typeof data?.[r]?.Discount !== "undefined" && data?.[r]?.Discount !== null;
    });
  }

  // Preserve your total calculation logic
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
        const discFromData = hasDiscountFor[retailerKey]
          ? parseFloat(data?.[retailerKey]?.Discount) || 0
          : 0;
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
        const disc = hasDiscountFor[retailerKey] ? row[`${prefix}Discount`] : 0;
        const valStr = calcRetailerTotal(row.field, rate, disc, u);
        const v = parseFloat(valStr);
        if (!isNaN(v)) total += v;
      }
    });

    return total.toFixed(2);
  };

  // Compute totals map (memoized)
  const totalsMap = useMemo(() => {
    const map = { manual: parseFloat(totalForRetailer("manual")) || 0 };
    retailers.forEach((r) => {
      map[r] = parseFloat(totalForRetailer(r)) || 0;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, userInputs, customRows]);

  // determine max for bars (avoid zero)
  const maxTotal = Math.max(...Object.values(totalsMap), 1);

  // helper to render comparison bar
  const renderBar = (val) => {
    const v = parseFloat(val) || 0;
    const pct = Math.min(100, Math.round((v / maxTotal) * 100));
    return (
      <div className="h-2 w-full bg-white/6 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, rgba(99,102,241,0.9), rgba(139,92,246,0.9), rgba(236,72,153,0.9))",
            boxShadow: "0 6px 18px rgba(139,92,246,0.18)",
          }}
        />
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#030712] via-[#07102a] to-[#030712] p-8 font-sans text-gray-100">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl md:text-4xl font-extrabold tracking-tight">
              <span className="inline-block w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-400 to-rose-400 text-black flex items-center justify-center shadow-md">
                ⚡
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-300">
                Electricity Rate Comparison
              </span>
            </h1>
            <p className="mt-1 text-sm text-gray-400">Compare network and retail rates with a futuristic dashboard.</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="bg-white/6 backdrop-blur rounded-lg px-3 py-2 text-sm md:text-base border border-white/10 focus:ring-2 focus:ring-cyan-400 outline-none transition"
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-semibold hover:brightness-105 shadow-lg transition"
            >
              {loading ? "Loading…" : "Compare"}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <section className="max-w-7xl mx-auto">
        {!data && (
          <div className="rounded-2xl border border-white/6 bg-white/3 p-8 text-center">
            <p className="text-gray-300">Choose a tariff and press Compare to load rates. The table is interactive and responsive.</p>
          </div>
        )}

        {data && (
          <div className="rounded-2xl border border-white/8 bg-gradient-to-bl from-white/3 to-white/2/5 p-4 backdrop-blur-lg shadow-2xl">
            {/* table container */}
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full table-fixed border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-r from-white/6 to-white/3 text-xs text-gray-300 uppercase tracking-wider">
                    <th className="p-3 text-left w-56">Field</th>
                    <th className="p-3 w-28">Usage</th>
                    <th className="p-3 w-32">Rate (¢)</th>
                    <th className="p-3 w-24">Disc %</th>
                    <th className="p-3 w-36">Manual Total</th>
                    {retailers.map((ret) => (
                      <React.Fragment key={ret}>
                        <th className="p-3 w-24">{ret} ¢</th>
                        {hasDiscountFor[ret] && <th className="p-3 w-20">Disc</th>}
                        <th className="p-3 w-36">{ret} Total</th>
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

                    const originDisc = parseFloat(data.Origin?.Discount) || 0;
                    const nectrDisc = parseFloat(data.Nectr?.Discount) || 0;
                    const momentumDisc = parseFloat(data.Momentum?.Discount) || 0;
                    const nbeDisc = parseFloat(data.NBE?.Discount) || 0;

                    const usage = userInputs[field]?.usage || "";
                    const manualRate = userInputs[field]?.rate || "";
                    const manualDisc = userInputs[field]?.discount || "";

                    return (
                      <tr key={field} className="odd:bg-white/2 even:bg-white/3 hover:bg-white/5 transition">
                        <td className="p-3 text-left font-medium">{field}</td>

                        <td className="p-2">
                          <input
                            type="number"
                            value={usage}
                            onChange={(e) => handleInputChange("default", field, "usage", e.target.value)}
                            className="w-full bg-transparent border border-white/6 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-cyan-400 outline-none"
                            placeholder="0"
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            value={manualRate}
                            onChange={(e) => handleInputChange("default", field, "rate", e.target.value)}
                            className="w-full bg-transparent border border-white/6 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-cyan-400 outline-none"
                            placeholder="¢"
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            value={manualDisc}
                            onChange={(e) => handleInputChange("default", field, "discount", e.target.value)}
                            className="w-full bg-transparent border border-white/6 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-cyan-400 outline-none"
                            disabled={noDiscountFields.includes(field)}
                            placeholder="%"
                          />
                        </td>

                        <td className="p-3 font-semibold text-cyan-300">{calcTotal(usage, manualRate, manualDisc, field)}</td>

                        {/* Origin */}
                        <td className="p-3">{formatRate(originRate)}</td>
                        {hasDiscountFor["Origin"] && <td className="p-3">{originDisc}%</td>}
                        <td className="p-3">
                          <div className="flex flex-col gap-2">
                            <div className="text-sm font-medium">{calcRetailerTotal(field, originRate, originDisc, usage)}</div>
                          </div>
                        </td>

                        {/* Nectr */}
                        <td className="p-3">{formatRate(nectrRate)}</td>
                        {hasDiscountFor["Nectr"] && <td className="p-3">{nectrDisc}%</td>}
                        <td className="p-3">{calcRetailerTotal(field, nectrRate, nectrDisc, usage)}</td>

                        {/* Momentum */}
                        <td className="p-3">{formatRate(momentumRate)}</td>
                        {hasDiscountFor["Momentum"] && <td className="p-3">{momentumDisc}%</td>}
                        <td className="p-3">{calcRetailerTotal(field, momentumRate, momentumDisc, usage)}</td>

                        {/* NBE */}
                        <td className="p-3">{formatRate(nbeRate)}</td>
                        {hasDiscountFor["NBE"] && <td className="p-3">{nbeDisc}%</td>}
                        <td className="p-3">{calcRetailerTotal(field, nbeRate, nbeDisc, usage)}</td>
                      </tr>
                    );
                  })}

                  {/* Custom rows */}
                  {customRows.map((row) => (
                    <tr key={row.field} className="odd:bg-white/2 even:bg-white/3 hover:bg-white/5 transition">
                      <td className="p-3 text-left font-medium">{row.field}</td>

                      {["usage", "rate", "discount"].map((k) => (
                        <td key={k} className="p-2">
                          <input
                            type="number"
                            value={row[k]}
                            onChange={(e) => handleInputChange("custom", row.field, k, e.target.value)}
                            className="w-full bg-transparent border border-white/6 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-cyan-400 outline-none"
                          />
                        </td>
                      ))}

                      <td className="p-3 font-semibold text-cyan-300">{calcTotal(row.usage, row.rate, row.discount, row.field)}</td>

                      {/* For each retailer, custom inputs and total */}
                      {retailers.map((ret) => {
                        const prefix = ret.toLowerCase();
                        return (
                          <React.Fragment key={ret}>
                            <td className="p-3">
                              <input
                                type="number"
                                value={row[`${prefix}Rate`]}
                                onChange={(e) => handleInputChange("custom", row.field, `${prefix}Rate`, e.target.value)}
                                className="w-full bg-transparent border border-white/6 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-cyan-400 outline-none"
                              />
                            </td>

                            {hasDiscountFor[ret] && (
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={row[`${prefix}Discount`]}
                                  onChange={(e) =>
                                    handleInputChange("custom", row.field, `${prefix}Discount`, e.target.value)
                                  }
                                  className="w-full bg-transparent border border-white/6 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-cyan-400 outline-none"
                                />
                              </td>
                            )}

                            <td className="p-3 font-semibold text-cyan-300">
                              {calcRetailerTotal(row.field, row[`${prefix}Rate`], hasDiscountFor[ret] ? row[`${prefix}Discount`] : 0, row.usage)}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}

                  {/* TOTAL row with bars for visual comparison */}
                  <tr className="bg-gradient-to-r from-white/4 to-white/6">
                    <td className="p-4 text-left font-extrabold">TOTAL</td>
                    <td colSpan={3} />
                    <td className="p-4 text-cyan-300 font-extrabold">{totalForRetailer("manual")}</td>

                    {/* totals & bars for each retailer */}
                    {retailers.map((ret) => (
                      <React.Fragment key={ret}>
                        <td className="p-3" />
                        {hasDiscountFor[ret] && <td className="p-3" />}
                        <td className="p-3">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium">{ret}</span>
                              <span className="font-semibold">{Number(totalsMap[ret] || 0).toFixed(2)}</span>
                            </div>
                            <div>{renderBar(totalsMap[ret] || 0)}</div>
                          </div>
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Add custom row CTA */}
            <div className="mt-4 flex gap-3">
              <button onClick={addCustomRow} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 text-black font-semibold shadow-md hover:brightness-105 transition">
                ➕ Add Custom Row
              </button>

              <button
                onClick={() => {
                  // quick export CSV of totals (simple)
                  const csvRows = [["Retailer","Total"], ["Manual", totalForRetailer("manual")], ...retailers.map(r=>[r, totalForRetailer(r)])];
                  const csv = csvRows.map(r => r.join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "totals.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="py-2 px-4 rounded-lg border border-white/10 text-sm text-gray-200 hover:bg-white/3 transition"
              >
                ⤓ Export Totals
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
