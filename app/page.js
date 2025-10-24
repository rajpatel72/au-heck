'use client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleClick = (page) => {
    alert(`${page} button clicked!`);
    // You can later navigate using router.push('/signup') etc.
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-8">Welcome to My App</h1>

      <div className="flex flex-col gap-4 w-60">
        <button
          onClick={() => handleClick('Signup Docs')}
          className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Signup Docs
        </button>

        <button
          onClick={() => handleClick('Quote')}
          className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
        >
          Quote
        </button>

        <button
          onClick={() => handleClick('Roll-in/Roll-out')}
          className="bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition"
        >
          Roll-in/Roll-out
        </button>
      </div>
    </main>
  );
}
