import { NextResponse } from 'next/server';

/**
 * API route: POST /api/log
 * Receives { name, checkboxLabel, isChecked, timestamp }
 * Appends it to logs.json in your GitHub repo using the GitHub API.
 * Keeps only entries from the past 30 days.
 */

export async function POST(request) {
  try {
    const { name, checkboxLabel, isChecked, timestamp } = await request.json();

    if (!name || !checkboxLabel || typeof isChecked === 'undefined') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const repo = process.env.GITHUB_REPO; // e.g. "username/reponame"
    const token = process.env.GITHUB_TOKEN;
    const filePath = 'logs.json';
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

    // Fetch current logs.json from GitHub
    const existingFile = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    let logs = [];
    let sha = null;

    if (existingFile.ok) {
      const data = await existingFile.json();
      sha = data.sha;
      const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
      logs = JSON.parse(decoded || '[]');
    } else if (existingFile.status !== 404) {
      // If it's not "file not found", throw an error
      throw new Error(`Failed to fetch logs.json: ${existingFile.status}`);
    }

    // Append new log
    logs.push({
      name,
      checkboxLabel,
      isChecked,
      timestamp,
    });

    // Keep only logs from the last 30 days
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    logs = logs.filter(
      (log) => new Date(log.timestamp).getTime() > oneMonthAgo
    );

    // Convert to base64 for GitHub API
    const encodedContent = Buffer.from(
      JSON.stringify(logs, null, 2)
    ).toString('base64');

    // Commit the updated file to GitHub
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: `Update logs - ${new Date().toISOString()}`,
        content: encodedContent,
        sha,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${errorText}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in /api/log:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
