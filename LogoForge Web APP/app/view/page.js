"use client";
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useSearchParams, useRouter } from 'next/navigation';
import { Download, Lock, AlertCircle } from 'lucide-react';

function LogoViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id'); // Get ID from URL (?id=123)
  const router = useRouter();
  const [logo, setLogo] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    if (id) fetchLogo();
  }, [id]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function fetchLogo() {
    const { data, error } = await supabase.from('logos').select('*').eq('id', id).single();
    if (error) console.error(error);
    setLogo(data);
    setLoading(false);
  }

  const handleRestrictedDownload = (url) => {
    if (!user) {
      if(confirm("You must be logged in to download source files. Login now?")) {
        router.push('/auth');
      }
    } else {
      window.open(url, '_blank');
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 pt-20 text-center">Loading Asset...</div>;
  if (!logo) return <div className="min-h-screen bg-slate-50 pt-20 text-center">Logo not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          
          <div className="md:w-1/2 bg-slate-100 p-10 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
            <img src={logo.url_png} alt={logo.title} className="max-w-full max-h-[500px] object-contain drop-shadow-2xl relative z-10" />
          </div>

          <div className="md:w-1/2 p-10 flex flex-col justify-center">
            <div className="mb-6">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">{logo.category}</span>
              <h1 className="text-4xl font-extrabold text-slate-900 mt-4 mb-2">{logo.title}</h1>
              <p className="text-slate-500">Uploaded on {new Date(logo.created_at).toDateString()}</p>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-8">
              <h3 className="font-bold text-slate-800 mb-2">Description</h3>
              <p className="text-slate-600 leading-relaxed">{logo.description || "No description provided."}</p>
            </div>

            <h3 className="font-bold text-slate-900 mb-4">Download Assets</h3>
            <div className="space-y-3">
              <button onClick={() => window.open(logo.url_png, '_blank')} className="w-full flex items-center justify-between px-6 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">
                <span className="flex items-center gap-2 font-bold"><Download size={20}/> Download PNG</span>
                <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">Free</span>
              </button>

              {logo.url_plp && (
                <button onClick={() => handleRestrictedDownload(logo.url_plp)} className={`w-full flex items-center justify-between px-6 py-4 rounded-xl transition border-2 ${user ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>
                  <span className="flex items-center gap-2 font-bold"><Download size={20}/> Download .PLP</span>
                  {!user && <Lock size={16} className="text-blue-500"/>}
                </button>
              )}

              {logo.url_xml && (
                <button onClick={() => handleRestrictedDownload(logo.url_xml)} className={`w-full flex items-center justify-between px-6 py-4 rounded-xl transition border-2 ${user ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}>
                  <span className="flex items-center gap-2 font-bold"><Download size={20}/> Download .XML</span>
                  {!user && <Lock size={16} className="text-emerald-500"/>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LogoView() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading Page...</div>}>
      <LogoViewContent />
    </Suspense>
  );
}
