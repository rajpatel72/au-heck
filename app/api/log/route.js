// app/api/log/route.js
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const body = await req.json();

    // Path to logs.json in project root
    const logFilePath = path.join(process.cwd(), 'logs.json');

    // Read existing logs
    let logs = [];
    try {
      const data = fs.readFileSync(logFilePath, 'utf8');
      logs = JSON.parse(data);
    } catch (err) {
      // File might not exist yet
      logs = [];
    }

    // Append new log
    logs.push(body);

    // Save back
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Error saving log:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
