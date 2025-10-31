import fs from "fs";
import path from "path";
import Papa from "papaparse";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const tariff = searchParams.get("tariff");

  const files = [
    { name: "Origin", file: "origin.csv" },
    { name: "Nectr", file: "nectr.csv" },
    { name: "Momentum", file: "momentum.csv" },
    { name: "NBE", file: "nbe.csv" },
  ];

  const results = {};

  for (const { name, file } of files) {
    const filePath = path.join(process.cwd(), "public", "data", file);
    const csv = fs.readFileSync(filePath, "utf8");
    const parsed = Papa.parse(csv, { header: true }).data;

    const match = parsed.find(
      (row) =>
        row["Network Tariff"]?.trim().toLowerCase() ===
        tariff?.trim().toLowerCase()
    );

    results[name] = match || null;
  }

  return Response.json(results);
}
