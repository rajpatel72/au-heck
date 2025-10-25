'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [siteType, setSiteType] = useState('');
  const [accountType, setAccountType] = useState('');
  const [checkedItems, setCheckedItems] = useState({});

  // Load last used name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('lastName');
    if (savedName) setName(savedName);
  }, []);

  // Function to log checkbox actions to the API
  const logAction = async (checkboxLabel, isChecked) => {
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
        body: JSON.stringify({ name, checkboxLabel, isChecked, timestamp }),
      });
      if (!res.ok) console.error('Log save failed:', await res.text());
    } catch (err) {
      console.error('Error logging action:', err);
    }
  };

  // Handle checkbox state + log
  const handleCheck = (label) => {
    const isChecked = !checkedItems[label];
    setCheckedItems({ ...checkedItems, [label]: isChecked });
    logAction(label, isChecked);
  };

  // Dynamic checklists
  const personalChecklist = [
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

  const businessChecklist = [
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

  const checklist =
    siteType === 'Single Site' && accountType === 'Personal Account'
      ? personalChecklist
      : siteType === 'Single Site' && accountType === 'Business Account'
      ? businessChecklist
      : siteType === 'Multi Site' && accountType === 'Personal Account'
      ? personalChecklist
      : siteType === 'Multi Site' && accountType === 'Business Account'
      ? businessChecklist
      : [];

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f7f9fb',
        fontFamily: 'system-ui, sans-serif',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '420px',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>
          Signup Documents
        </h2>

        {/* Customer name input */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter customer name"
          style={inputStyle}
        />

        {/* Step 1 - Choose site type */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 10 }}>Select Site Type:</h4>
          <div style={buttonRow}>
            {['Single Site', 'Multi Site'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setSiteType(type);
                  setAccountType('');
                  setCheckedItems({});
                }}
                style={{
                  ...optionButton,
                  background:
                    siteType === type ? '#007bff' : 'white',
                  color: siteType === type ? 'white' : '#007bff',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 - Choose account type */}
        {siteType && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 10 }}>Select Account Type:</h4>
            <div style={buttonRow}>
              {['Personal Account', 'Business Account'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setAccountType(type);
                    setCheckedItems({});
                  }}
                  style={{
                    ...optionButton,
                    background:
                      accountType === type ? '#28a745' : 'white',
                    color: accountType === type ? 'white' : '#28a745',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 - Dynamic checklist */}
        {accountType && (
          <div style={{ marginTop: 20 }}>
            <h4 style={{ marginBottom: 10 }}>Checklist:</h4>
            {checklist.map((item, i) => (
              <label
                key={i}
                style={{
                  display: 'block',
                  marginBottom: '10px',
                  textAlign: 'left',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!checkedItems[item]}
                  onChange={() => handleCheck(item)}
                  style={{ marginRight: '8px' }}
                />
                {item}
              </label>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{ marginTop: 30 }}>
          <button onClick={() => router.push('/')} style={buttonStyle('#555')}>
            Back
          </button>

          <button
            onClick={() => router.push('/log')}
            style={buttonStyle('#007bff')}
          >
            View Logs
          </button>
        </div>
      </div>
    </main>
  );
}

// Styles
const inputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  marginBottom: '20px',
};

const buttonRow = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '10px',
};

const optionButton = {
  flex: 1,
  padding: '10px',
  border: '2px solid #007bff',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: '0.2s ease',
};

function buttonStyle(color) {
  return {
    background: color,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    cursor: 'pointer',
    marginTop: '10px',
    width: '100%',
    fontWeight: 'bold',
  };
}
