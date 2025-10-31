"use client";
import React, { useEffect, useState } from "react";

/**
 * Electricity Tariff Comparison Tool
 * Features:
 * - Select network tariff
 * - Enter usage + custom rates
 * - Retailer auto-comparison
 */

export default function ComparePage() {
  const [tariffs, setTariffs] = useState([]);
  const [selectedTariff, setSelectedTariff] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [userInputs, setUserInputs] = useState({});
  const [customRows, setCustomRows] = useState([]);

  /** Load tariff list on page load */
  useEffect(() => {
    fetch("/api/tariffs")
      .then((res) => res.json())
      .then((list) => setTariffs(list.sort()))
      .catch((err) => console.error("Tariff load error:", err));
  }, []);

  /** Run comparison */
  const handleCompare = async () => {
    if (!selectedTariff) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/compare?tariff=${encodeURIComponent(selectedTariff)}`);
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

  /** Default charges rows */
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

  /** No discount applies here */
  const noDiscountFields = ["Capacity Charges", "Demand 1", "Demand 2", "Solar"];

  /** Retailer list */
  const retailers = ["Origin", "Nectr", "Momentum", "NBE", "1St Energy"];

  /** Render discount column? (based on API) */
  const hasDiscountFor = {};
  if (data) {
    retailers.forEach((r) => {
      hasDiscountFor[r] = data?.[r]?.Discount !== undefined && data?.[r]?.Discount !== null;
    });
  }

  /** Handle input updates */
  const handleInputChange = (type, field, key, value) => {
    if (type === "custom") {
      setCustomRows((prev) =>
        prev.map((r) => (r.field === field ? { ...r, [key]: value } : r))
      );
      return;
    }

    setUserInputs((prev) => ({
      ...prev,
      [field]: { ...prev[field], [key]: value },
    }));
  };

  /** Add custom line row */
  const addCustomRow = () => {
    setCustomRows((prev) => [
      ...prev,
      {
        field: `Custom ${prev.length + 1}`,
        usage: "",
        rate: "",
        discount: "",
        ...Object.fromEntries(
          retailers.flatMap((r) => [
            [`${r.toLowerCase()}Rate`, ""],
            [`${r.toLowerCase()}Discount`, ""],
          ])
        ),
      },
    ]);
  };

  /** Manual total */
  const calcTotal = (usage, rate, discount, field) => {
    const u = +usage || 0;
    const r = +rate || 0;
    const d = +discount || 0;
    if (!u || !r) return "-";
    const factor = noDiscountFields.includes(field) ? 1 : 1 - d / 100;
    return (u * r * factor).toFixed(2);
  };

  /** Retailer total */
  const calcRetailerTotal = (field, rate, discount, usage) => {
    const u = +usage || 0;
    const r = (+rate || 0) / 100;
    const d = +discount || 0;
    if (!u || !r) return "-";
    const factor = noDiscountFields.includes(field) ? 1 : 1 - d / 100;
    return (u * r * factor).toFixed(2);
  };

  /** Sum totals */
  const totalForRetailer = (key) => {
    let total = 0;

    fields.forEach((f) => {
      const usage = userInputs[f]?.usage;
      if (key === "manual") {
        const v = parseFloat(calcTotal(usage, userInputs[f]?.rate, userInputs[f]?.discount, f));
        if (!isNaN(v)) total += v;
      } else {
        const r = +data?.[key]?.[f] || 0;
        const d = hasDiscountFor[key] ? +data?.[key]?.Discount || 0 : 0;
        const v = parseFloat(calcRetailerTotal(f, r, d, usage));
        if (!isNaN(v)) total += v;
      }
    });

    customRows.forEach((row) => {
      const u = row.usage;
      if (key === "manual") {
        const v = parseFloat(calcTotal(u, row.rate, row.discount, row.field));
        if (!isNaN(v)) total += v;
      } else {
        const prefix = key.toLowerCase();
        const r = row[`${prefix}Rate`];
        const d = hasDiscountFor[key] ? row[`${prefix}Discount`] : 0;
        const v = parseFloat(calcRetailerTotal(row.field, r, d, u));
        if (!isNaN(v)) total += v;
      }
    });

    return total.toFixed(2);
  };

  return (
    <main className="min-h-screen p-6 md:p-10 bg-gray-100">
      <h1 className="text-3xl font-bold text-center mb-8">
        ⚡ Electricity Tariff Comparison
      </h1>

      {/* Selection box */}
      <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-6">
        <select
          className="border p-2 rounded w-72"
          value={selectedTariff}
          onChange={(e) => setSelectedTariff(e.target.value)}
        >
          <option value="">Select Network Tariff</option>
          {tariffs.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <button
          onClick={handleCompare}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 shadow"
        >
          {loading ? "Loading…" : "Compare Rates"}
        </button>
      </div>

      {/* Table */}
      {data && (
        <div className="overflow-auto border rounded bg-white shadow-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-2 border text-left">Field</th>
                <th className="p-2 border bg-blue-50">Usage</th>
                <th className="p-2 border bg-blue-50">Manual Rate (¢)</th>
                <th className="p-2 border bg-blue-50">Discount</th>
                <th className="p-2 border bg-blue-50">Manual Total</th>

                {retailers.map((r) => (
                  <React.Fragment key={r}>
                    <th className="p-2 border">{r} (¢)</th>
                    {hasDiscountFor[r] && <th className="p-2 border">{r} Disc</th>}
                    <th className="p-2 border">{r} Total</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {fields.map((field, idx) => {
                const usage = userInputs[field]?.usage || "";
                const rate = userInputs[field]?.rate || "";
                const disc = userInputs[field]?.discount || "";

                const retailerRate = (name) => parseFloat(data?.[name]?.[field]) || 0;
                const retailerDisc = (name) =>
                  hasDiscountFor[name] ? +data?.[name]?.Discount || 0 : 0;

                return (
                  <tr key={field} className={idx % 2 ? "bg-gray-50" : ""}>
                    <td className="border p-2 font-medium">{field}</td>

                    <td className="border p-1 text-center">
                      <input
                        type="number"
                        value={usage}
                        onChange={(e) =>
                          handleInputChange("default", field, "usage", e.target.value)
                        }
                        className="w-20 border rounded p-1"
                      />
                    </td>

                    <td className="border p-1 text-center">
                      <input
                        type="number"
                        value={rate}
                        onChange={(e) =>
                          handleInputChange("default", field, "rate", e.target.value)
                        }
                        className="w-20 border rounded p-1"
                      />
                    </td>

                    <td className="border p-1 text-center">
                      <input
                        type="number"
                        disabled={noDiscountFields.includes(field)}
                        value={disc}
                        onChange={(e) =>
                          handleInputChange("default", field, "discount", e.target.value)
                        }
                        className="w-16 border rounded p-1 disabled:bg-gray-200"
                      />
                    </td>

                    <td className="border p-2 text-blue-700 font-semibold">
                      {calcTotal(usage, rate, disc, field)}
                    </td>

                    {retailers.map((r) => (
                      <React.Fragment key={r}>
                        <td className="border p-2 text-center">
                          {(retailerRate(r) / 100).toFixed(4)}
                        </td>
                        {hasDiscountFor[r] && (
                          <td className="border p-2 text-center">
                            {retailerDisc(r)}%
                          </td>
                        )}
                        <td className="border p-2 text-center">
                          {calcRetailerTotal(field, retailerRate(r), retailerDisc(r), usage)}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                );
              })}

              {/* Custom Input Rows */}
              {customRows.map((row, idx) => (
                <tr key={row.field} className="bg-yellow-50">
                  <td className="border p-2 font-medium">{row.field}</td>

                  {["usage", "rate", "discount"].map((k) => (
                    <td key={k} className="border p-1 text-center">
                      <input
                        type="number"
                        value={row[k]}
                        onChange={(e) => handleInputChange("custom", row.field, k, e.target.value)}
                        className="w-20 border rounded p-1"
                      />
                    </td>
                  ))}

                  <td className="border p-2 font-bold text-blue-700">
                    {calcTotal(row.usage, row.rate, row.discount, row.field)}
                  </td>

                  {retailers.map((r) => {
                    const key = r.toLowerCase();
                    return (
                      <React.Fragment key={r}>
                        <td className="border p-1 text-center">
                          <input
                            type="number"
                            value={row[`${key}Rate`]}
                            onChange={(e) =>
                              handleInputChange("custom", row.field, `${key}Rate`, e.target.value)
                            }
                            className="w-20 border rounded p-1"
                          />
                        </td>

                        {hasDiscountFor[r] && (
                          <td className="border p-1 text-center">
                            <input
                              type="number"
                              value={row[`${key}Discount`]}
                              onChange={(e) =>
                                handleInputChange("custom", row.field, `${key}Discount`, e.target.value)
                              }
                              className="w-16 border rounded p-1"
                            />
                          </td>
                        )}

                        <td className="border p-2 text-center">
                          {calcRetailerTotal(
                            row.field,
                            row[`${key}Rate`],
                            hasDiscountFor[r] ? row[`${key}Discount`] : 0,
                            row.usage
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}

              {/* Total Row */}
              <tr className="bg-blue-200 font-bold">
                <td className="border p-2">TOTAL</td>
                <td className="border"></td>
                <td className="border"></td>
                <td className="border"></td>

                <td className="border p-2 text-blue-700">{totalForRetailer("manual")}</td>

                {retailers.map((r) => (
                  <React.Fragment key={r}>
                    <td className="border"></td>
                    {hasDiscountFor[r] && <td className="border"></td>}
                    <td className="border p-2">{totalForRetailer(r)}</td>
                  </React.Fragment>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Add custom row button */}
      {data && (
        <div className="text-center mt-4">
          <button
            onClick={addCustomRow}
            className="bg-green-600 text-white px-5 py-2 rounded shadow hover:bg-green-700"
          >
            + Add Custom Charge Row
          </button>
        </div>
      )}
    </main>
  );
}
