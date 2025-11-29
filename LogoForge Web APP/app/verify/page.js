"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function Verify() {
  const router = useRouter();
  const [status, setStatus] = useState('Verifying Token...');

  useEffect(() => {
    // 1. Set Token
    const oneHour = 60 * 60 * 1000;
    const expiryTime = Date.now() + oneHour;
    localStorage.setItem('download_token', expiryTime.toString());

    // 2. Redirect forcefully after 1.5s
    setStatus('Success! Redirecting...');
    setTimeout(() => {
      // Force a full page load to ensure state updates
      window.location.href = '/'; 
    }, 1500);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="bg-white/10 backdrop-blur-md p-10 rounded-3xl border border-white/10">
        <CheckCircle size={64} className="text-green-500 mx-auto mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold mb-2">{status}</h1>
        <p className="text-slate-400">Your download access is unlocked for 1 hour.</p>
      </div>
    </div>
  );
}
