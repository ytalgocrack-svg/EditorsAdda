"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Search, Download, Star } from 'lucide-react';

export default function Home() {
  const [logos, setLogos] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogos();
  }, []);

  async function fetchLogos() {
    let query = supabase.from('logos').select('*').order('created_at', { ascending: false });
    if (search) query = query.ilike('title', `%${search}%`);
    const { data } = await query;
    if (data) setLogos(data);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-slate-900 py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none"></div>
        <h1 className="text-5xl font-extrabold text-white mb-6 relative z-10">
          Design Your Brand, <span className="text-blue-400">Instantly.</span>
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto relative z-10">
          Access thousands of premium PLP, XML, and PNG assets. Free for everyone.
        </p>
        
        <div className="max-w-xl mx-auto relative z-10">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search for logos (e.g. 'Gaming', 'Abstract')..." 
              className="w-full p-4 pl-12 rounded-full border-none shadow-2xl focus:ring-2 focus:ring-blue-500 bg-white/95 backdrop-blur text-lg"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogos()}
            />
            <Search className="absolute left-4 top-4 text-gray-400" size={24} />
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="max-w-7xl mx-auto p-6 sm:p-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Star className="text-yellow-500 fill-yellow-500" /> Trending Logos
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {logos.map((logo) => (
           <Link key={logo.id} href={/view?id=${logo.id}}>
              <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden cursor-pointer h-full flex flex-col">
                <div className="h-56 bg-slate-100 flex items-center justify-center p-6 relative">
                   <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
                   <img src={logo.url_png} alt={logo.title} className="h-full w-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 mb-1">{logo.title}</h3>
                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-md">
                      {logo.category}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
                    <span>{new Date(logo.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 text-blue-600 font-medium group-hover:underline">
                      View <Download size={14} />
                    </span>
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

