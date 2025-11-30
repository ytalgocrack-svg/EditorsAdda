"use client";
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LogOut, Shield, Menu, X, Sparkles, Megaphone, 
  UploadCloud, LayoutDashboard, Trophy, MessageSquarePlus, 
  Palette, User, Bell, Users // <--- Added Users Icon
} from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  // -- State Management --
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // -- UI State --
  const [menuOpen, setMenuOpen] = useState(false); 
  const [dropdownOpen, setDropdownOpen] = useState(false); 
  
  // -- Settings State --
  const [settings, setSettings] = useState({
    site_name: 'EditorsAdda',
    announcement_text: '',
    announcement_enabled: 'false'
  });
  
  const router = useRouter();
  const dropdownRef = useRef(null);

  // -- Effects --
  useEffect(() => {
    checkUser();
    fetchSettings();

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { 
      checkUser(); 
    });

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // -- Data Fetching --
  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setIsAdmin(data?.role === 'admin');
    }
  }

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*');
    const config = {};
    if(data) data.forEach(item => config[item.key] = item.value);
    setSettings(prev => ({ ...prev, ...config }));
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    window.location.href = '/';
  };

  // -- RENDER --
  return (
    <div className="sticky top-0 z-50 font-sans">
      
      {/* 1. ANNOUNCEMENT BAR */}
      {settings.announcement_enabled === 'true' && (
        <div className="bg-primary text-white text-xs font-bold py-2 px-4 text-center relative z-50">
          <span className="flex items-center justify-center gap-2 animate-pulse">
            <Megaphone size={14} /> {settings.announcement_text}
          </span>
        </div>
      )}

      {/* 2. MAIN NAVBAR */}
      <nav className="bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary p-1.5 rounded-lg text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                <Sparkles size={20} />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight group-hover:text-primary transition-colors">
                {settings.site_name}
              </span>
            </Link>
            
            {/* Desktop Center Links */}
            <div className="hidden md:flex items-center gap-5">
              <Link href="/leaderboard" className="text-sm font-bold text-slate-400 hover:text-yellow-400 flex items-center gap-1.5 transition">
                <Trophy size={16}/> Top Creators
              </Link>
              <Link href="/community" className="text-sm font-bold text-slate-400 hover:text-blue-400 flex items-center gap-1.5 transition">
                <Users size={16}/> Community
              </Link>
              <Link href="/requests" className="text-sm font-bold text-slate-400 hover:text-green-400 flex items-center gap-1.5 transition">
                <MessageSquarePlus size={16}/> Requests
              </Link>
              <Link href="/tools" className="text-sm font-bold text-slate-400 hover:text-purple-400 flex items-center gap-1.5 transition">
                <Palette size={16}/> Tools
              </Link>
            </div>

            {/* Desktop Right Side */}
            <div className="hidden md:flex items-center gap-4">
              
              {user && <NotificationBell userId={user.id} />}

              {!user ? (
                <Link href="/auth" className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-sm hover:bg-slate-200 transition shadow-lg">
                  Login
                </Link>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  {/* Avatar Trigger */}
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)} 
                    className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[2px] transition hover:scale-105 focus:outline-none"
                  >
                    <img 
                      src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=random`} 
                      className="w-full h-full rounded-full border-2 border-[#0f172a] object-cover"
                      alt="Profile"
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-fade-in origin-top-right">
                        
                        <div className="px-4 py-3 border-b border-white/5 mb-2">
                          <p className="text-white font-bold truncate">{profile?.display_name || 'User'}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>

                        {isAdmin && (
                          <Link href="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 font-bold transition">
                            <Shield size={16}/> Admin Panel
                          </Link>
                        )}
                        
                        <Link href="/user/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition">
                          <LayoutDashboard size={16}/> Creator Dashboard
                        </Link>
                        
                        <Link href="/account" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition">
                          <User size={16}/> Account Settings
                        </Link>

                        <div className="border-t border-white/5 mt-2 pt-2">
                          <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition">
                            <LogOut size={16}/> Sign Out
                          </button>
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Toggle Button */}
            <div className="md:hidden flex gap-4 items-center">
               {user && <NotificationBell userId={user.id} />}
               <button onClick={() => setMenuOpen(!menuOpen)} className="text-slate-300 hover:text-white p-1">
                 {menuOpen ? <X size={28} /> : <Menu size={28} />}
               </button>
            </div>
          </div>
        </div>
        
        {/* 3. MOBILE MENU (Slide Down) */}
        {menuOpen && (
          <div className="md:hidden bg-[#0f172a] border-b border-white/10 absolute w-full p-4 space-y-2 shadow-2xl animate-slide-up z-40">
             
             {/* Navigation Links */}
             <div className="space-y-1 pb-4 border-b border-white/5">
               <Link href="/leaderboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 text-slate-300 font-bold hover:bg-white/5 rounded-lg">
                 <Trophy size={18} className="text-yellow-500"/> Leaderboard
               </Link>
               <Link href="/community" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 text-slate-300 font-bold hover:bg-white/5 rounded-lg">
                 <Users size={18} className="text-blue-500"/> Community
               </Link>
               <Link href="/requests" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 text-slate-300 font-bold hover:bg-white/5 rounded-lg">
                 <MessageSquarePlus size={18} className="text-green-500"/> Request Zone
               </Link>
               <Link href="/tools" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 text-slate-300 font-bold hover:bg-white/5 rounded-lg">
                 <Palette size={18} className="text-purple-500"/> Editor Tools
               </Link>
             </div>

             {/* User Section */}
             {user ? (
               <div className="pt-2 space-y-1">
                 <Link href="/user/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 text-slate-300 font-bold hover:bg-white/5 rounded-lg">
                   <LayoutDashboard size={18} className="text-blue-500"/> My Dashboard
                 </Link>
                 <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 text-slate-300 font-bold hover:bg-white/5 rounded-lg">
                   <User size={18} className="text-slate-400"/> Account
                 </Link>
                 {isAdmin && (
                   <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 text-red-400 font-bold hover:bg-white/5 rounded-lg">
                     <Shield size={18}/> Admin
                   </Link>
                 )}
                 <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left p-3 text-slate-400 font-bold hover:bg-white/5 rounded-lg">
                   <LogOut size={18}/> Logout
                 </button>
               </div>
             ) : (
               <div className="pt-4">
                 <Link href="/auth" onClick={() => setMenuOpen(false)} className="block w-full bg-primary text-white text-center font-bold py-3 rounded-xl shadow-lg">
                   Login / Sign Up
                 </Link>
               </div>
             )}
          </div>
        )}
      </nav>
    </div>
  );
}
