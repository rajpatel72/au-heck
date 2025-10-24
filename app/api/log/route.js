import { NextResponse } from 'next/server';

export async function POST(request) {
  const { name, checkboxLabel, isChecked, timestamp } = await request.json();

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const filePath = 'logs.json';

  // 1. Get current file content (if exists)
  const existingFile = await fetch(
    `https://api.github.com/repos/${repo}/contents/${filePath}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  let sha = null;
  let logs = [];

  if (existingFile.ok) {
    const data = await existingFile.json();
    sha = data.sha;
    const content = Buffer.from(data.content, 'base64').toString();
    logs = JSON.parse(content);
  }

  // 2. Add new log entry
  logs.push({ name, checkboxLabel, isChecked, timestamp });

  // 3. Keep only last 30 days
  const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  logs = logs.filter((log) => new Date(log.timestamp).getTime() > oneMonthAgo);

  // 4. Encode updated file
  const encoded = Buffer.from(JSON.stringify(logs, null, 2)).toString('base64');

  // 5. Commit file to GitHub
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: `Update logs - ${new Date().toISOString()}`,
        content: encoded,
        sha,
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
