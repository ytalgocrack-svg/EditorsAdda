"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Search, Download } from 'lucide-react';

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
    <main>
      {/* Navbar */}
      <nav className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">LogoForge</h1>
        <div className="space-x-4">
          <Link href="/upload" className="text-sm font-semibold hover:text-blue-600">Upload (Admin)</Link>
          <Link href="/auth" className="bg-blue-600 text-white px-4 py-2 rounded">Login</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-16 px-4 bg-white">
        <h2 className="text-4xl font-extrabold mb-4">Your Free Logo, Instantly.</h2>
        <p className="text-gray-500 mb-8">Download PLP, XML, and PNG files for easy editing.</p>
        <div className="max-w-md mx-auto relative">
          <input 
            type="text" 
            placeholder="Search logos..." 
            className="w-full p-3 pl-10 border rounded-lg"
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogos()}
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {logos.map((logo) => (
          <div key={logo.id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              <img src={logo.url_png} alt={logo.title} className="h-full object-contain p-2" />
            </div>
            <div className="p-4">
              <h3 className="font-bold">{logo.title}</h3>
              <p className="text-xs text-gray-500 uppercase">{logo.category}</p>
              <div className="mt-4 flex gap-2">
                <a href={logo.url_png} target="_blank" className="flex-1 bg-gray-900 text-white text-xs py-2 rounded text-center">PNG</a>
                {logo.url_plp && <a href={logo.url_plp} target="_blank" className="flex-1 bg-blue-600 text-white text-xs py-2 rounded text-center">PLP</a>}
                {logo.url_xml && <a href={logo.url_xml} target="_blank" className="flex-1 bg-purple-600 text-white text-xs py-2 rounded text-center">XML</a>}
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}