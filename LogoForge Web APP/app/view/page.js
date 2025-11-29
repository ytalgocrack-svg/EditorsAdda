"use client";
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useSearchParams, useRouter } from 'next/navigation';
import { Download, Lock, Clock, X, ExternalLink, FileCode, Layers } from 'lucide-react';
import { forceDownload } from '@/lib/utils'; 

function LogoViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  
  const [logo, setLogo] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shortlink, setShortlink] = useState('');
  const [showTokenModal, setShowTokenModal] = useState(false);

  useEffect(() => {
    checkUser();
    fetchSettings();
    if (id) fetchLogo();
  }, [id]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').eq('key', 'shortlink_url').single();
    if (data) setShortlink(data.value);
  }

  async function fetchLogo() {
    const { data } = await supabase.from('logos').select('*').eq('id', id).single();
    setLogo(data);
    setLoading(false);
  }

  // --- NEW: Tracking Function ---
  async function trackDownload(type) {
    if (!user) return; // Don't track guests
    await supabase.from('user_downloads').insert({
      user_id: user.id,
      logo_id: logo.id
    });
  }

  const checkTokenValidity = () => {
    const token = localStorage.getItem('download_token');
    if (!token) return false;
    const expiry = parseInt(token);
    if (Date.now() > expiry) {
      localStorage.removeItem('download_token');
      return false;
    }
    return true;
  };

  const handleRestrictedDownload = (url, filename) => {
    if (!user) {
      if(confirm("Login required. Go to login?")) router.push('/auth');
      return;
    }

    if (shortlink && shortlink.length > 5) {
      if (!checkTokenValidity()) {
        setShowTokenModal(true);
        return;
      }
    }

    // Track and Download
    trackDownload();
    forceDownload(url, filename);
  };

  const handleFreeDownload = (url) => {
    trackDownload();
    window.open(url, '_blank');
  }

  if (loading) return <div className="min-h-screen bg-[#0f172a] pt-20 text-center text-white">Loading Asset...</div>;
  if (!logo) return <div className="min-h-screen bg-[#0f172a] pt-20 text-center text-white">Logo not found.</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Navbar />
      
      {/* TOKEN MODAL */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative animate-bounce-in text-slate-900">
            <button onClick={() => setShowTokenModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X size={24} /></button>
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Clock size={32} /></div>
            <h2 className="text-2xl font-bold mb-2">Token Required</h2>
            <p className="text-slate-500 mb-6">Generate a token to access Premium files for 1 hour.</p>
            <a href={shortlink} target="_blank" onClick={() => setShowTokenModal(false)} className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition">
              Generate Token <ExternalLink size={20} />
            </a>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          
          <div className="md:w-1/2 bg-black/20 p-10 flex items-center justify-center relative">
            <img src={logo.url_png} alt={logo.title} className="max-w-full max-h-[500px] object-contain drop-shadow-2xl" />
          </div>

          <div className="md:w-1/2 p-10 flex flex-col justify-center">
            <div className="mb-6">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">{logo.category}</span>
              <h1 className="text-4xl font-extrabold mt-4 mb-2">{logo.title}</h1>
              <p className="text-slate-400">Uploaded on {new Date(logo.created_at).toDateString()}</p>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8">
              <h3 className="font-bold text-slate-200 mb-2">Description</h3>
              <p className="text-slate-400 leading-relaxed">{logo.description || "No description provided."}</p>
            </div>

            <div className="space-y-3">
              <button onClick={() => handleFreeDownload(logo.url_png)} className="w-full flex items-center justify-between px-6 py-4 bg-white text-slate-900 rounded-xl hover:bg-slate-200 transition font-bold">
                <span className="flex items-center gap-2"><Download size={20}/> Download PNG</span>
                <span className="text-xs bg-slate-200 px-2 py-1 rounded">Free</span>
              </button>

              {logo.url_plp && (
                <button onClick={() => handleRestrictedDownload(logo.url_plp, logo.title+'.plp')} className={`w-full flex items-center justify-between px-6 py-4 rounded-xl transition border font-bold ${user ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' : 'bg-transparent border-white/20 text-slate-400'}`}>
                  <span className="flex items-center gap-2"><Layers size={20}/> Download .PLP</span>
                  {!user && <Lock size={16}/>}
                </button>
              )}

              {logo.url_xml && (
                <button onClick={() => handleRestrictedDownload(logo.url_xml, logo.title+'.xml')} className={`w-full flex items-center justify-between px-6 py-4 rounded-xl transition border font-bold ${user ? 'bg-purple-600 border-purple-600 text-white hover:bg-purple-700' : 'bg-transparent border-white/20 text-slate-400'}`}>
                  <span className="flex items-center gap-2"><FileCode size={20}/> Get .XML</span>
                  {!user && <Lock size={16}/>}
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
    <Suspense fallback={<div className="p-10 text-center text-white">Loading...</div>}>
      <LogoViewContent />
    </Suspense>
  );
}
