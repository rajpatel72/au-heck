'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function LogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase.from('logs').select('*').order('timestamp', { ascending: false });
      if (error) {
        console.error('Error fetching logs:', error);
      } else {
        setLogs(data);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Logs</h2>
      {logs.length === 0 ? <p>No logs yet</p> :
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Name</th>
              <th>Checkbox</th>
              <th>Checked</th>
              <th>Time</th>
              <th>Meta</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.name}</td>
                <td>{log.checkbox_label}</td>
                <td>{log.is_checked ? '✔' : '✖'}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{JSON.stringify(log.meta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    </div>
  );
}
