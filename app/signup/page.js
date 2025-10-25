'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [checkedItems, setCheckedItems] = useState({});
  const [siteType, setSiteType] = useState('');
  const [accountType, setAccountType] = useState('');
  const [siteCount, setSiteCount] = useState(1);

  useEffect(() => {
    const savedName = localStorage.getItem('lastName');
    if (savedName) setName(savedName);
  }, []);

  // ----- Checklists -----
  const singlePersonal = [
    'Contact person name', 'Mobile & Phone', 'Email address', 'DOB',
    'Mailing address', 'Supply Address', 'NMI', 'ID Details', 'Screenshot (if applicable)',
  ];
  const singleBusiness = [
    'Company name', 'ABN/ACN', 'Contact person name', 'Mobile & Phone',
    'Email address', 'DOB', 'Mailing address', 'Supply Address', 'NMI',
    'Rates screenshot (if applicable)',
  ];
  const multiPersonal = [
    'Contact person name', 'Mobile & Phone', 'Email address', 'DOB',
    'Mailing address', 'Supply Address for each approved site', 'NMI for each approved site',
    'ID Details', 'One screenshot for each tariff type (if applicable)',
  ];
  const multiBusiness = [
    'Company name', 'ABN/ACN', 'Contact person name', 'Mobile & Phone number',
    'Email address', 'DOB', 'Mailing address', 'Supply Address for each approved site',
    'NMI for each approved site', 'One screenshot for each tariff type (if applicable)',
  ];

  const getChecklist = () => {
    if (siteType === 'Single' && accountType === 'Personal') return singlePersonal;
    if (siteType === 'Single' && accountType === 'Business') return singleBusiness;
    if (siteType === 'Multi' && accountType === 'Personal') return multiPersonal;
    if (siteType === 'Multi' && accountType === 'Business') return multiBusiness;
    return [];
  };

  // ----- Log to Supabase -----
  const logAction = async (checkboxLabel, isChecked, meta = {}) => {
    if (!name) {
      alert('Please enter a customer name before checking.');
      return;
    }

    const timestamp = new Date().toISOString();
    localStorage.setItem('lastName', name);

    try {
      const { error } = await supabase.from('logs').insert([
        { name, checkbox_label: checkboxLabel, is_checked: isChecked, timestamp, meta },
      ]);
      if (error) console.error('Supabase logging error:', error.message);
    } catch (err) {
      console.error('Supabase logging exception:', err);
    }
  };

  // ----- Handle Checkboxes -----
  const handleCheck = (label) => {
    const isChecked = !checkedItems[label];
    setCheckedItems((prev) => ({ ...prev, [label]: isChecked }));
    logAction(label, isChecked);
  };

  const handleSiteCheck = (baseLabel, siteIndex) => {
    const key = `${baseLabel} - Site ${siteIndex}`;
    const isChecked = !checkedItems[key];
    setCheckedItems((prev) => ({ ...prev, [key]: isChecked }));
    logAction(baseLabel, isChecked, { siteIndex });
  };

  const renderMultiSiteFields = (baseLabel) => {
    return Array.from({ length: siteCount }, (_, i) => {
      const idx = i + 1;
      const key = `${baseLabel} - Site ${idx}`;
      return (
        <label key={key} style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={!!checkedItems[key]}
            onChange={() => handleSiteCheck(baseLabel, idx)}
            style={{ marginRight: 10 }}
          />
          {baseLabel} — Site {idx}
        </label>
      );
    });
  };

  const checklist = getChecklist();

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h2 style={styles.title}>Signup Documents</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter customer name"
          style={styles.input}
        />

        {/* Site & Account Type */}
        <div style={styles.optionGroup}>
          <h4 style={styles.optionTitle}>Select Site Type</h4>
          <div style={styles.buttonRow}>
            <button type="button" onClick={() => { setSiteType('Single'); setAccountType(''); setCheckedItems({}); setSiteCount(1); }} style={siteType==='Single'?styles.activeButton:styles.inactiveButton}>Single Site</button>
            <button type="button" onClick={() => { setSiteType('Multi'); setAccountType(''); setCheckedItems({}); setSiteCount(2); }} style={siteType==='Multi'?styles.activeButton:styles.inactiveButton}>Multi Site</button>
          </div>
        </div>
        {siteType && (
          <div style={styles.optionGroup}>
            <h4 style={styles.optionTitle}>Account Setup</h4>
            <div style={styles.buttonRow}>
              <button type="button" onClick={() => { setAccountType('Personal'); setCheckedItems({}); }} style={accountType==='Personal'?styles.activeButtonSecondary:styles.inactiveButtonSecondary}>Personal Account</button>
              <button type="button" onClick={() => { setAccountType('Business'); setCheckedItems({}); }} style={accountType==='Business'?styles.activeButtonSecondary:styles.inactiveButtonSecondary}>Business Account</button>
            </div>
          </div>
        )}

        {/* Multi-site count */}
        {siteType==='Multi' && accountType && (
          <div style={{ marginTop:14 }}>
            <label style={{ display:'block', marginBottom:8, color:'#333' }}>Number of approved sites:</label>
            <input type="number" min={1} max={20} value={siteCount} onChange={(e)=>setSiteCount(Number(e.target.value)||1)} style={{ width:120, padding:8, borderRadius:6, border:'1px solid #ccc' }} />
          </div>
        )}

        {/* Checklist */}
        {accountType && checklist.length>0 && (
          <div style={{ marginTop:20 }}>
            <h4 style={{ marginBottom:12 }}>Checklist</h4>
            {/* Single */}
            {siteType==='Single' && checklist.map(item => (
              <label key={item} style={styles.checkboxLabel}>
                <input type="checkbox" checked={!!checkedItems[item]} onChange={()=>handleCheck(item)} style={{ marginRight:10 }}/>
                {item}
              </label>
            ))}

            {/* Multi-site */}
            {siteType==='Multi' && <>
              {checklist.filter(i=>!i.toLowerCase().includes('for each approved site') && !i.toLowerCase().includes('tariff')).map(item => (
                <label key={item} style={styles.checkboxLabel}>
                  <input type="checkbox" checked={!!checkedItems[item]} onChange={()=>handleCheck(item)} style={{ marginRight:10 }}/>
                  {item}
                </label>
              ))}

              <div style={{ marginTop:12, paddingLeft:6 }}>
                <h5 style={{ marginBottom:8, color:'#444' }}>Per-site fields</h5>
                {renderMultiSiteFields('Supply Address')}
                {renderMultiSiteFields('NMI')}
                {Array.from({ length: siteCount }, (_, i) => {
                  const idx=i+1;
                  const key=`Tariff screenshot - Site ${idx}`;
                  return <label key={key} style={styles.checkboxLabel}>
                    <input type="checkbox" checked={!!checkedItems[key]} onChange={()=>{
                      const isChecked=!checkedItems[key];
                      setCheckedItems(prev=>({...prev,[key]:isChecked}));
                      logAction('Tariff screenshot (if applicable)', isChecked,{ siteIndex: idx });
                    }} style={{ marginRight:10 }}/>
                    One screenshot for each tariff type — Site {idx}
                  </label>;
                })}
              </div>
            </>}
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop:28, display:'grid', gap:10 }}>
          <button type="button" onClick={()=>router.push('/')} style={styles.secondaryButton}>Back</button>
          <button type="button" onClick={()=>router.push('/logs')} style={styles.primaryButton}>View Logs</button>
        </div>
      </div>
    </main>
  );
}

// Styles same as before (can copy your previous styles)
const styles = {
  main:{display:'flex',justifyContent:'center',minHeight:'100vh',padding:24,fontFamily:'Inter,Roboto'},
  card:{width:'100%',maxWidth:760,background:'#fff',padding:28,borderRadius:12,boxShadow:'0 10px 30px rgba(16,24,40,0.08)'},
  title:{margin:0,marginBottom:18,fontSize:22,fontWeight:600,color:'#111827'},
  input:{width:'100%',padding:12,borderRadius:8,border:'1px solid #e6eef6',marginBottom:16,fontSize:15},
  optionGroup:{marginBottom:16},
  optionTitle:{margin:0,marginBottom:8,color:'#1f2937',fontWeight:600},
  buttonRow:{display:'flex',gap:12},
  activeButton:{flex:1,padding:10,borderRadius:8,background:'#0366d6',color:'white',border:'none',cursor:'pointer',fontWeight:600},
  inactiveButton:{flex:1,padding:10,borderRadius:8,background:'white',color:'#0366d6',border:'1px solid #dbeafe',cursor:'pointer',fontWeight:600},
  activeButtonSecondary:{flex:1,padding:10,borderRadius:8,background:'#059669',color:'white',border:'none',cursor:'pointer',fontWeight:600},
  inactiveButtonSecondary:{flex:1,padding:10,borderRadius:8,background:'white',color:'#059669',border:'1px solid #d1fae5',cursor:'pointer',fontWeight:600},
  checkboxLabel:{display:'block',marginBottom:10,color:'#111827',fontSize:15},
  primaryButton:{padding:12,borderRadius:10,background:'#0b69ff',color:'#fff',border:'none',cursor:'pointer',fontWeight:700},
  secondaryButton:{padding:12,borderRadius:10,background:'#6b7280',color:'#fff',border:'none',cursor:'pointer',fontWeight:700},
};
