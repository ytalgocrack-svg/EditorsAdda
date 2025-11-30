"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { Camera, Save, Lock, User, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function AccountSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  // Local state for immediate preview
  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    banner_url: ''
  });
  
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return router.push('/auth');
    setUser(user);

    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    
    if (data) {
      setProfile(data);
    } else if (error) {
      console.error("Error fetching profile:", error);
    }
    setLoading(false);
  }

  async function uploadImage(file) {
    // Generate a clean filename to prevent issues
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    // Upsert ensures we overwrite if needed, reducing errors
    const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
    
    if(error) throw error;
    
    // Get Public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSave() {
    setSaving(true);
    try {
      // 1. Update Profile in DB
      const { error } = await supabase.from('profiles').update({
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        banner_url: profile.banner_url
      }).eq('id', user.id);

      if(error) throw error;

      // 2. Update Password (if typed)
      if(newPassword.length > 0) {
        const { error: passError } = await supabase.auth.updateUser({ password: newPassword });
        if(passError) throw passError;
        alert("Password updated!");
      }

      alert("Profile Saved Successfully!");
      window.location.reload(); // Refresh to show changes in Navbar
    } catch (e) {
      alert("Error saving: " + e.message);
    }
    setSaving(false);
  }

  async function handleFileChange(e, type) {
    const file = e.target.files[0];
    if(!file) return;
    
    // Show loading state specifically for image
    const oldUrl = profile[type];
    setProfile(prev => ({ ...prev, [type]: null })); // Flash effect

    try {
      const url = await uploadImage(file);
      setProfile(prev => ({ ...prev, [type]: url }));
    } catch(e) {
      alert("Upload failed: " + e.message);
      setProfile(prev => ({ ...prev, [type]: oldUrl })); // Revert on fail
    }
  }

  if(loading) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Loading Settings...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-20">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 md:p-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center md:text-left">Channel Customization</h1>

        {/* Responsive Grid: 1 Column Mobile, 3 Columns Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: VISUALS (Banner & Avatar) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Avatar Card */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center shadow-lg">
              <div className="relative w-28 h-28 md:w-32 md:h-32 mx-auto mb-4 group">
                {profile.avatar_url ? (
                   <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover border-4 border-[#0f172a] shadow-xl" alt="Avatar" />
                ) : (
                   <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-xs">No Image</div>
                )}
                
                <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                   <Camera size={24} className="text-white"/>
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'avatar_url')} />
                </label>
              </div>
              <p className="text-sm font-bold text-slate-300">Profile Picture</p>
              <p className="text-xs text-slate-500 mt-1">Click image to change</p>
            </div>

            {/* Banner Card */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center shadow-lg">
              <div className="relative w-full h-24 bg-slate-800 rounded-lg mb-4 overflow-hidden group">
                 {profile.banner_url ? (
                   <img src={profile.banner_url} className="w-full h-full object-cover" alt="Banner" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">No Banner Set</div>
                 )}
                 <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                   <ImageIcon size={24} className="text-white"/>
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'banner_url')} />
                </label>
              </div>
              <p className="text-sm font-bold text-slate-300">Channel Banner</p>
              <p className="text-xs text-slate-500 mt-1">Recommended: 1500x500px</p>
            </div>
          </div>

          {/* RIGHT: DETAILS FORM */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl shadow-lg">
              
              {/* Display Name */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-400 mb-2">Channel Name</label>
                <div className="flex items-center gap-3 bg-black/20 border border-white/10 p-3 rounded-xl focus-within:border-blue-500 transition">
                  <User size={18} className="text-slate-500"/>
                  <input 
                    className="bg-transparent outline-none w-full text-white placeholder:text-slate-600" 
                    value={profile.display_name || ''} 
                    onChange={e => setProfile({...profile, display_name: e.target.value})}
                    placeholder="e.g. DesignPro" 
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-400 mb-2">Description / Bio</label>
                <textarea 
                  className="w-full bg-black/20 border border-white/10 p-3 rounded-xl outline-none text-white h-32 focus:border-blue-500 transition placeholder:text-slate-600" 
                  value={profile.bio || ''} 
                  onChange={e => setProfile({...profile, bio: e.target.value})}
                  placeholder="Tell people about your content..." 
                />
              </div>

              {/* Password */}
              <div className="mb-8 pt-6 border-t border-white/10">
                <label className="block text-sm font-bold text-slate-400 mb-2">Change Password (Optional)</label>
                <div className="flex items-center gap-3 bg-black/20 border border-white/10 p-3 rounded-xl focus-within:border-blue-500 transition">
                  <Lock size={18} className="text-slate-500"/>
                  <input 
                    type="password"
                    className="bg-transparent outline-none w-full text-white placeholder:text-slate-600" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password" 
                  />
                </div>
              </div>

              {/* Save Button */}
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={20}/>}
                {saving ? "Saving Changes..." : "Save Profile"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
