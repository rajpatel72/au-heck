'use client';
import { useEffect, useState } from 'react';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(
          'https://raw.githubusercontent.com/rajpatel72/au-heck/main/logs.json',
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('No logs found yet.');
        const data = await res.json();

        // Filter last 30 days
        const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const filtered = data.filter(
          (log) => new Date(log.timestamp).getTime() > oneMonthAgo
        );
        setLogs(filtered.reverse());
      } catch (err) {
        setError(err.message);
      }
    };

    fetchLogs();
  }, []);

  return (
    <main style={{ padding: 40, background: '#f4f4f4', minHeight: '100vh' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Log History</h2>

      {error && <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>}

      {logs.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No logs yet.</p>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <thead style={{ background: '#007bff', color: 'white' }}>
            <tr>
              <th style={cell}>Customer</th>
              <th style={cell}>Action</th>
              <th style={cell}>Checked</th>
              <th style={cell}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i}>
                <td style={cell}>{log.name}</td>
                <td style={cell}>{log.checkboxLabel}</td>
                <td style={cell}>{log.isChecked ? '✅' : '❌'}</td>
                <td style={cell}>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

const cell = {
  border: '1px solid #ddd',
  padding: '10px',
  textAlign: 'center',
};
