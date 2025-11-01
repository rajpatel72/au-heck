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
    "Daily supply charge", "Peak", "Peak 2", "Shoulder", "Off Peak",
    "CL1", "CL2", "CL3", "Capacity Charges", "Demand 1", "Demand 2", "Solar",
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
      usage: "", rate: "", discount: "",
      originRate: "", originDiscount: "",
      nectrRate: "", nectrDiscount: "",
      momentumRate: "", momentumDiscount: "",
      nbeRate: "", nbeDiscount: "",
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
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 text-gray-100">
      <h1 className="text-4xl font-extrabold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300 drop-shadow-lg">
        ⚡ Electricity Rate Comparison
      </h1>

      <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
        <select
          className="px-4 py-3 rounded-lg bg-gray-800/70 border border-gray-700 backdrop-blur-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
          className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {loading ? "Loading..." : "Compare Rates"}
        </button>

        {data && (
          <button
            onClick={addCustomRow}
            className="px-5 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold hover:brightness-110 transition-all duration-200 shadow-md"
          >
            + Add Custom Row
          </button>
        )}
      </div>

      {data && (
        <div className="overflow-x-auto shadow-2xl rounded-2xl border border-gray-700 backdrop-blur-lg bg-gray-900/70">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-blue-700 to-teal-600 text-white text-center">
                <th className="p-3 border border-gray-700 text-left">Field</th>
                <th className="p-3 border border-gray-700">Usage</th>
                <th className="p-3 border border-gray-700">Current Rate (¢)</th>
                <th className="p-3 border border-gray-700">Discount (%)</th>
                <th className="p-3 border border-gray-700 text-blue-200">Manual Total</th>
                <th className="p-3 border border-gray-700">Origin (¢)</th>
                <th className="p-3 border border-gray-700">Origin Discount</th>
                <th className="p-3 border border-gray-700">Origin Total</th>
                <th className="p-3 border border-gray-700">Nectr (¢)</th>
                <th className="p-3 border border-gray-700">Nectr Discount</th>
                <th className="p-3 border border-gray-700">Nectr Total</th>
                <th className="p-3 border border-gray-700">Momentum (¢)</th>
                <th className="p-3 border border-gray-700">Momentum Discount</th>
                <th className="p-3 border border-gray-700">Momentum Total</th>
                <th className="p-3 border border-gray-700">NBE (¢)</th>
                <th className="p-3 border border-gray-700">NBE Discount</th>
                <th className="p-3 border border-gray-700">NBE Total</th>
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
                  <tr key={field} className="hover:bg-gray-800/50 transition">
                    <td className="border border-gray-700 p-2 text-left">{field}</td>
                    <td className="border border-gray-700 p-2">
                      <input
                        type="number"
                        value={usage}
                        onChange={(e) => handleInputChange("default", field, "usage", e.target.value)}
                        className="w-20 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </td>
                    <td className="border border-gray-700 p-2">
                      <input
                        type="number"
                        value={manualRate}
                        onChange={(e) => handleInputChange("default", field, "rate", e.target.value)}
                        className="w-24 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-400"
                      />
                    </td>
                    <td className="border border-gray-700 p-2">
                      <input
                        type="number"
                        value={manualDisc}
                        onChange={(e) => handleInputChange("default", field, "discount", e.target.value)}
                        className="w-20 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-400"
                        disabled={noDiscountFields.includes(field)}
                      />
                    </td>
                    <td className="border border-gray-700 p-2 text-blue-400 font-semibold">
                      {calcTotal(usage, manualRate, manualDisc, field)}
                    </td>
                    <td className="border border-gray-700 p-2">{formatRate(originRate)}</td>
                    <td className="border border-gray-700 p-2">{originDisc}%</td>
                    <td className="border border-gray-700 p-2">{calcRetailerTotal(field, originRate, originDisc, usage)}</td>
                    <td className="border border-gray-700 p-2">{formatRate(nectrRate)}</td>
                    <td className="border border-gray-700 p-2">{nectrDisc}%</td>
                    <td className="border border-gray-700 p-2">{calcRetailerTotal(field, nectrRate, nectrDisc, usage)}</td>
                    <td className="border border-gray-700 p-2">{formatRate(momentumRate)}</td>
                    <td className="border border-gray-700 p-2">{momentumDisc}%</td>
                    <td className="border border-gray-700 p-2">{calcRetailerTotal(field, momentumRate, momentumDisc, usage)}</td>
                    <td className="border border-gray-700 p-2">{formatRate(nbeRate)}</td>
                    <td className="border border-gray-700 p-2">{nbeDisc}%</td>
                    <td className="border border-gray-700 p-2">{calcRetailerTotal(field, nbeRate, nbeDisc, usage)}</td>
                  </tr>
                );
              })}

              {customRows.map((row) => (
                <tr key={row.field} className="bg-amber-100/20 hover:bg-amber-200/10 transition">
                  <td className="border border-gray-700 p-2 text-left font-medium text-amber-300">
                    {row.field}
                  </td>
                  {["usage", "rate", "discount"].map((key) => (
                    <td key={key} className="border border-gray-700 p-2">
                      <input
                        type="number"
                        value={row[key]}
                        onChange={(e) =>
                          handleInputChange("custom", row.field, key, e.target.value)
                        }
                        className="w-20 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-amber-400"
                      />
                    </td>
                  ))}
                  <td className="border border-gray-700 p-2 text-blue-400 font-semibold">
                    {calcTotal(row.usage, row.rate, row.discount, row.field)}
                  </td>

                  {["origin", "nectr", "momentum", "nbe"].map((ret) => (
                    <React.Fragment key={ret}>
                      <td className="border border-gray-700 p-2">
                        <input
                          type="number"
                          value={row[`${ret}Rate`]}
                          onChange={(e) =>
                            handleInputChange("custom", row.field, `${ret}Rate`, e.target.value)
                          }
                          className="w-24 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-amber-400"
                        />
                      </td>
                      <td className="border border-gray-700 p-2">
                        <input
                          type="number"
                          value={row[`${ret}Discount`]}
                          onChange={(e) =>
                            handleInputChange("custom", row.field, `${ret}Discount`, e.target.value)
                          }
                          className="w-20 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-amber-400"
                        />
                      </td>
                      <td className="border border-gray-700 p-2">
                        {calcTotal(
                          row.usage,
                          row[`${ret}Rate`],
                          row[`${ret}Discount`],
                          row.field
                        )}
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}

              <tr className="font-bold bg-gradient-to-r from-blue-800 to-cyan-700 text-white">
                <td className="border border-gray-700 p-3 text-left">TOTAL</td>
                <td className="border border-gray-700"></td>
                <td className="border border-gray-700"></td>
                <td className="border border-gray-700"></td>
                <td className="border border-gray-700 text-blue-200">{totalForRetailer("manual")}</td>
                <td colSpan={2}></td>
                <td className="border border-gray-700">{totalForRetailer("Origin")}</td>
                <td colSpan={2}></td>
                <td className="border border-gray-700">{totalForRetailer("Nectr")}</td>
                <td colSpan={2}></td>
                <td className="border border-gray-700">{totalForRetailer("Momentum")}</td>
                <td colSpan={2}></td>
                <td className="border border-gray-700">{totalForRetailer("NBE")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
