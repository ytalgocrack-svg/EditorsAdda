"use client";
import { useEffect, useState, Suspense, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Download, Lock, Clock, X, ExternalLink, 
  FileCode, Layers, Eye, CheckCircle, User 
} from 'lucide-react';
import { forceDownload } from '@/lib/utils'; // Ensure you have this helper file

function LogoViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  
  // Ref to prevent double-counting in React Strict Mode
  const viewCounted = useRef(false);
  
  const [logo, setLogo] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shortlink, setShortlink] = useState('');
  const [showTokenModal, setShowTokenModal] = useState(false);

  useEffect(() => {
    checkUser();
    fetchSettings();
    if (id) {
      fetchLogo();
      // Increment View Count (Once per session load)
      if (!viewCounted.current) {
        supabase.rpc('increment_view', { row_id: id });
        viewCounted.current = true;
      }
    }
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
    // JOIN with profiles table to get Creator Info (Avatar, Name)
    const { data, error } = await supabase
      .from('logos')
      .select('*, profiles(id, display_name, avatar_url, email)')
      .eq('id', id)
      .single();

    if (error) console.error("Error fetching logo:", error);
    setLogo(data);
    setLoading(false);
  }

  async function trackDownload(type) {
    // 1. Increment Public Counter (Realtime Stats)
    await supabase.rpc('increment_download_count', { row_id: logo.id });

    // 2. Track Specific User History (if logged in)
    if (user) {
      await supabase.from('user_downloads').insert({
        user_id: user.id,
        logo_id: logo.id
      });
    }
    
    // Refresh local data to show new count
    fetchLogo(); 
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
      if(confirm("Login required to download source files. Go to login?")) router.push('/auth');
      return;
    }

    if (shortlink && shortlink.length > 5) {
      if (!checkTokenValidity()) {
        setShowTokenModal(true);
        return;
      }
    }

    trackDownload();
    forceDownload(url, filename);
  };

  const handleFreeDownload = (url) => {
    trackDownload();
    window.open(url, '_blank');
  }

  if (loading) return <div className="min-h-screen bg-[#0f172a] pt-20 text-center text-white flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!logo) return <div className="min-h-screen bg-[#0f172a] pt-20 text-center text-white">Logo not found or deleted.</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Navbar />
      
      {/* TOKEN MODAL */}
      {showTokenModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative animate-bounce-in text-slate-900">
            <button onClick={() => setShowTokenModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X size={24} /></button>
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Clock size={32} /></div>
            <h2 className="text-2xl font-bold mb-2">Token Required</h2>
            <p className="text-slate-500 mb-6">Generate a token to access Premium files for 1 hour. This helps keep the server free.</p>
            <a href={shortlink} target="_blank" onClick={() => setShowTokenModal(false)} className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition">
              Generate Token <ExternalLink size={20} />
            </a>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 lg:p-12">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
          
          {/* LEFT: IMAGE PREVIEW */}
          <div className="lg:w-1/2 bg-black/30 p-10 flex items-center justify-center relative overflow-hidden group">
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            <img 
              src={logo.url_png} 
              alt={logo.title} 
              className="max-w-full max-h-[500px] object-contain drop-shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-500" 
            />
          </div>

          {/* RIGHT: DETAILS & DOWNLOAD */}
          <div className="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                 <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(var(--primary),0.3)]">
                    {logo.category}
                 </span>
                 <div className="flex items-center gap-4 text-slate-400 text-xs font-mono">
                    <span className="flex items-center gap-1"><Eye size={14}/> {logo.views}</span>
                    <span className="flex items-center gap-1"><Download size={14}/> {logo.downloads}</span>
                 </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">{logo.title}</h1>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <Clock size={14}/> Uploaded on {new Date(logo.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* CREATOR CARD (NEW) */}
            <Link href={/channel/{logo.uploader_id}} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition mb-8 group cursor-pointer">
               <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-primary to-purple-500">
                 <img 
                   src={logo.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${logo.profiles?.email || 'User'}`} 
                   className="w-full h-full rounded-full object-cover border-2 border-[#0f172a]"
                 />
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Created by</p>
                  <p className="text-white font-bold text-lg group-hover:text-primary transition">{logo.profiles?.display_name || logo.profiles?.email?.split('@')[0] || 'Anonymous'}</p>
               </div>
               <ExternalLink size={18} className="ml-auto text-slate-600 group-hover:text-white transition"/>
            </Link>

            {/* DESCRIPTION */}
            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 mb-8">
              <h3 className="font-bold text-slate-200 mb-2 text-sm uppercase tracking-wide">Description</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{logo.description || "No description provided by the creator."}</p>
            </div>

            {/* DOWNLOAD BUTTONS */}
            <div className="space-y-3">
              <button onClick={() => handleFreeDownload(logo.url_png)} className="w-full flex items-center justify-between px-6 py-4 bg-white text-slate-900 rounded-xl hover:bg-slate-200 transition font-bold shadow-lg">
                <span className="flex items-center gap-2"><Download size={20}/> Download Image (PNG)</span>
                <span className="text-[10px] bg-slate-200 px-2 py-1 rounded font-bold uppercase tracking-wide">Free</span>
              </button>

              {logo.url_plp && (
                <button 
                  onClick={() => handleRestrictedDownload(logo.url_plp, `${logo.title.replace(/\s/g, '_')}.plp`)} 
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-xl transition border font-bold ${user ? 'bg-primary border-primary text-white hover:brightness-110 shadow-lg shadow-primary/20' : 'bg-transparent border-white/10 text-slate-500 cursor-not-allowed hover:border-white/20'}`}
                >
                  <span className="flex items-center gap-2"><Layers size={20}/> Download Project (.PLP)</span>
                  {!user && <Lock size={16}/>}
                </button>
              )}

              {logo.url_xml && (
                <button 
                  onClick={() => handleRestrictedDownload(logo.url_xml, `${logo.title.replace(/\s/g, '_')}.xml`)} 
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-xl transition border font-bold ${user ? 'bg-purple-600 border-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20' : 'bg-transparent border-white/10 text-slate-500 cursor-not-allowed hover:border-white/20'}`}
                >
                  <span className="flex items-center gap-2"><FileCode size={20}/> Get Vector (.XML)</span>
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
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading Asset...</div>}>
      <LogoViewContent />
    </Suspense>
  );
}
