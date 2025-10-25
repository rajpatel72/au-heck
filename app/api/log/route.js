import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // should be "rajpatel72/au-heck"
const FILE_PATH = 'logs.json';

// Helper: GitHub API base
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;

// Read logs.json from GitHub
async function getLogs() {
  const res = await fetch(GITHUB_API, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
    cache: 'no-store',
  });

  if (res.status === 404) {
    return { data: [], sha: null }; // file doesn’t exist yet
  }

  if (!res.ok) {
    throw new Error(`GitHub fetch failed: ${res.statusText}`);
  }

  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString();
  const data = JSON.parse(content || '[]');
  return { data, sha: json.sha };
}

// Write updated logs.json to GitHub
async function saveLogs(data, sha) {
  const filtered = data.filter((log) => {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(now.getDate() - 30);
    return new Date(log.timestamp) >= oneMonthAgo;
  });

  const content = Buffer.from(JSON.stringify(filtered, null, 2)).toString('base64');

  const res = await fetch(GITHUB_API, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      message: 'Update logs.json',
      content,
      sha: sha || undefined,
      committer: {
        name: 'Vercel Bot',
        email: 'vercel@app.com',
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error: ${text}`);
  }

  return res.json();
}

// POST → Add new log entry
export async function POST(req) {
  try {
    const { name, checkboxLabel, isChecked } = await req.json();
    if (!name || !checkboxLabel)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { data, sha } = await getLogs();
    const newLog = {
      name,
      checkboxLabel,
      isChecked,
      timestamp: new Date().toISOString(),
    };
    data.push(newLog);

    await saveLogs(data, sha);
    return NextResponse.json({ success: true, newLog });
  } catch (err) {
    console.error('POST /api/log error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET → Return current logs
export async function GET() {
  try {
    const { data } = await getLogs();
    return NextResponse.json(data);
  } catch (err) {
    console.error('GET /api/log error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
