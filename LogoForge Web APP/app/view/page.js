"use client";
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Download, Lock, Clock, X, ExternalLink, FileCode, Layers, Eye, Heart, Youtube, PlayCircle } from 'lucide-react';
import { forceDownload } from '@/lib/utils';
import VerificationBadge from '@/components/VerificationBadge';
import CommentSection from '@/components/CommentSection';
import AdBanner from '@/components/AdBanner'; // Ensure this component exists

export default function LogoViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  
  const viewCounted = useRef(false);
  
  const [logo, setLogo] = useState(null);
  const [user, setUser] = useState(null);
  const [relatedLogos, setRelatedLogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shortlink, setShortlink] = useState('');
  const [adBanner, setAdBanner] = useState('');
  
  // Interactions
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // Modals
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showWaitModal, setShowWaitModal] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');

  useEffect(() => {
    checkUser();
    fetchSettings();
    if (id) {
      fetchLogo();
      fetchRelated();
      checkLikeStatus();
      if (!viewCounted.current) {
        supabase.rpc('increment_view', { row_id: id });
        viewCounted.current = true;
      }
    }
  }, [id]);

  // Wait Timer Logic
  useEffect(() => {
    let timer;
    if (showWaitModal && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && showWaitModal) {
      // Timer finished, trigger download
      window.open(downloadUrl, '_blank');
      if(downloadName.endsWith('.plp')) forceDownload(downloadUrl, downloadName);
      setShowWaitModal(false);
      setCountdown(10); // Reset
    }
    return () => clearTimeout(timer);
  }, [showWaitModal, countdown]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*');
    if(data) {
        setShortlink(data.find(k => k.key === 'shortlink_url')?.value);
        setAdBanner(data.find(k => k.key === 'ad_banner_html')?.value);
    }
  }

  async function fetchLogo() {
    const { data } = await supabase.from('logos').select('*, profiles(*)').eq('id', id).single();
    setLogo(data);
    
    // Fetch Likes Count
    const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('logo_id', id);
    setLikes(count || 0);
    setLoading(false);
  }

  async function fetchRelated() {
    // Get logo category first (requires fetchLogo to finish, or chain promises. 
    // Simpler: fetch specific logo first, then use its category)
    if(!logo) return; // Will re-run when logo is set
  }
  // Better Related Fetcher inside useEffect dependency on 'logo'
  useEffect(() => {
      if(logo) {
          supabase.from('logos')
            .select('*')
            .eq('category', logo.category)
            .neq('id', logo.id)
            .eq('status', 'approved')
            .limit(4)
            .then(({data}) => setRelatedLogos(data || []));
      }
  }, [logo]);

  async function checkLikeStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && id) {
      const { data } = await supabase.from('likes').select('*').eq('user_id', user.id).eq('logo_id', id).single();
      if (data) setIsLiked(true);
    }
  }

  async function toggleLike() {
    if (!user) return alert("Login to like!");
    
    if (isLiked) {
      setLikes(p => p - 1); setIsLiked(false);
      await supabase.from('likes').delete().eq('user_id', user.id).eq('logo_id', id);
    } else {
      setLikes(p => p + 1); setIsLiked(true);
      await supabase.from('likes').insert({ user_id: user.id, logo_id: id });
    }
  }

  const initiateDownload = (url, name, isPremium = false) => {
    // 1. Check Login
    if (!user) {
        if(confirm("Login required. Go to login?")) router.push('/auth');
        return;
    }

    // 2. Check Token (Premium Only)
    if (isPremium && shortlink && shortlink.length > 5) {
        const token = localStorage.getItem('download_token');
        const expiry = parseInt(token || '0');
        if (Date.now() > expiry) {
            setShowTokenModal(true);
            return;
        }
    }

    // 3. Start Wait Timer (Ad View)
    setDownloadUrl(url);
    setDownloadName(name);
    setShowWaitModal(true);
    
    // 4. Track Stat
    supabase.rpc('increment_download_count', { row_id: id });
    supabase.from('user_downloads').insert({ user_id: user.id, logo_id: id });
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Loading...</div>;
  if (!logo) return <div className="min-h-screen bg-[#0f172a] text-white text-center pt-20">Not Found</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-20 animate-fade-in">
      <Navbar />
      
      {/* WAIT TIMER MODAL */}
      {showWaitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Preparing Download...</h2>
              <div className="text-5xl font-black text-primary mb-4">{countdown}</div>
              <p className="text-slate-500 mb-4">Please wait while we generate your secure link.</p>
              
              {/* Ad Inside Modal */}
              <div className="bg-slate-100 p-2 rounded-xl mb-4 min-h-[150px] flex items-center justify-center border border-slate-200">
                 <AdBanner code={adBanner} />
                 {!adBanner && <span className="text-slate-400 text-xs">Advertisement</span>}
              </div>
              
              <button onClick={() => setShowWaitModal(false)} className="text-slate-400 underline text-xs">Cancel</button>
           </div>
        </div>
      )}

      {/* TOKEN MODAL */}
      {showTokenModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center text-slate-900">
            <button onClick={() => setShowTokenModal(false)} className="absolute top-4 right-4 text-slate-400"><X size={24} /></button>
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Clock size={32} /></div>
            <h2 className="text-2xl font-bold mb-2">Premium Asset</h2>
            <p className="text-slate-500 mb-6">Generate a free token to unlock PLP/XML files for 1 hour.</p>
            <a href={shortlink} target="_blank" onClick={() => setShowTokenModal(false)} className="flex items-center justify-center gap-2 w-full bg-primary text-white py-4 rounded-xl font-bold hover:brightness-110 shadow-lg">
              Generate Token <ExternalLink size={20} />
            </a>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 lg:p-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT: IMAGE */}
          <div className="lg:w-2/3">
            <div className="bg-black/30 rounded-3xl border border-white/10 p-8 flex items-center justify-center relative overflow-hidden group mb-8">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                <img src={logo.url_png} className="max-w-full max-h-[500px] object-contain drop-shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-105" />
            </div>

            {/* LIKE & STATS BAR */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={toggleLike} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition ${isLiked ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                    <Heart size={20} className={isLiked ? "fill-current" : ""}/> {likes} Likes
                </button>
                <div className="flex gap-4 text-slate-400 text-sm font-mono">
                    <span className="flex items-center gap-1"><Eye size={16}/> {logo.views}</span>
                    <span className="flex items-center gap-1"><Download size={16}/> {logo.downloads}</span>
                </div>
            </div>

            {/* DESCRIPTION & YOUTUBE */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8">
               <h2 className="text-xl font-bold mb-4">{logo.title}</h2>
               <p className="text-slate-300 leading-relaxed whitespace-pre-line mb-6">{logo.description || "No description."}</p>
               
               {logo.youtube_url && (
                 <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2 text-red-400 font-bold"><Youtube size={20}/> Tutorial Available</div>
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                       <iframe 
                         width="100%" height="100%" 
                         src={`https://www.youtube.com/embed/${logo.youtube_url.split('v=')[1]?.split('&')[0]}`} 
                         allowFullScreen 
                         className="border-none"
                       />
                    </div>
                 </div>
               )}
            </div>

            {/* COMMENTS */}
            <CommentSection logoId={id} user={user} />
          </div>

          {/* RIGHT: SIDEBAR */}
          <div className="lg:w-1/3 space-y-6">
             
             {/* CREATOR */}
             <Link href={`/channel/${logo.uploader_id}`} className="block bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition group">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-primary to-purple-500">
                      <img src={logo.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${logo.profiles?.display_name}`} className="w-full h-full rounded-full border-2 border-[#0f172a] object-cover" />
                   </div>
                   <div>
                      <p className="text-xs text-slate-400 uppercase font-bold">Created by</p>
                      <div className="flex items-center gap-1">
                         <span className="font-bold text-lg text-white group-hover:text-primary transition">{logo.profiles?.display_name}</span>
                         <VerificationBadge role={logo.profiles?.role} isVerified={logo.profiles?.is_verified} />
                      </div>
                   </div>
                </div>
             </Link>

             {/* DOWNLOADS */}
             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-3">
                <h3 className="font-bold text-slate-300 mb-2">Download Options</h3>
                
                <button onClick={() => initiateDownload(logo.url_png, `${logo.title}.png`, false)} className="w-full flex items-center justify-between px-5 py-4 bg-white text-slate-900 rounded-xl font-bold hover:scale-[1.02] transition shadow-lg">
                   <span className="flex items-center gap-2"><Download size={20}/> PNG Image</span>
                   <span className="text-[10px] bg-slate-200 px-2 py-1 rounded uppercase font-bold">Free</span>
                </button>

                {logo.url_plp && (
                  <button onClick={() => initiateDownload(logo.url_plp, `${logo.title.replace(/\s/g,'_')}.plp`, true)} className="w-full flex items-center justify-between px-5 py-4 bg-primary text-white rounded-xl font-bold hover:scale-[1.02] transition shadow-lg shadow-primary/20">
                     <span className="flex items-center gap-2"><Layers size={20}/> Project (.PLP)</span>
                     {user ? <span className="text-[10px] bg-white/20 px-2 py-1 rounded">Premium</span> : <Lock size={16}/>}
                  </button>
                )}

                {logo.url_xml && (
                  <button onClick={() => initiateDownload(logo.url_xml, `${logo.title.replace(/\s/g,'_')}.xml`, true)} className="w-full flex items-center justify-between px-5 py-4 bg-purple-600 text-white rounded-xl font-bold hover:scale-[1.02] transition shadow-lg shadow-purple-600/20">
                     <span className="flex items-center gap-2"><FileCode size={20}/> Vector (.XML)</span>
                     {user ? <span className="text-[10px] bg-white/20 px-2 py-1 rounded">Premium</span> : <Lock size={16}/>}
                  </button>
                )}
             </div>

             {/* RELATED ASSETS */}
             <div>
                <h3 className="font-bold text-slate-300 mb-4">More Like This</h3>
                <div className="grid grid-cols-2 gap-3">
                   {relatedLogos.map((rel) => (
                      <Link key={rel.id} href={`/view?id=${rel.id}`}>
                         <div className="aspect-square bg-black/20 rounded-xl border border-white/5 p-3 flex items-center justify-center hover:border-primary/50 transition cursor-pointer">
                            <img src={rel.url_png} className="w-full h-full object-contain" />
                         </div>
                      </Link>
                   ))}
                </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}
