'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [checkedItems, setCheckedItems] = useState({});

  const checklist = [
    'Check Name',
    'Check ABN',
    'Check Phone',
    'Check DOB',
    'Check NMI',
    'Check Supply Address',
  ];

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

    // Save name locally for next session
    localStorage.setItem('lastName', name);

    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          checkboxLabel,
          isChecked,
          timestamp,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save log:', await response.text());
      }
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  // Handle checkbox state and trigger logging
  const handleCheck = (label) => {
    const isChecked = !checkedItems[label];
    setCheckedItems({ ...checkedItems, [label]: isChecked });
    logAction(label, isChecked);
  };

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f4f4f4',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          width: '320px',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Signup Documents</h2>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter customer name"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            marginBottom: '20px',
          }}
        />

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

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => router.push('/')}
            style={buttonStyle('#555')}
          >
            Back
          </button>

          <button
            onClick={() => router.push('/logs')}
            style={buttonStyle('#007bff')}
          >
            View Logs
          </button>
        </div>
      </div>
    </main>
  );
}

// Reusable button styling helper
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
  };
}
