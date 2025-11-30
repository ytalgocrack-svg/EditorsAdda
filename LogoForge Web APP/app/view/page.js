"use client";
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Download, Lock, Clock, X, ExternalLink, FileCode, Layers, Eye, Share2, Youtube, Heart } from 'lucide-react';
import { forceDownload } from '@/lib/utils';
import VerificationBadge from '@/components/VerificationBadge';
import CommentSection from '@/components/CommentSection';
import AdBanner from '@/components/AdBanner';

export default function LogoViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const viewCounted = useRef(false);
  
  const [logo, setLogo] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Settings & Modes
  const [monetizationMode, setMonetizationMode] = useState('share'); // 'share', 'shortlink', 'none'
  const [shortlink, setShortlink] = useState('');
  const [adBanner, setAdBanner] = useState('');
  
  // States
  const [hasShared, setHasShared] = useState(false);
  const [showModal, setShowModal] = useState(false); // Handles both Share & Token modal
  const [modalType, setModalType] = useState(''); // 'share' or 'token'

  useEffect(() => {
    checkUser();
    fetchSettings();
    if (id) {
      fetchLogo();
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
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      setShortlink(data.find(k => k.key === 'shortlink_url')?.value);
      setAdBanner(data.find(k => k.key === 'ad_banner_html')?.value);
      setMonetizationMode(data.find(k => k.key === 'monetization_mode')?.value || 'share');
    }
  }

  async function fetchLogo() {
    const { data } = await supabase.from('logos').select('*, profiles(*)').eq('id', id).single();
    setLogo(data);
    setLoading(false);
  }

  // --- DOWNLOAD LOGIC ---
  const initiateDownload = (url, name, isPremium) => {
    if(!user) return router.push('/auth');

    // 1. Check Viral Share Mode
    if (isPremium && monetizationMode === 'share' && !hasShared) {
       setModalType('share');
       setShowModal(true);
       return;
    }

    // 2. Check Shortlink Token Mode
    if (isPremium && monetizationMode === 'shortlink' && shortlink) {
        const token = localStorage.getItem('download_token');
        if (!token || Date.now() > parseInt(token)) {
            setModalType('token');
            setShowModal(true);
            return;
        }
    }

    // 3. Execute Download
    forceDownload(url, name);
    supabase.rpc('increment_download_count', { row_id: id });
    supabase.from('user_downloads').insert({ user_id: user.id, logo_id: id });
  };

  const handleShareToUnlock = () => {
    const text = `Check out ${logo.title} on EditorsAdda! ${window.location.href}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    
    setTimeout(() => {
      setHasShared(true);
      setShowModal(false);
      alert("Unlocked! Click download again.");
    }, 4000); // 4 second wait to simulate verification
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Loading...</div>;
  if (!logo) return <div className="min-h-screen bg-[#0f172a] text-white text-center pt-20">Not Found</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-20">
      <Navbar />
      
      {/* UNIFIED MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400"><X size={24} /></button>
              
              {modalType === 'share' ? (
                <>
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><Share2 size={32}/></div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Share to Unlock</h2>
                  <p className="text-slate-500 mb-6">Share this asset on WhatsApp to unlock the download link.</p>
                  <button onClick={handleShareToUnlock} className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold text-lg hover:brightness-110 shadow-xl flex items-center justify-center gap-2">
                     <Share2 size={24}/> Share on WhatsApp
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Clock size={32}/></div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Premium Access</h2>
                  <p className="text-slate-500 mb-6">Generate a free token to access premium files.</p>
                  <a href={shortlink} target="_blank" onClick={() => setShowModal(false)} className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl">
                    Generate Token <ExternalLink size={20} />
                  </a>
                </>
              )}
           </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 lg:p-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT: IMAGE & CONTENT */}
          <div className="lg:w-2/3">
            <div className="bg-black/30 rounded-3xl border border-white/10 p-8 flex items-center justify-center relative overflow-hidden mb-8">
                <img src={logo.url_png} className="max-w-full max-h-[500px] object-contain drop-shadow-2xl relative z-10" />
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8">
               <h2 className="text-xl font-bold mb-4">{logo.title}</h2>
               <p className="text-slate-300 leading-relaxed whitespace-pre-line mb-6">{logo.description}</p>
               
               {/* YouTube Embed */}
               {logo.youtube_url && (
                 <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2 text-red-400 font-bold"><Youtube size={20}/> Tutorial Available</div>
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                       <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${logo.youtube_url.split('v=')[1]?.split('&')[0]}`} allowFullScreen className="border-none"/>
                    </div>
                 </div>
               )}
            </div>

            {/* Comments Component */}
            <CommentSection logoId={id} user={user} />
          </div>

          {/* RIGHT: SIDEBAR */}
          <div className="lg:w-1/3 space-y-6">
             {/* Creator Info */}
             <Link href={`/channel/${logo.uploader_id}`} className="block bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition group">
                <div className="flex items-center gap-4">
                   <img src={logo.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${logo.profiles?.email}`} className="w-12 h-12 rounded-full border-2 border-[#0f172a] object-cover" />
                   <div>
                      <p className="text-xs text-slate-400 uppercase font-bold">Created by</p>
                      <div className="flex items-center gap-1">
                         <span className="font-bold text-lg text-white group-hover:text-blue-400 transition">{logo.profiles?.display_name || 'User'}</span>
                         <VerificationBadge role={logo.profiles?.role} isVerified={logo.profiles?.is_verified} />
                      </div>
                   </div>
                </div>
             </Link>

             {/* Downloads */}
             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-3">
                <h3 className="font-bold text-slate-300 mb-2">Downloads</h3>
                <button onClick={() => initiateDownload(logo.url_png, `${logo.title}.png`, false)} className="w-full flex items-center justify-between px-5 py-4 bg-white text-slate-900 rounded-xl font-bold hover:scale-[1.02] transition">
                   <span className="flex items-center gap-2"><Download size={20}/> PNG</span>
                   <span className="text-[10px] bg-slate-200 px-2 py-1 rounded font-bold">Free</span>
                </button>
                {logo.url_plp && (
                  <button onClick={() => initiateDownload(logo.url_plp, `${logo.title}.plp`, true)} className="w-full flex items-center justify-between px-5 py-4 bg-blue-600 text-white rounded-xl font-bold hover:scale-[1.02] transition">
                     <span className="flex items-center gap-2"><Layers size={20}/> PLP File</span>
                     <span className="text-[10px] bg-white/20 px-2 py-1 rounded font-bold">Premium</span>
                  </button>
                )}
             </div>
             
             {/* Ad Banner */}
             <AdBanner code={adBanner} />
          </div>
        </div>
      </div>
    </div>
  );
}
