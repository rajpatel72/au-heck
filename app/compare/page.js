"use client";
import React, { useEffect, useState } from "react"; // ✅ add React import

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
    const rate = parseFloat(rateInDollars || 0) / 100; // convert $→¢
    const d = parseFloat(discount || 0);
    if (!usageVal || !rate) return "-";
    const factor = noDiscountFields.includes(field) ? 1 : 1 - d / 100;
    return (usageVal * rate * factor).toFixed(2);
  };

  const formatRate = (rate) => {
    const r = parseFloat(rate);
    if (isNaN(r)) return "-";
    return (r / 100).toFixed(4); // show $→¢ with 4 decimals
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
                <th className="p-2 border bg-blue-50">Usage</th>
                <th className="p-2 border bg-blue-50">Current Rate (¢)</th>
                <th className="p-2 border bg-blue-50">Discount (%)</th>
                <th className="p-2 border bg-blue-50">Manual Total</th>

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

                const allEmpty =
                  originRate === 0 &&
                  nectrRate === 0 &&
                  momentumRate === 0 &&
                  nbeRate === 0;
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
                        onChange={(e) =>
                          handleInputChange("default", field, "usage", e.target.value)
                        }
                        className="w-20 border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={manualRate}
                        onChange={(e) =>
                          handleInputChange("default", field, "rate", e.target.value)
                        }
                        className="w-24 border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={manualDisc}
                        onChange={(e) =>
                          handleInputChange("default", field, "discount", e.target.value)
                        }
                        className="w-20 border rounded px-2 py-1 text-sm"
                        disabled={noDiscountFields.includes(field)}
                      />
                    </td>
                    <td className="border p-2 font-semibold text-blue-700">
                      {calcTotal(usage, manualRate, manualDisc, field)}
                    </td>

                    <td className="border p-2">{formatRate(originRate)}</td>
                    <td className="border p-2 bg-gray-50">{originDisc}%</td>
                    <td className="border p-2 bg-gray-50">
                      {calcRetailerTotal(field, originRate, originDisc, usage)}
                    </td>

                    <td className="border p-2">{formatRate(nectrRate)}</td>
                    <td className="border p-2 bg-gray-50">{nectrDisc}%</td>
                    <td className="border p-2 bg-gray-50">
                      {calcRetailerTotal(field, nectrRate, nectrDisc, usage)}
                    </td>

                    <td className="border p-2">{formatRate(momentumRate)}</td>
                    <td className="border p-2 bg-gray-50">{momentumDisc}%</td>
                    <td className="border p-2 bg-gray-50">
                      {calcRetailerTotal(field, momentumRate, momentumDisc, usage)}
                    </td>

                    <td className="border p-2">{formatRate(nbeRate)}</td>
                    <td className="border p-2 bg-gray-50">{nbeDisc}%</td>
                    <td className="border p-2 bg-gray-50">
                      {calcRetailerTotal(field, nbeRate, nbeDisc, usage)}
                    </td>
                  </tr>
                );
              })}

              {/* ✅ Safe Custom Rows */}
              {customRows.map((row) => (
                <tr key={row.field} className="text-center bg-yellow-50">
                  <td className="border p-2 text-left font-medium">{row.field}</td>
                  {["usage", "rate", "discount"].map((key) => (
                    <td key={key} className="border p-2">
                      <input
                        type="number"
                        value={row[key]}
                        onChange={(e) =>
                          handleInputChange("custom", row.field, key, e.target.value)
                        }
                        className="w-20 border rounded px-2 py-1 text-sm"
                      />
                    </td>
                  ))}
                  <td className="border p-2 font-semibold text-blue-700">
                    {calcTotal(row.usage, row.rate, row.discount, row.field)}
                  </td>

                  {["origin", "nectr", "momentum", "nbe"].map((ret) => (
                    <React.Fragment key={ret}>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={row[`${ret}Rate`]}
                          onChange={(e) =>
                            handleInputChange("custom", row.field, `${ret}Rate`, e.target.value)
                          }
                          className="w-24 border rounded px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="border p-2 bg-gray-50">
                        <input
                          type="number"
                          value={row[`${ret}Discount`]}
                          onChange={(e) =>
                            handleInputChange(
                              "custom",
                              row.field,
                              `${ret}Discount`,
                              e.target.value
                            )
                          }
                          className="w-20 border rounded px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="border p-2 bg-gray-50">
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
            </tbody>
                            </tbody>

            {/* ✅ Final Totals Row */}
            <tfoot>
              <tr className="font-bold bg-blue-100 text-center">
                <td className="border p-2 text-left">Final Total (¢)</td>

                {/* Manual totals */}
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2 text-blue-700">
                  {
                    (() => {
                      let total = 0;
                      const rows = [...fields, ...customRows.map((r) => r.field)];
                      for (const field of rows) {
                        const usage =
                          userInputs[field]?.usage ||
                          customRows.find((r) => r.field === field)?.usage;
                        const rate =
                          userInputs[field]?.rate ||
                          customRows.find((r) => r.field === field)?.rate;
                        const discount =
                          userInputs[field]?.discount ||
                          customRows.find((r) => r.field === field)?.discount;
                        const val = parseFloat(
                          calcTotal(usage, rate, discount, field)
                        );
                        if (!isNaN(val)) total += val;
                      }
                      return total.toFixed(2);
                    })()
                  }
                </td>

                {/* Origin total */}
                <td className="border p-2"></td>
                <td className="border p-2 bg-gray-50"></td>
                <td className="border p-2 bg-gray-50">
                  {
                    (() => {
                      let total = 0;
                      const rows = [...fields, ...customRows.map((r) => r.field)];
                      for (const field of rows) {
                        const usage =
                          userInputs[field]?.usage ||
                          customRows.find((r) => r.field === field)?.usage;
                        const rate =
                          parseFloat(data.Origin?.[field]) ||
                          customRows.find((r) => r.field === field)?.originRate;
                        const discount =
                          parseFloat(data.Origin?.["Discount"]) ||
                          customRows.find((r) => r.field === field)?.originDiscount;
                        const val = parseFloat(
                          calcRetailerTotal(field, rate, discount, usage)
                        );
                        if (!isNaN(val)) total += val;
                      }
                      return total.toFixed(2);
                    })()
                  }
                </td>

                {/* Nectr total */}
                <td className="border p-2"></td>
                <td className="border p-2 bg-gray-50"></td>
                <td className="border p-2 bg-gray-50">
                  {
                    (() => {
                      let total = 0;
                      const rows = [...fields, ...customRows.map((r) => r.field)];
                      for (const field of rows) {
                        const usage =
                          userInputs[field]?.usage ||
                          customRows.find((r) => r.field === field)?.usage;
                        const rate =
                          parseFloat(data.Nectr?.[field]) ||
                          customRows.find((r) => r.field === field)?.nectrRate;
                        const discount =
                          parseFloat(data.Nectr?.["Discount"]) ||
                          customRows.find((r) => r.field === field)?.nectrDiscount;
                        const val = parseFloat(
                          calcRetailerTotal(field, rate, discount, usage)
                        );
                        if (!isNaN(val)) total += val;
                      }
                      return total.toFixed(2);
                    })()
                  }
                </td>

                {/* Momentum total */}
                <td className="border p-2"></td>
                <td className="border p-2 bg-gray-50"></td>
                <td className="border p-2 bg-gray-50">
                  {
                    (() => {
                      let total = 0;
                      const rows = [...fields, ...customRows.map((r) => r.field)];
                      for (const field of rows) {
                        const usage =
                          userInputs[field]?.usage ||
                          customRows.find((r) => r.field === field)?.usage;
                        const rate =
                          parseFloat(data.Momentum?.[field]) ||
                          customRows.find((r) => r.field === field)?.momentumRate;
                        const discount =
                          parseFloat(data.Momentum?.["Discount"]) ||
                          customRows.find((r) => r.field === field)?.momentumDiscount;
                        const val = parseFloat(
                          calcRetailerTotal(field, rate, discount, usage)
                        );
                        if (!isNaN(val)) total += val;
                      }
                      return total.toFixed(2);
                    })()
                  }
                </td>

                {/* NBE total */}
                <td className="border p-2"></td>
                <td className="border p-2 bg-gray-50"></td>
                <td className="border p-2 bg-gray-50">
                  {
                    (() => {
                      let total = 0;
                      const rows = [...fields, ...customRows.map((r) => r.field)];
                      for (const field of rows) {
                        const usage =
                          userInputs[field]?.usage ||
                          customRows.find((r) => r.field === field)?.usage;
                        const rate =
                          parseFloat(data.NBE?.[field]) ||
                          customRows.find((r) => r.field === field)?.nbeRate;
                        const discount =
                          parseFloat(data.NBE?.["Discount"]) ||
                          customRows.find((r) => r.field === field)?.nbeDiscount;
                        const val = parseFloat(
                          calcRetailerTotal(field, rate, discount, usage)
                        );
                        if (!isNaN(val)) total += val;
                      }
                      return total.toFixed(2);
                    })()
                  }
                </td>
              </tr>
            </tfoot>

          </table>

          <div className="mt-4 flex justify-end">
            <button
              onClick={addCustomRow}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              ➕ Add Custom Row
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
