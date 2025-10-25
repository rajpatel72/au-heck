'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SignupPage() {
const router = useRouter();
const [name, setName] = useState('');
const [checkedItems, setCheckedItems] = useState({});
const [siteType, setSiteType] = useState('');
const [accountType, setAccountType] = useState('');

useEffect(() => {
const savedName = localStorage.getItem('lastName');
if (savedName) setName(savedName);
}, []);

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

const logAction = async (checkboxLabel, isChecked) => {
if (!name) {
alert('Please enter a customer name before checking.');
return;
}

```
const timestamp = new Date().toISOString();
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

  if (!response.ok) console.error('Failed to save log:', await response.text());
} catch (error) {
  console.error('Error logging action:', error);
}
```

};

const handleCheck = (label) => {
const isChecked = !checkedItems[label];
setCheckedItems({ ...checkedItems, [label]: isChecked });
logAction(label, isChecked);
};

const checklist = getChecklist();

return ( <main style={styles.main}> <div style={styles.card}> <h2 style={styles.title}>Signup Documents</h2>

```
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
      <h4 style={styles.optionTitle}>Select Site Type:</h4>
      <div style={styles.buttonRow}>
        <button
          style={siteType === 'Single' ? styles.activeButton : styles.inactiveButton}
          onClick={() => {
            setSiteType('Single');
            setAccountType('');
            setCheckedItems({});
          }}
        >
          Single Site
        </button>
        <button
          style={siteType === 'Multi' ? styles.activeButton : styles.inactiveButton}
          onClick={() => {
            setSiteType('Multi');
            setAccountType('');
            setCheckedItems({});
          }}
        >
          Multi Site
        </button>
      </div>
    </div>

    {/* Account Type Selection */}
    {siteType && (
      <div style={styles.optionGroup}>
        <h4 style={styles.optionTitle}>Select Account Type:</h4>
        <div style={styles.buttonRow}>
          <button
            style={accountType === 'Personal' ? styles.activeButton : styles.inactiveButton}
            onClick={() => {
              setAccountType('Personal');
              setCheckedItems({});
            }}
          >
            Personal Account Setup
          </button>
          <button
            style={accountType === 'Business' ? styles.activeButton : styles.inactiveButton}
            onClick={() => {
              setAccountType('Business');
              setCheckedItems({});
            }}
          >
            Business Account Setup
          </button>
        </div>
      </div>
    )}

    {/* Checklist */}
    {checklist.length > 0 && (
      <div style={{ marginTop: 20 }}>
        {checklist.map((item, i) => (
          <label key={i} style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={!!checkedItems[item]}
              onChange={() => handleCheck(item)}
              style={{ marginRight: 10 }}
            />
            {item}
          </label>
        ))}
      </div>
    )}

    {/* Buttons */}
    <div style={{ marginTop: 30 }}>
      <button onClick={() => router.push('/')} style={styles.secondaryButton}>
        Back
      </button>
      <button onClick={() => router.push('/logs')} style={styles.primaryButton}>
        View Logs
      </button>
    </div>
  </div>
</main>
```

);
}

const styles = {
main: {
display: 'flex',
flexDirection: 'column',
alignItems: 'center',
justifyContent: 'center',
minHeight: '100vh',
background: 'linear-gradient(135deg, #eef2f3, #8e9eab)',
fontFamily: 'Segoe UI, Roboto, sans-serif',
padding: '20px',
},
card: {
background: 'white',
padding: '40px',
borderRadius: '16px',
boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
width: '100%',
maxWidth: '480px',
},
title: {
textAlign: 'center',
fontSize: '24px',
fontWeight: '600',
marginBottom: '25px',
color: '#333',
},
input: {
width: '100%',
padding: '12px',
borderRadius: '8px',
border: '1px solid #ccc',
marginBottom: '20px',
fontSize: '15px',
},
optionGroup: {
marginBottom: '20px',
},
optionTitle: {
fontSize: '16px',
fontWeight: '500',
marginBottom: '10px',
color: '#444',
},
buttonRow: {
display: 'flex',
justifyContent: 'space-between',
gap: '10px',
},
activeButton: {
flex: 1,
background: '#0070f3',
color: 'white',
border: 'none',
borderRadius: '8px',
padding: '10px',
cursor: 'pointer',
fontWeight: '500',
},
inactiveButton: {
flex: 1,
background: '#e0e0e0',
color: '#333',
border: 'none',
borderRadius: '8px',
padding: '10px',
cursor: 'pointer',
},
checkboxLabel: {
display: 'block',
marginBottom: '10px',
color: '#333',
fontSize: '15px',
},
primaryButton: {
background: '#007bff',
color: 'white',
border: 'none',
borderRadius: '8px',
padding: '12px',
cursor: 'pointer',
width: '100%',
fontWeight: '500',
marginTop: '10px',
},
secondaryButton: {
background: '#555',
color: 'white',
border: 'none',
borderRadius: '8px',
padding: '12px',
cursor: 'pointer',
width: '100%',
fontWeight: '500',
},
};
