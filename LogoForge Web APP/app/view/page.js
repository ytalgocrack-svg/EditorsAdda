"use client";
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useSearchParams, useRouter } from 'next/navigation';
import { Download, Lock, AlertCircle, Clock, X, ExternalLink } from 'lucide-react';

function LogoViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  
  const [logo, setLogo] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shortlink, setShortlink] = useState('');
  
  // Modal State
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
    const { data, error } = await supabase.from('logos').select('*').eq('id', id).single();
    if (error) console.error(error);
    setLogo(data);
    setLoading(false);
  }

  const checkTokenValidity = () => {
    const token = localStorage.getItem('download_token');
    if (!token) return false;
    
    const expiry = parseInt(token);
    if (Date.now() > expiry) {
      localStorage.removeItem('download_token'); // Expired
      return false;
    }
    return true; // Valid
  };

  const handleRestrictedDownload = (url) => {
    // 1. Check Login
    if (!user) {
      if(confirm("You must be logged in to download source files. Login now?")) {
        router.push('/auth');
      }
      return;
    }

    // 2. Check Token (If shortlink is configured by admin)
    if (shortlink && shortlink.length > 5) {
      const hasValidToken = checkTokenValidity();
      if (!hasValidToken) {
        setShowTokenModal(true);
        return;
      }
    }

    // 3. Download
    window.open(url, '_blank');
  };

  if (loading) return <div className="min-h-screen bg-slate-50 pt-20 text-center">Loading Asset...</div>;
  if (!logo) return <div className="min-h-screen bg-slate-50 pt-20 text-center">Logo not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* TOKEN MODAL */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative animate-bounce-in">
            <button onClick={() => setShowTokenModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800">
              <X size={24} />
            </button>
            
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Token Required</h2>
            <p className="text-slate-500 mb-6">
              To keep this site free, we require a temporary token to download Premium files (PLP/XML).
            </p>
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-blue-800">Token Validity: <span className="text-blue-600">1 Hour</span></p>
            </div>

            <a 
              href={shortlink} 
              target="_blank"
              onClick={() => setShowTokenModal(false)} // Close modal so they can download when they return
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition"
            >
              Generate Token <ExternalLink size={20} />
            </a>
            <p className="text-xs text-slate-400 mt-4">After generating, come back here to download.</p>
          </div>
        </div>
      )}

      {/* Main Content */}
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
