"use client";
import React, { useEffect, useState } from "react"; // ✅ add React import

export default function ComparePage() {
  const [tariffs, setTariffs] = useState([]);
  const [selected, setSelected] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userInputs, setUserInputs] = useState({});
  const [customRows, setCustomRows] = useState([]);
  const [availableDiscounts, setAvailableDiscounts] = useState({});

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
      // ✅ detect which retailers have a discount column
      const availableDiscounts = {};
      ["Origin", "Nectr", "Momentum", "NBE"].forEach((r) => {
      availableDiscounts[r] = result?.[r]?.hasOwnProperty("Discount");
      });
      setAvailableDiscounts(availableDiscounts);
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

  // Sum totals for a column (manual + retailers) — corrected
const totalForRetailer = (retailerKey) => {
  let total = 0;

  // Sum default rows (fields from network data)
  fields.forEach((f) => {
    const usage = userInputs[f]?.usage;
    const manualRate = userInputs[f]?.rate;
    const manualDisc = userInputs[f]?.discount;

    if (retailerKey === "manual") {
      // calcTotal returns "-" or a string number; guard and add numeric values only
      const valStr = calcTotal(usage, manualRate, manualDisc, f);
      const val = parseFloat(valStr);
      if (!isNaN(val)) total += val;
    } else {
      // For retailers use calcRetailerTotal which expects retailer rate in cents (like data[Origin][f])
      const rateFromData = parseFloat(data?.[retailerKey]?.[f]) || 0;
      const discFromData = parseFloat(data?.[retailerKey]?.Discount) || 0;
      const valStr = calcRetailerTotal(f, rateFromData, discFromData, usage);
      const val = parseFloat(valStr);
      if (!isNaN(val)) total += val;
    }
  });

  // Sum custom rows
  customRows.forEach((row) => {
    const u = row.usage;

    if (retailerKey === "manual") {
      // manual custom row uses row.rate / row.discount with calcTotal
      const valStr = calcTotal(u, row.rate, row.discount, row.field);
      const v = parseFloat(valStr);
      if (!isNaN(v)) total += v;
    } else {
      // Map retailer key (Origin, Nectr, Momentum, NBE) to your custom row fields (lowercase prefix)
      const prefix = retailerKey.toLowerCase(); // "origin", "nectr", "momentum", "nbe"
      const rate = row[`${prefix}Rate`]; // e.g. row.originRate
      const disc = row[`${prefix}Discount`];

      // Use calcRetailerTotal for custom-row retailer totals (rate should be cents like data)
      const valStr = calcRetailerTotal(row.field, rate, disc, u);
      const v = parseFloat(valStr);
      if (!isNaN(v)) total += v;
    }
  });

  return total.toFixed(2);
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
                <th className="p-2 border">Description</th>
                <th className="p-2 border bg-blue-50">Usage</th>
                <th className="p-2 border bg-blue-50">Current Offer Rate (¢)</th>
                <th className="p-2 border bg-blue-50">Discount (%)</th>
                <th className="p-2 border bg-blue-50">Current Offer Total</th>
            
                {["Origin", "Nectr", "Momentum", "NBE"].map((ret) => (
                  <React.Fragment key={ret}>
                    <th className="p-2 border">{ret} (¢)</th>
                    {availableDiscounts[ret] && (
                      <th className="p-2 border bg-gray-50">Discount (%)</th>
                    )}
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

                    {["Origin", "Nectr", "Momentum", "NBE"].map((ret) => {
                    const rate = parseFloat(data?.[ret]?.[field]) || 0;
                    const disc = parseFloat(data?.[ret]?.["Discount"]) || 0;
                    return (
                      <React.Fragment key={ret}>
                        <td className="border p-2">{formatRate(rate)}</td>
                        {availableDiscounts[ret] && (
                          <td className="border p-2 bg-gray-50">{disc}%</td>
                        )}
                        <td className="border p-2 bg-gray-50">
                          {calcRetailerTotal(field, rate, disc, usage)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                   
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
                <tr className="font-bold bg-blue-100 text-center">
  <td className="border p-2 text-left">TOTAL</td>

  {/* Manual usage/rate/discount cells left blank */}
  <td className="border p-2"></td>
  <td className="border p-2"></td>
  <td className="border p-2"></td>

  {/* ✅ Manual Total */}
  <td className="border p-2 text-blue-700">{totalForRetailer("manual")}</td>

  {/* ✅ Retailer Totals */}
  <td className="border p-2"></td><td className="border p-2"></td>
  <td className="border p-2 bg-gray-50">{totalForRetailer("Origin")}</td>

  <td className="border p-2"></td><td className="border p-2"></td>
  <td className="border p-2 bg-gray-50">{totalForRetailer("Nectr")}</td>

  <td className="border p-2"></td><td className="border p-2"></td>
  <td className="border p-2 bg-gray-50">{totalForRetailer("Momentum")}</td>

  <td className="border p-2"></td><td className="border p-2"></td>
  <td className="border p-2 bg-gray-50">{totalForRetailer("NBE")}</td>
</tr>

            </tbody>
          </table>

         
        </div>
      )}
    </main>
  );
}
