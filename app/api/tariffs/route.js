import fs from "fs";
import path from "path";
import Papa from "papaparse";

export async function GET() {
  const folderPath = path.join(process.cwd(), "public", "data");
  const files = ["origin.csv", "nectr.csv", "momentum.csv", "nbe.csv"];
  const tariffs = new Set();

  for (const file of files) {
    const csv = fs.readFileSync(path.join(folderPath, file), "utf8");
    const parsed = Papa.parse(csv, { header: true }).data;
    parsed.forEach((row) => {
      if (row["Network Tariff"]) tariffs.add(row["Network Tariff"].trim());
    });
  }

  return Response.json([...tariffs]);
}
