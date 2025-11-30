"use client";
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LogOut, Shield, Menu, X, Sparkles, Megaphone, 
  UploadCloud, LayoutDashboard, User, Settings, Tv 
} from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // Mobile Menu
  const [dropdownOpen, setDropdownOpen] = useState(false); // Avatar Dropdown
  const dropdownRef = useRef(null);
  
  const [settings, setSettings] = useState({
    site_name: 'EditorsAdda',
    announcement_text: '',
    announcement_enabled: 'false'
  });
  
  const router = useRouter();

  useEffect(() => {
    checkUser();
    fetchSettings();
    
    // Close dropdown if clicking outside
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

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      // Fetch Profile Details (Avatar, Name)
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
    window.location.href = '/';
  };

  return (
    <div className="sticky top-0 z-50 font-sans">
      
      {/* ANNOUNCEMENT */}
      {settings.announcement_enabled === 'true' && (
        <div className="bg-primary text-white text-xs md:text-sm font-bold py-2 px-4 text-center shadow-lg relative z-50">
          <span className="flex items-center justify-center gap-2 animate-pulse">
            <Megaphone size={16} /> {settings.announcement_text}
          </span>
        </div>
      )}

      <nav className="bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* BRAND */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary p-1.5 rounded-lg text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                <Sparkles size={20} />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-primary transition-colors">
                {settings.site_name}
              </span>
            </Link>
            
            {/* DESKTOP RIGHT SIDE */}
            <div className="hidden md:flex items-center gap-4">
              
              {!user ? (
                <Link href="/auth" className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-sm hover:bg-slate-200 transition shadow-lg">
                  Login
                </Link>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  {/* AVATAR TRIGGER */}
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[2px]">
                      <img 
                        src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=random`} 
                        className="w-full h-full rounded-full object-cover border-2 border-[#0f172a]"
                        alt="Profile"
                      />
                    </div>
                  </button>

                  {/* DROPDOWN MENU */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl py-2 animate-fade-in overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-sm text-white font-bold truncate">{profile?.display_name || "User"}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>

                      <div className="py-2">
                        {isAdmin && (
                          <Link href="/admin" className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-300">
                            <Shield size={16}/> Admin Panel
                          </Link>
                        )}
                        <Link href={`/channel/${user.id}`} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                           <Tv size={16}/> My Channel
                        </Link>
                        <Link href="/user/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                           <LayoutDashboard size={16}/> Studio (Stats)
                        </Link>
                        <Link href="/account" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                           <Settings size={16}/> Account Settings
                        </Link>
                      </div>

                      <div className="border-t border-white/5 pt-2">
                        <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
                           <LogOut size={16}/> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MOBILE MENU BUTTON */}
            <div className="md:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-white p-2">
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
