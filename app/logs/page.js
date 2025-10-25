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
      if (error) console.error(error);
      else setLogs(data);
    };
    fetchLogs();
  }, []);

  return (
    <main style={{ padding:24,fontFamily:'Inter,Roboto' }}>
      <h1>Action Logs</h1>
      {logs.length===0 && <p>No logs yet.</p>}
      <ul>
        {logs.map((log)=>(
          <li key={log.id} style={{ marginBottom:8 }}>
            <strong>{log.timestamp}:</strong> {log.name} → {log.checkbox_label} — {log.is_checked ? 'Checked':'Unchecked'} {log.meta?.siteIndex && `(Site ${log.meta.siteIndex})`}
          </li>
        ))}
      </ul>
    </main>
  );
}
