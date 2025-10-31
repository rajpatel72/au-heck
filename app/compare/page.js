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
    "Daily supply charge","Peak","Peak 2","Shoulder","Off Peak","CL1","CL2","CL3",
    "Capacity Charges","Demand 1","Demand 2","Solar"
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

  const retailers = ["Origin", "Nectr", "Momentum", "NBE", "1St Energy"];
  const hasDiscountFor = {};
  if (data) {
    retailers.forEach((r) => {
      hasDiscountFor[r] =
        typeof data?.[r]?.Discount !== "undefined" && data?.[r]?.Discount !== null;
    });
  }

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

  return (
    <main className="min-h-screen p-8 bg-black text-white font-mono">
      <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-purple-400 text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]">
        ⚡ Electricity Comparison Matrix
      </h1>

      <div className="flex flex-col items-center gap-4 mb-8">
        <select
          className="border border-cyan-500 bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg w-72 text-cyan-300 focus:ring-2 focus:ring-cyan-400 transition"
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
          className="px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wide transition shadow-[0_0_15px_rgba(0,255,255,0.6)]"
        >
          {loading ? "Loading..." : "Compare"}
        </button>
      </div>

      {data && (
        <div className="overflow-x-auto rounded-xl bg-gray-900/70 backdrop-blur-xl border border-cyan-400 shadow-[0_0_25px_rgba(0,255,255,0.4)] p-3">
          <table className="min-w-full text-sm text-center border-collapse">
            <thead className="bg-gray-800 text-cyan-300 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-3 border border-gray-700">Field</th>
                <th className="p-3 border border-gray-700">Usage</th>
                <th className="p-3 border border-gray-700">Rate (¢)</th>
                <th className="p-3 border border-gray-700">Disc %</th>
                <th className="p-3 border border-gray-700 text-purple-300">Manual Total</th>
                {retailers.map((ret) => (
                  <React.Fragment key={ret}>
                    <th className="p-3 border border-gray-700">{ret} ¢</th>
                    {hasDiscountFor[ret] && <th className="p-3 border border-gray-700">Disc</th>}
                    <th className="p-3 border border-gray-700 text-purple-300">{ret} Total</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {fields.map((field) => {
                const origin = parseFloat(data.Origin?.[field]) || 0;
                const nectr = parseFloat(data.Nectr?.[field]) || 0;
                const mom = parseFloat(data.Momentum?.[field]) || 0;
                const nbe = parseFloat(data.NBE?.[field]) || 0;

                if (origin + nectr + mom + nbe === 0) return null;

                const usage = userInputs[field]?.usage || "";
                const rate = userInputs[field]?.rate || "";
                const disc = userInputs[field]?.discount || "";

                const oD = parseFloat(data.Origin?.Discount) || 0;
                const nD = parseFloat(data.Nectr?.Discount) || 0;
                const mD = parseFloat(data.Momentum?.Discount) || 0;
                const nbD = parseFloat(data.NBE?.Discount) || 0;

                return (
                  <tr key={field} className="hover:bg-gray-800/60">
                    <td className="p-2 border border-gray-800 text-left">{field}</td>
                    <td className="p-2 border border-gray-800">
                      <input
                        type="number"
                        value={usage}
                        onChange={(e) => handleInputChange("default", field, "usage", e.target.value)}
                        className="w-20 bg-black border border-cyan-500 text-cyan-300 rounded px-2 py-1 text-xs"
                      />
                    </td>

                    <td className="p-2 border border-gray-800">
                      <input
                        type="number"
                        value={rate}
                        onChange={(e) => handleInputChange("default", field, "rate", e.target.value)}
                        className="w-24 bg-black border border-cyan-500 text-cyan-300 rounded px-2 py-1 text-xs"
                      />
                    </td>

                    <td className="p-2 border border-gray-800">
                      <input
                        type="number"
                        value={disc}
                        onChange={(e) => handleInputChange("default", field, "discount", e.target.value)}
                        className="w-16 bg-black border border-cyan-500 text-cyan-300 rounded px-2 py-1 text-xs"
                        disabled={noDiscountFields.includes(field)}
                      />
                    </td>

                    <td className="p-2 border border-gray-800 text-purple-300 font-bold">
                      {calcTotal(usage, rate, disc, field)}
                    </td>

                    {[["Origin",origin,oD],["Nectr",nectr,nD],["Momentum",mom,mD],["NBE",nbe,nbD]].map(([ret,r,d])=>(
                      <React.Fragment key={ret}>
                        <td className="p-2 border border-gray-800">{formatRate(r)}</td>
                        {hasDiscountFor[ret] && <td className="p-2 border border-gray-800">{d}%</td>}
                        <td className="p-2 border border-gray-800 text-purple-300 font-semibold">
                          {calcRetailerTotal(field, r, d, usage)}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                );
              })}

              {customRows.map((row) => (
                <tr key={row.field} className="bg-gray-800/70">
                  <td className="p-2 border border-gray-800 text-left">{row.field}</td>
                  {["usage","rate","discount"].map((key)=>(
                    <td key={key} className="p-2 border border-gray-800">
                      <input
                        type="number"
                        value={row[key]}
                        onChange={(e)=>handleInputChange("custom",row.field,key,e.target.value)}
                        className="w-20 bg-black border border-cyan-500 text-cyan-300 rounded px-2 py-1 text-xs"
                      />
                    </td>
                  ))}
                  <td className="p-2 border border-gray-800 text-purple-300 font-bold">
                    {calcTotal(row.usage,row.rate,row.discount,row.field)}
                  </td>

                  {retailers.map((ret)=>{
                    const prefix = ret.toLowerCase();
                    return (
                      <React.Fragment key={ret}>
                        <td className="p-2 border border-gray-800">
                          <input
                            type="number"
                            value={row[`${prefix}Rate`]}
                            onChange={(e)=>handleInputChange("custom",row.field,`${prefix}Rate`,e.target.value)}
                            className="w-24 bg-black border border-cyan-500 text-cyan-300 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        {hasDiscountFor[ret] && (
                          <td className="p-2 border border-gray-800">
                            <input
                              type="number"
                              value={row[`${prefix}Discount`]}
                              onChange={(e)=>handleInputChange("custom",row.field,`${prefix}Discount`,e.target.value)}
                              className="w-16 bg-black border border-cyan-500 text-cyan-300 rounded px-2 py-1 text-xs"
                            />
                          </td>
                        )}
                        <td className="p-2 border border-gray-800 text-purple-300 font-bold">
                          {calcRetailerTotal(row.field,row[`${prefix}Rate`],hasDiscountFor[ret]?row[`${prefix}Discount`]:0,row.usage)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}

              <tr className="bg-black text-cyan-400 font-bold">
                <td className="p-2 border border-gray-800 text-left">TOTAL</td>
                <td colSpan="3"></td>
                <td className="p-2 border border-gray-800 text-purple-300">{totalForRetailer("manual")}</td>
                {retailers.map((ret)=>(
                  <React.Fragment key={ret}>
                    <td className="p-2 border border-gray-800"></td>
                    {hasDiscountFor[ret] && <td className="p-2 border border-gray-800"></td>}
                    <td className="p-2 border border-gray-800 text-purple-300">{totalForRetailer(ret)}</td>
                  </React.Fragment>
                ))}
              </tr>
            </tbody>
          </table>

          <button
            onClick={addCustomRow}
            className="mt-4 w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-[0_0_15px_rgba(155,0,255,0.8)]"
          >
            ➕ Add Custom Row
          </button>
        </div>
      )}
    </main>
  );
}
