"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Search, Download, Star, ArrowRight, Zap } from 'lucide-react';
import SocialPopup from '@/components/SocialPopup';
import Maintenance from '@/components/Maintenance';

export default function Home() {
  const [logos, setLogos] = useState([]);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState({
    hero_title: 'Design Your Brand, Instantly.',
    hero_subtitle: 'Access thousands of premium assets.',
    site_name: 'LogoForge'
  });
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    // 1. Get User Role
    const { data: { user } } = await supabase.auth.getUser();
    let admin = false;
    if (user) {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (data?.role === 'admin') admin = true;
    }

    // 2. Get Settings
    const { data: settingsData } = await supabase.from('settings').select('*');
    const config = {};
    if (settingsData) settingsData.forEach(item => config[item.key] = item.value);
    setSettings(prev => ({ ...prev, ...config }));

    // 3. Maintenance Check
    if (config.maintenance_mode === 'true' && !admin) {
      setMaintenance(true);
      setLoading(false);
      return;
    }

    // 4. Get Logos
    let query = supabase.from('logos').select('*').order('created_at', { ascending: false });
    const { data: logoData } = await query;
    if (logoData) setLogos(logoData);
    setLoading(false);
  }

  async function handleSearch() {
    let query = supabase.from('logos').select('*').order('created_at', { ascending: false });
    if (search) query = query.ilike('title', `%${search}%`);
    const { data } = await query;
    if (data) setLogos(data);
  }

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (maintenance) return <Maintenance />;

  return (
    <main className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      {settings && <SocialPopup settings={settings} />}

      {/* MODERN HERO SECTION */}
      <div className="relative pt-20 pb-32 px-4 overflow-hidden bg-white">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
           <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
           <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wide mb-6">
            <Zap size={14} className="fill-blue-600"/> #1 Source for Designers
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
            {settings.hero_title}
          </h1>
          
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            {settings.hero_subtitle}
          </p>
          
          {/* Modern Search Bar */}
          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-0 bg-blue-600 rounded-full blur opacity-20 group-hover:opacity-30 transition"></div>
            <div className="relative flex items-center bg-white rounded-full shadow-xl p-2 border border-slate-100">
              <div className="pl-4 text-slate-400"><Search size={24} /></div>
              <input 
                type="text" 
                placeholder="Search assets (e.g. 'Gaming', '3D')..." 
                className="w-full p-3 bg-transparent outline-none text-lg text-slate-800 placeholder:text-slate-400"
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold hover:bg-slate-800 transition">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TRENDING GRID */}
      <div className="max-w-7xl mx-auto p-6 sm:p-10 -mt-20 relative z-20">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600"><Star size={20} className="fill-yellow-600" /></div>
          <h2 className="text-2xl font-bold text-slate-800">Fresh Uploads</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {logos.map((logo) => (
            <Link key={logo.id} href={`/view?id=${logo.id}`}>
              <div className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 overflow-hidden cursor-pointer h-full flex flex-col">
                
                {/* Image Area */}
                <div className="h-56 bg-slate-50 flex items-center justify-center p-8 relative overflow-hidden">
                   {/* Grid Pattern Background */}
                   <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px]"></div>
                   <img src={logo.url_png} alt={logo.title} className="h-full w-full object-contain relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
                </div>

                {/* Content Area */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-1">{logo.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded uppercase tracking-wider">
                        {logo.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-400">{new Date(logo.created_at).toLocaleDateString()}</span>
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
