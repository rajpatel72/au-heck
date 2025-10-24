'use client';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

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
      <h1 style={{ marginBottom: 30 }}>Welcome to My App</h1>

      <button
        onClick={() => router.push('/signup')}
        style={buttonStyle('#007bff')}
      >
        Signup Docs
      </button>

      <button
        onClick={() => alert('Quote button clicked!')}
        style={buttonStyle('#28a745')}
      >
        Quote
      </button>

      <button
        onClick={() => alert('Roll-in/Roll-out button clicked!')}
        style={buttonStyle('#6f42c1')}
      >
        Roll-in/Roll-out
      </button>
    </main>
  );
}

function buttonStyle(color) {
  return {
    background: color,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '10px',
    width: '200px',
    transition: '0.3s',
  };
}
