"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User, Shield, Menu } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setIsAdmin(data?.role === 'admin');
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    router.push('/');
  };

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            LogoForge
          </Link>
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <div className="hidden md:flex gap-2">
                <Link href="/upload" className="text-sm bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-full flex items-center gap-1 transition">
                   Upload
                </Link>
                <Link href="/admin" className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full flex items-center gap-1 transition">
                  <Shield size={14}/> Dashboard
                </Link>
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300 hidden sm:block">{user.email}</span>
                <button onClick={handleLogout} className="text-gray-300 hover:text-white transition">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link href="/auth" className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
