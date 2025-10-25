'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [filterChecked, setFilterChecked] = useState('all'); // 'all', 'checked', 'unchecked'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, searchName, filterChecked]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error(error);
      setLogs([]);
    } else {
      setLogs(data);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let temp = [...logs];
    if (searchName.trim() !== '') {
      temp = temp.filter(log => log.name.toLowerCase().includes(searchName.toLowerCase()));
    }
    if (filterChecked === 'checked') {
      temp = temp.filter(log => log.is_checked);
    } else if (filterChecked === 'unchecked') {
      temp = temp.filter(log => !log.is_checked);
    }
    setFilteredLogs(temp);
  };

  // Group logs by name
  const groupedLogs = filteredLogs.reduce((acc, log) => {
    if (!acc[log.name]) acc[log.name] = [];
    acc[log.name].push(log);
    return acc;
  }, {});

  return (
    <main style={styles.main}>
      <h1 style={styles.header}>Client Logs</h1>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search by client name..."
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          style={styles.searchInput}
        />

        <select value={filterChecked} onChange={e => setFilterChecked(e.target.value)} style={styles.select}>
          <option value="all">All</option>
          <option value="checked">Checked</option>
          <option value="unchecked">Unchecked</option>
        </select>
      </div>

      {loading ? (
        <p>Loading logs...</p>
      ) : Object.keys(groupedLogs).length === 0 ? (
        <p>No logs found.</p>
      ) : (
        Object.keys(groupedLogs).map(name => (
          <div key={name} style={styles.clientCard}>
            <h2 style={styles.clientName}>{name}</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Checkbox</th>
                  <th style={styles.th}>Checked</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Meta</th>
                </tr>
              </thead>
              <tbody>
                {groupedLogs[name].map(log => (
                  <tr key={log.id}>
                    <td style={styles.td}>{log.checkbox_label}</td>
                    <td style={styles.td}>{log.is_checked ? '✔' : '✖'}</td>
                    <td style={styles.td}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={styles.td}>{log.meta ? JSON.stringify(log.meta) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </main>
  );
}

// --- Styles ---
const styles = {
  main: {
    padding: 24,
    fontFamily: 'Inter, Roboto, system-ui',
    background: '#f3f4f6',
    minHeight: '100vh',
  },
  header: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 20,
    color: '#111827',
  },
  filters: {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
  },
  select: {
    padding: 10,
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
  },
  clientCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
  },
  clientName: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 12,
    color: '#1f2937',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '10px',
    borderBottom: '2px solid #e5e7eb',
    color: '#374151',
    fontWeight: 600,
  },
  td: {
    padding: '8px 10px',
    borderBottom: '1px solid #e5e7eb',
    color: '#4b5563',
    fontSize: 14,
  },
};
