"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Share2, LayoutGrid, UserPlus, UserCheck } from 'lucide-react';
import Footer from '@/components/Footer';

export default function ChannelPage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [logos, setLogos] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannel();
  }, [id]);

  async function fetchChannel() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    // 1. Get Profile
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', id).single();
    setProfile(profileData);

    // 2. Get Logos
    const { data: logoData } = await supabase.from('logos').select('*').eq('uploader_id', id).eq('status', 'approved').order('created_at', { ascending: false });
    setLogos(logoData || []);

    // 3. Follow Stats
    const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id);
    setFollowerCount(count || 0);

    // 4. Check status
    if (user) {
      const { data: followData } = await supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', id).single();
      if (followData) setIsFollowing(true);
    }
    setLoading(false);
  }

  const toggleFollow = async () => {
    if (!currentUser) return alert("Please login to follow.");
    
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', id);
      setFollowerCount(prev => prev - 1);
      setIsFollowing(false);
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: id });
      setFollowerCount(prev => prev + 1);
      setIsFollowing(true);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Copied link!");
  }

  if(loading) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Loading...</div>;
  if(!profile) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Channel Not Found</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Navbar />

      {/* Banner */}
      <div className="w-full h-40 md:h-64 bg-slate-800 relative">
        {profile.banner_url && <img src={profile.banner_url} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent opacity-90"></div>
      </div>

      {/* Info */}
      <div className="max-w-7xl mx-auto px-6 relative -mt-12 mb-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          
          <div className="w-32 h-32 rounded-full border-4 border-[#0f172a] bg-slate-700 overflow-hidden shadow-2xl shrink-0">
             <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.email}`} className="w-full h-full object-cover"/>
          </div>

          <div className="flex-1 pb-2">
            <h1 className="text-3xl font-bold">{profile.display_name || "Creator"}</h1>
            <div className="text-slate-400 text-sm flex gap-2 justify-center md:justify-start items-center mt-1">
               <span className="font-bold text-white">{followerCount}</span> followers • 
               <span>{logos.length} uploads</span>
            </div>
            <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto md:mx-0">{profile.bio}</p>
          </div>

          <div className="flex gap-3 pb-4">
             {currentUser?.id !== id && (
               <button onClick={toggleFollow} className={`px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition ${isFollowing ? 'bg-white/10 text-slate-300' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                 {isFollowing ? <><UserCheck size={18}/> Following</> : <><UserPlus size={18}/> Follow</>}
               </button>
             )}
             <button onClick={handleShare} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full font-bold text-sm"><Share2 size={18}/></button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {logos.map((logo) => (
              <Link key={logo.id} href={`/view?id=${logo.id}`}>
                <div className="group bg-white/5 rounded-xl border border-white/5 overflow-hidden hover:border-blue-500/50 transition">
                  <div className="aspect-square p-4 flex items-center justify-center bg-black/20">
                    <img src={logo.url_png} className="w-full h-full object-contain group-hover:scale-110 transition"/>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm truncate">{logo.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{new Date(logo.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
