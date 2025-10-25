'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [checkedItems, setCheckedItems] = useState({});
  const [siteType, setSiteType] = useState(''); // 'Single' | 'Multi'
  const [accountType, setAccountType] = useState(''); // 'Personal' | 'Business'
  const [siteCount, setSiteCount] = useState(1); // for multisite: number of approved sites

  useEffect(() => {
    const savedName = localStorage.getItem('lastName');
    if (savedName) setName(savedName);
  }, []);

  // Checklists definitions
  const singlePersonal = [
    'Contact person name',
    'Mobile & Phone',
    'Email address',
    'DOB',
    'Mailing address',
    'Supply Address',
    'NMI',
    'ID Details',
    'Screenshot (if applicable)',
  ];

  const singleBusiness = [
    'Company name',
    'ABN/ACN',
    'Contact person name',
    'Mobile & Phone',
    'Email address',
    'DOB',
    'Mailing address',
    'Supply Address',
    'NMI',
    'Rates screenshot (if applicable)',
  ];

  const multiPersonal = [
    'Contact person name',
    'Mobile & Phone',
    'Email address',
    'DOB',
    'Mailing address',
    'Supply Address for each approved site',
    'NMI for each approved site',
    'ID Details',
    'One screenshot for each tariff type (if applicable)',
  ];

  const multiBusiness = [
    'Company name',
    'ABN/ACN',
    'Contact person name',
    'Mobile & Phone number',
    'Email address',
    'DOB',
    'Mailing address',
    'Supply Address for each approved site',
    'NMI for each approved site',
    'One screenshot for each tariff type (if applicable)',
  ];

  const getChecklist = () => {
    if (siteType === 'Single' && accountType === 'Personal') return singlePersonal;
    if (siteType === 'Single' && accountType === 'Business') return singleBusiness;
    if (siteType === 'Multi' && accountType === 'Personal') return multiPersonal;
    if (siteType === 'Multi' && accountType === 'Business') return multiBusiness;
    return [];
  };

  // Logging function - calls your /api/log endpoint
  const logAction = async (checkboxLabel, isChecked, meta = {}) => {
    if (!name) {
      alert('Please enter a customer name before checking.');
      return;
    }

    const timestamp = new Date().toISOString();
    localStorage.setItem('lastName', name);

    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          checkboxLabel,
          isChecked,
          timestamp,
          meta, // optional metadata (site index, tariff type, etc.)
        }),
      });
      if (!res.ok) {
        console.error('Failed to save log:', await res.text());
      }
    } catch (err) {
      console.error('Error logging action:', err);
    }
  };

  // Handle check/uncheck for simple checklist item
  const handleCheck = (label) => {
    const isChecked = !checkedItems[label];
    setCheckedItems((prev) => ({ ...prev, [label]: isChecked }));
    logAction(label, isChecked);
  };

  // For multisite repeated fields: create keys like "Supply Address - Site 1"
  const handleSiteCheck = (baseLabel, siteIndex) => {
    const key = `${baseLabel} - Site ${siteIndex}`;
    const isChecked = !checkedItems[key];
    setCheckedItems((prev) => ({ ...prev, [key]: isChecked }));
    logAction(baseLabel, isChecked, { siteIndex });
  };

  // Render repeated items for multisite
  const renderMultiSiteFields = (baseLabel) => {
    const arr = [];
    for (let i = 1; i <= siteCount; i += 1) {
      const key = `${baseLabel} - Site ${i}`;
      arr.push(
        <label key={key} style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={!!checkedItems[key]}
            onChange={() => handleSiteCheck(baseLabel, i)}
            style={{ marginRight: 10 }}
          />
          {baseLabel} — Site {i}
        </label>
      );
    }
    return arr;
  };

  const checklist = getChecklist();

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h2 style={styles.title}>Signup Documents</h2>

        {/* Customer Name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter customer name"
          style={styles.input}
        />

        {/* Site Type Selection */}
        <div style={styles.optionGroup}>
          <h4 style={styles.optionTitle}>Select Site Type</h4>
          <div style={styles.buttonRow}>
            <button
              type="button"
              onClick={() => {
                setSiteType('Single');
                setAccountType('');
                setCheckedItems({});
                setSiteCount(1);
              }}
              style={siteType === 'Single' ? styles.activeButton : styles.inactiveButton}
            >
              Single Site
            </button>

            <button
              type="button"
              onClick={() => {
                setSiteType('Multi');
                setAccountType('');
                setCheckedItems({});
                setSiteCount(2); // default 2 approved sites (adjustable below)
              }}
              style={siteType === 'Multi' ? styles.activeButton : styles.inactiveButton}
            >
              Multi Site
            </button>
          </div>
        </div>

        {/* Account Type Selection */}
        {siteType && (
          <div style={styles.optionGroup}>
            <h4 style={styles.optionTitle}>Account Setup</h4>
            <div style={styles.buttonRow}>
              <button
                type="button"
                onClick={() => {
                  setAccountType('Personal');
                  setCheckedItems({});
                }}
                style={accountType === 'Personal' ? styles.activeButtonSecondary : styles.inactiveButtonSecondary}
              >
                Personal Account
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountType('Business');
                  setCheckedItems({});
                }}
                style={accountType === 'Business' ? styles.activeButtonSecondary : styles.inactiveButtonSecondary}
              >
                Business Account
              </button>
            </div>
          </div>
        )}

        {/* For Multi-site: choose number of approved sites */}
        {siteType === 'Multi' && accountType && (
          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#333' }}>
              Number of approved sites:
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={siteCount}
              onChange={(e) => {
                const v = Number(e.target.value) || 1;
                setSiteCount(v);
                // optionally clear site-specific checks
                // setCheckedItems({});
              }}
              style={{ width: 120, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            />
            <p style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
              (Set how many approved sites to show repeated fields for.)
            </p>
          </div>
        )}

        {/* Checklist */}
        {accountType && checklist.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h4 style={{ marginBottom: 12 }}>Checklist</h4>

            {/* Single-site or general items */}
            {siteType === 'Single' &&
              checklist.map((item) => (
                <label key={item} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={!!checkedItems[item]}
                    onChange={() => handleCheck(item)}
                    style={{ marginRight: 10 }}
                  />
                  {item}
                </label>
              ))}

            {/* Multi-site: render generic items and per-site fields */}
            {siteType === 'Multi' && (
              <>
                {/* Items that are per-customer (not per-site) */}
                {checklist
                  .filter((i) => !i.toLowerCase().includes('for each approved site') && !i.toLowerCase().includes('for each tariff'))
                  .map((item) => (
                    <label key={item} style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={!!checkedItems[item]}
                        onChange={() => handleCheck(item)}
                        style={{ marginRight: 10 }}
                      />
                      {item}
                    </label>
                  ))}

                {/* Per-site fields */}
                <div style={{ marginTop: 12, paddingLeft: 6 }}>
                  <h5 style={{ marginBottom: 8, color: '#444' }}>Per-site fields</h5>

                  {/* Supply Address per site */}
                  {renderMultiSiteFields('Supply Address')}

                  {/* NMI per site */}
                  {renderMultiSiteFields('NMI')}

                  {/* Tariff screenshots: we show checkbox per site to indicate screenshot collected */}
                  {Array.from({ length: siteCount }, (_, i) => {
                    const idx = i + 1;
                    const key = `Tariff screenshot - Site ${idx}`;
                    return (
                      <label key={key} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={!!checkedItems[key]}
                          onChange={() => {
                            const isChecked = !checkedItems[key];
                            setCheckedItems((prev) => ({ ...prev, [key]: isChecked }));
                            logAction('Tariff screenshot (if applicable)', isChecked, { siteIndex: idx });
                          }}
                          style={{ marginRight: 10 }}
                        />
                        One screenshot for each tariff type — Site {idx}
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 28, display: 'grid', gap: 10 }}>
          <button type="button" onClick={() => router.push('/')} style={styles.secondaryButton}>
            Back
          </button>
          <button type="button" onClick={() => router.push('/log')} style={styles.primaryButton}>
            View Logs
          </button>
        </div>
      </div>
    </main>
  );
}

// Styles
const styles = {
  main: {
    display: 'flex',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg,#eef2f3 0%,#d7e1ea 100%)',
    fontFamily: 'Inter, Roboto, system-ui, -apple-system, "Segoe UI", Arial',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 760,
    background: '#fff',
    padding: 28,
    borderRadius: 12,
    boxShadow: '0 10px 30px rgba(16,24,40,0.08)',
  },
  title: {
    margin: 0,
    marginBottom: 18,
    fontSize: 22,
    fontWeight: 600,
    color: '#111827',
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: '1px solid #e6eef6',
    marginBottom: 16,
    fontSize: 15,
  },
  optionGroup: {
    marginBottom: 16,
  },
  optionTitle: {
    margin: 0,
    marginBottom: 8,
    color: '#1f2937',
    fontWeight: 600,
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
  },
  activeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    background: '#0366d6',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
  },
  inactiveButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    background: 'white',
    color: '#0366d6',
    border: '1px solid #dbeafe',
    cursor: 'pointer',
    fontWeight: 600,
  },
  activeButtonSecondary: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    background: '#059669',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
  },
  inactiveButtonSecondary: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    background: 'white',
    color: '#059669',
    border: '1px solid #d1fae5',
    cursor: 'pointer',
    fontWeight: 600,
  },
  checkboxLabel: {
    display: 'block',
    marginBottom: 10,
    color: '#111827',
    fontSize: 15,
  },
  primaryButton: {
    padding: 12,
    borderRadius: 10,
    background: '#0b69ff',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
  },
  secondaryButton: {
    padding: 12,
    borderRadius: 10,
    background: '#6b7280',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
  },
};
