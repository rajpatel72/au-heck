'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');

  const checklist = [
    'Check Name',
    'Check ABN',
    'Check Phone',
    'Check DOB',
    'Check NMI',
    'Check Supply Address',
  ];

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
          width: '300px',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>
          Signup Documents
        </h2>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
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
            <input type="checkbox" style={{ marginRight: '8px' }} />
            {item}
          </label>
        ))}

        <button
          onClick={() => router.push('/')}
          style={{
            background: '#555',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            cursor: 'pointer',
            marginTop: '20px',
            width: '100%',
          }}
        >
          Back
        </button>
      </div>
    </main>
  );
}
