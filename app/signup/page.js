'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

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

  // --- Checklist Definitions ---
  const singlePersonal = ['Contact person name','Mobile & Phone','Email address','DOB','Mailing address','Supply Address','NMI','ID Details','Screenshot (if applicable)'];
  const singleBusiness = ['Company name','ABN/ACN','Contact person name','Mobile & Phone','Email address','DOB','Mailing address','Supply Address','NMI','Rates screenshot (if applicable)'];
  const multiPersonal = ['Contact person name','Mobile & Phone','Email address','DOB','Mailing address','Supply Address for each approved site','NMI for each approved site','ID Details','One screenshot for each tariff type (if applicable)'];
  const multiBusiness = ['Company name','ABN/ACN','Contact person name','Mobile & Phone number','Email address','DOB','Mailing address','Supply Address for each approved site','NMI for each approved site','One screenshot for each tariff type (if applicable)'];

  const getChecklist = () => {
    if(siteType==='Single' && accountType==='Personal') return singlePersonal;
    if(siteType==='Single' && accountType==='Business') return singleBusiness;
    if(siteType==='Multi' && accountType==='Personal') return multiPersonal;
    if(siteType==='Multi' && accountType==='Business') return multiBusiness;
    return [];
  }

  // --- Logging ---
  const logAction = async (checkboxLabel, isChecked, meta={})=>{
    if(!name){ alert('Enter customer name before checking.'); return; }
    localStorage.setItem('lastName', name);
    try {
      await fetch('/api/log', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name, checkboxLabel, isChecked, timestamp:new Date().toISOString(), meta}) });
    } catch(err){ console.error(err); }
  }

  const handleCheck = (label) => { const isChecked=!checkedItems[label]; setCheckedItems(prev=>({...prev,[label]:isChecked})); logAction(label,isChecked); }
  const handleSiteCheck = (baseLabel, idx) => { const key=`${baseLabel} - Site ${idx}`; const isChecked=!checkedItems[key]; setCheckedItems(prev=>({...prev,[key]:isChecked})); logAction(baseLabel,isChecked,{siteIndex:idx}); }
  
  const checklist = getChecklist();

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.header}>Signup Documents</h1>
        
        <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Customer Name" style={styles.input}/>

        {/* Site Type */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Site Type</h3>
          <div style={styles.buttonRow}>
            <button type="button" onClick={()=>{setSiteType('Single'); setAccountType(''); setCheckedItems({}); setSiteCount(1);}} style={siteType==='Single'?styles.activeButton:styles.inactiveButton}>Single Site</button>
            <button type="button" onClick={()=>{setSiteType('Multi'); setAccountType(''); setCheckedItems({}); setSiteCount(2);}} style={siteType==='Multi'?styles.activeButton:styles.inactiveButton}>Multi Site</button>
          </div>
        </section>

        {/* Account Type */}
        {siteType && <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Account Type</h3>
          <div style={styles.buttonRow}>
            <button type="button" onClick={()=>{setAccountType('Personal'); setCheckedItems({});}} style={accountType==='Personal'?styles.activeButtonSecondary:styles.inactiveButtonSecondary}>Personal</button>
            <button type="button" onClick={()=>{setAccountType('Business'); setCheckedItems({});}} style={accountType==='Business'?styles.activeButtonSecondary:styles.inactiveButtonSecondary}>Business</button>
          </div>
        </section>}

        {/* Multi-Site Count */}
        
        {/* Checklist */}
        {accountType && checklist.length>0 && <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Checklist</h3>

          {/* Single-site items */}
          {siteType==='Single' && checklist.map(item=><label key={item} style={styles.checkboxLabel}><input type="checkbox" checked={!!checkedItems[item]} onChange={()=>handleCheck(item)} style={{marginRight:10}}/>{item}</label>)}

          {/* Multi-site items */}
          {siteType==='Multi' && <>
            {checklist.map(item=><label key={item} style={styles.checkboxLabel}><input type="checkbox" checked={!!checkedItems[item]} onChange={()=>handleCheck(item)} style={{marginRight:10}}/>{item}</label>)}
    
          </>}
        </section>}

        {/* Actions */}
        <div style={{marginTop:28, display:'flex', gap:12}}>
          <button type="button" onClick={()=>router.push('/')} style={styles.secondaryButton}>Back</button>
          <button type="button" onClick={()=>router.push('/logs')} style={styles.primaryButton}>View Logs</button>
        </div>
      </div>
    </main>
  );
}

const styles = {
  main: { display:'flex', justifyContent:'center', padding:24, minHeight:'100vh', background:'#f0f4f8', fontFamily:'Inter, sans-serif' },
  card: { width:'100%', maxWidth:800, background:'#fff', borderRadius:12, padding:32, boxShadow:'0 12px 40px rgba(0,0,0,0.08)' },
  header: { margin:0, marginBottom:24, fontSize:26, fontWeight:700, color:'#111827' },
  input: { width:'100%', padding:14, borderRadius:8, border:'1px solid #d1d5db', marginBottom:20, fontSize:15 },
  section: { marginBottom:24 },
  sectionTitle: { marginBottom:12, fontWeight:600, fontSize:16, color:'#111827' },
  buttonRow: { display:'flex', gap:12 },
  activeButton: { flex:1, padding:12, borderRadius:8, background:'#0366d6', color:'#fff', border:'none', fontWeight:600, cursor:'pointer' },
  inactiveButton: { flex:1, padding:12, borderRadius:8, background:'#fff', color:'#0366d6', border:'1px solid #93c5fd', fontWeight:600, cursor:'pointer' },
  activeButtonSecondary: { flex:1, padding:12, borderRadius:8, background:'#059669', color:'#fff', border:'none', fontWeight:600, cursor:'pointer' },
  inactiveButtonSecondary: { flex:1, padding:12, borderRadius:8, background:'#fff', color:'#059669', border:'1px solid #6ee7b7', fontWeight:600, cursor:'pointer' },
  checkboxLabel: { display:'block', marginBottom:12, fontSize:15, color:'#111827' },
  siteCountInput: { width:100, padding:8, borderRadius:6, border:'1px solid #d1d5db', marginTop:6 },
  primaryButton: { flex:1, padding:14, borderRadius:10, background:'#0b69ff', color:'#fff', fontWeight:700, border:'none', cursor:'pointer' },
  secondaryButton: { flex:1, padding:14, borderRadius:10, background:'#6b7280', color:'#fff', fontWeight:700, border:'none', cursor:'pointer' },
};
