'use client';
import { useEffect, useState } from 'react';

export default function LogPage() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Fetch logs.json from your GitHub repo (publicly accessible)
        const res = await fetch(
          'https://raw.githubusercontent.com/rajpatel72/au-heck/main/logs.json',
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('No logs found yet.');

        const data = await res.json();

        // Keep only logs from last 30 days
        const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const filtered = data.filter(
          (log) => new Date(log.timestamp).getTime() > oneMonthAgo
        );

        // Sort newest first
        setLogs(filtered.reverse());
      } catch (err) {
        setError(err.message);
      }
    };

    fetchLogs();
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f7fa',
        padding: '40px 20px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '30px',
        }}
      >
        Log History (Last 30 Days)
      </h1>

      {error && (
        <p
          style={{
            textAlign: 'center',
            color: 'red',
            fontSize: '16px',
          }}
        >
          {error}
        </p>
      )}

      {logs.length === 0 && !error && (
        <p style={{ textAlign: 'center', color: '#555' }}>No logs available.</p>
      )}

      {logs.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            <thead style={{ background: '#007bff', color: 'white' }}>
              <tr>
                <th style={cellStyle}>Customer Name</th>
                <th style={cellStyle}>Checkbox</th>
                <th style={cellStyle}>Checked</th>
                <th style={cellStyle}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} style={i % 2 ? rowAlt : rowNormal}>
                  <td style={cellStyle}>{log.name}</td>
                  <td style={cellStyle}>{log.checkboxLabel}</td>
                  <td style={cellStyle}>{log.isChecked ? '✅' : '❌'}</td>
                  <td style={cellStyle}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const cellStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #eee',
  textAlign: 'center',
  fontSize: '15px',
};

const rowAlt = { background: '#f9f9f9' };
const rowNormal = { background: '#fff' };
