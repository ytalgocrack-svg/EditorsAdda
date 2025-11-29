"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function Verify() {
  const router = useRouter();
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    // 1. Calculate Expiry (Now + 1 Hour)
    const oneHour = 60 * 60 * 1000;
    const expiryTime = Date.now() + oneHour;

    // 2. Save to LocalStorage
    localStorage.setItem('download_token', expiryTime.toString());

    // 3. Show success and redirect
    setStatus('Token Generated Successfully!');
    
    setTimeout(() => {
      router.push('/'); // Send them back to home (or they can browse again)
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl flex flex-col items-center max-w-md w-full animate-bounce-in">
          <div className="mb-6 p-4 bg-green-100 rounded-full text-green-600">
            {status === 'Verifying...' ? <Loader2 size={48} className="animate-spin"/> : <CheckCircle size={48}/>}
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{status}</h1>
          <p className="text-slate-500">
            You now have access to premium downloads for 1 hour. Redirecting you...
          </p>
        </div>
      </div>
    </div>
  );
}
