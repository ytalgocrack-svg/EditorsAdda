"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else router.push('/');
  };

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert('Check your email to confirm signup!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow w-96">
        <h1 className="text-xl font-bold mb-4">Login / Sign Up</h1>
        <input className="w-full border p-2 mb-3" placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input className="w-full border p-2 mb-3" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={handleLogin} className="flex-1 bg-blue-600 text-white py-2 rounded">Login</button>
          <button onClick={handleSignup} className="flex-1 bg-gray-200 py-2 rounded">Sign Up</button>
        </div>
      </div>
    </div>
  );
}