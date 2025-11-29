"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Shield, Menu, X, Sparkles, Megaphone } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const router = useRouter();

  useEffect(() => {
    checkUser();
    fetchSettings();
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

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*');
    const config = {};
    if(data) data.forEach(item => config[item.key] = item.value);
    setSettings(config);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    router.push('/');
  };

  return (
    <div className="sticky top-0 z-50">
      
      {/* 1. Announcement Bar (Dynamic) */}
      {settings.announcement_enabled === 'true' && (
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs md:text-sm font-bold py-2 px-4 text-center shadow-md relative z-50">
          <span className="flex items-center justify-center gap-2">
            <Megaphone size={16} className="animate-bounce" /> 
            {settings.announcement_text}
          </span>
        </div>
      )}

      {/* 2. Glass Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <Sparkles size={20} />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-800">
                {settings.site_name || 'LogoForge'}
              </span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              {isAdmin && (
                <div className="flex bg-slate-100 rounded-full p-1 border border-slate-200">
                  <Link href="/upload" className="px-4 py-1.5 text-sm font-bold text-slate-600 hover:text-blue-600 rounded-full transition">Upload</Link>
                  <Link href="/admin" className="px-4 py-1.5 text-sm font-bold bg-white shadow-sm text-blue-600 rounded-full flex items-center gap-1">
                    <Shield size={14}/> Admin
                  </Link>
                </div>
              )}

              {user ? (
                <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 font-medium text-sm flex items-center gap-1 transition">
                  <LogOut size={18} /> Logout
                </button>
              ) : (
                <Link href="/auth" className="bg-slate-900 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-slate-600 p-2">
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t p-4 space-y-3 shadow-xl absolute w-full">
             {isAdmin && (
               <>
                <Link href="/upload" className="block p-3 bg-slate-50 rounded-lg font-bold text-slate-700">Upload Logo</Link>
                <Link href="/admin" className="block p-3 bg-blue-50 text-blue-600 rounded-lg font-bold">Admin Panel</Link>
               </>
             )}
             {user ? (
               <button onClick={handleLogout} className="w-full text-left p-3 text-red-500 font-bold">Logout</button>
             ) : (
               <Link href="/auth" className="block p-3 bg-slate-900 text-white rounded-lg font-bold text-center">Login / Sign Up</Link>
             )}
          </div>
        )}
      </nav>
    </div>
  );
}
