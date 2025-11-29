"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { 
  Trash2, Edit, ExternalLink, Users, Image as ImageIcon, 
  Settings, Save, ToggleLeft, ToggleRight, Layout, Megaphone, 
  Type, Link as LinkIcon, AlertTriangle, CheckCircle, 
  Send, Code, ShieldAlert, Check, X
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  
  // -- STATE MANAGEMENT --
  const [activeTab, setActiveTab] = useState('overview'); 
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Data State
  const [stats, setStats] = useState({ logos: 0, users: 0, pending: 0 });
  const [logos, setLogos] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingLogos, setPendingLogos] = useState([]);
  
  // Settings State (Initialized with defaults)
  const [settings, setSettings] = useState({
    maintenance_mode: 'false',
    popup_enabled: 'true',
    youtube_link: '',
    shortlink_url: '',
    site_name: 'LogoForge',
    hero_title: 'Design Your Brand.',
    hero_subtitle: 'Premium assets for creators.',
    announcement_text: '',
    announcement_enabled: 'false',
    ad_script_head: '',
    ad_script_body: '',
    ad_banner_html: '',
    // Telegram Channels (1-5)
    telegram_label_1: '', telegram_link_1: '',
    telegram_label_2: '', telegram_link_2: '',
    telegram_label_3: '', telegram_link_3: '',
    telegram_label_4: '', telegram_link_4: '',
    telegram_label_5: '', telegram_link_5: '',
  });

  // -- INITIALIZATION --
  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/');
    
    // Check Role
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (data?.role !== 'admin') return router.push('/');
    
    // Load All Data
    await Promise.all([fetchLogos(), fetchUsers(), fetchSettings(), fetchPendingLogos()]);
    setLoading(false);
  }

  // -- DATA FETCHERS --
  async function fetchLogos() {
    const { data, count } = await supabase.from('logos').select('*', { count: 'exact' }).eq('status', 'approved').order('created_at', { ascending: false });
    setLogos(data || []);
    setStats(prev => ({ ...prev, logos: count }));
  }

  async function fetchPendingLogos() {
    const { data, count } = await supabase.from('logos').select('*', { count: 'exact' }).eq('status', 'pending').order('created_at', { ascending: false });
    setPendingLogos(data || []);
    setStats(prev => ({ ...prev, pending: count }));
  }

  async function fetchUsers() {
    const { data, count } = await supabase.from('profiles').select('*', { count: 'exact' }).order('id', { ascending: true });
    setUsers(data || []);
    setStats(prev => ({ ...prev, users: count }));
  }

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const config = {};
      data.forEach(item => config[item.key] = item.value);
      setSettings(prev => ({ ...prev, ...config }));
    }
  }

  // -- ACTIONS --
  async function handleSaveSettings() {
    setSavingSettings(true);
    const updates = Object.keys(settings).map(key => ({ 
      key, 
      value: settings[key] || '' 
    }));
    
    const { error } = await supabase.from('settings').upsert(updates);
    
    if (error) alert("Error saving: " + error.message);
    else alert("Configuration Saved Successfully!");
    
    setSavingSettings(false);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this logo permanently?")) return;
    await supabase.from('logos').delete().eq('id', id);
    fetchLogos();
  }

  async function handleApprove(id) {
    await supabase.from('logos').update({ status: 'approved' }).eq('id', id);
    fetchPendingLogos();
    fetchLogos();
  }

  async function handleReject(id) {
    const reason = prompt("Enter rejection reason (optional):");
    await supabase.from('logos').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
    fetchPendingLogos();
  }

  async function toggleRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change role to ${newRole.toUpperCase()}?`)) return;
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    fetchUsers();
  }

  // -- RENDER --
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 md:p-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Admin Panel</h1>
            <p className="text-slate-500 text-sm">Manage content, users, and site configuration.</p>
          </div>
          <button 
            onClick={() => router.push('/upload')} 
            className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition flex justify-center items-center gap-2"
          >
            <ImageIcon size={20} /> Upload New Logo
          </button>
        </div>

        {/* NAVIGATION TABS (Scrollable) */}
        <div className="sticky top-0 z-10 bg-slate-50 pt-2 pb-4 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="flex gap-2 md:gap-4">
            {['overview', 'logos', 'moderation', 'users', 'settings'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)} 
                className={`px-5 py-2.5 rounded-full font-bold text-sm transition capitalize flex items-center gap-2 ${
                  activeTab === tab 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab === 'moderation' && pendingLogos.length > 0 && (
                   <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{pendingLogos.length}</span>
                )}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* --- TAB CONTENT --- */}
        
        {/* 1. OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 animate-slide-up">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
               <div><p className="text-slate-500 font-medium text-sm">Live Assets</p><h3 className="text-4xl font-extrabold text-blue-600">{stats.logos}</h3></div>
               <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><ImageIcon size={32} /></div>
             </div>
             
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
               <div><p className="text-slate-500 font-medium text-sm">Pending Review</p><h3 className="text-4xl font-extrabold text-orange-500">{stats.pending}</h3></div>
               <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><ShieldAlert size={32} /></div>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
               <div><p className="text-slate-500 font-medium text-sm">Total Users</p><h3 className="text-4xl font-extrabold text-purple-600">{stats.users}</h3></div>
               <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><Users size={32} /></div>
             </div>
          </div>
        )}

        {/* 2. LOGOS (Live) */}
        {activeTab === 'logos' && (
          <div className="animate-slide-up space-y-4">
            {logos.map(l => (
                <div key={l.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                  <img src={l.url_png} className="h-16 w-16 object-cover rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 w-full text-center md:text-left">
                    <h4 className="font-bold text-slate-800">{l.title}</h4>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase font-bold">{l.category}</span>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={() => window.open(`/view?id=${l.id}`, '_blank')} className="flex-1 md:flex-none p-2 bg-slate-100 rounded-lg hover:text-blue-600"><ExternalLink size={18}/></button>
                      <button onClick={() => router.push(`/admin/edit?id=${l.id}`)} className="flex-1 md:flex-none p-2 bg-slate-100 rounded-lg hover:text-orange-500"><Edit size={18}/></button>
                      <button onClick={() => handleDelete(l.id)} className="flex-1 md:flex-none p-2 bg-slate-100 rounded-lg hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
            ))}
          </div>
        )}

        {/* 3. MODERATION (Pending) */}
        {activeTab === 'moderation' && (
          <div className="animate-slide-up space-y-4">
             {pendingLogos.length === 0 ? (
               <div className="text-center p-10 text-slate-400">No pending uploads.</div>
             ) : (
               pendingLogos.map(l => (
                <div key={l.id} className="bg-white p-4 rounded-2xl shadow-sm border border-orange-200 bg-orange-50/10 flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative">
                    <img src={l.url_png} className="h-20 w-20 object-cover rounded-xl bg-slate-100" />
                    <span className="absolute -top-2 -left-2 bg-orange-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">Review</span>
                  </div>
                  <div className="flex-1 w-full text-center md:text-left">
                    <h4 className="font-bold text-slate-800">{l.title}</h4>
                    <p className="text-sm text-slate-500 mb-1">{l.description || "No description"}</p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded font-bold uppercase">{l.category}</span>
                        {l.url_plp && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">PLP</span>}
                        {l.url_xml && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">XML</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={() => handleApprove(l.id)} className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"><Check size={18}/> Approve</button>
                      <button onClick={() => handleReject(l.id)} className="flex-1 md:flex-none px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center justify-center gap-1"><X size={18}/> Reject</button>
                  </div>
                </div>
               ))
             )}
          </div>
        )}

        {/* 4. USERS */}
        {activeTab === 'users' && (
           <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-100 animate-slide-up">
             {users.map(u => (
               <div key={u.id} className="p-4 border-b last:border-0 flex items-center justify-between hover:bg-slate-50 transition">
                 <div className="min-w-0 pr-4">
                   <p className="font-bold text-slate-800 truncate">{u.email}</p>
                   <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                     {u.role}
                   </span>
                 </div>
                 <button onClick={() => toggleRole(u.id, u.role)} className="shrink-0 text-xs bg-slate-100 px-3 py-2 rounded-lg font-bold hover:bg-slate-200">
                   {u.role === 'admin' ? 'Demote' : 'Promote'}
                 </button>
               </div>
             ))}
           </div>
        )}

        {/* 5. SETTINGS */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
            
            {/* Visuals */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><Layout className="text-blue-600" size={20}/> Visuals</h3>
              <div className="space-y-3">
                <input className="w-full border p-3 rounded-xl text-sm" placeholder="Site Name" value={settings.site_name} onChange={e => setSettings({...settings, site_name: e.target.value})} />
                <input className="w-full border p-3 rounded-xl text-sm" placeholder="Hero Title" value={settings.hero_title} onChange={e => setSettings({...settings, hero_title: e.target.value})} />
                <input className="w-full border p-3 rounded-xl text-sm" placeholder="Hero Subtitle" value={settings.hero_subtitle} onChange={e => setSettings({...settings, hero_subtitle: e.target.value})} />
              </div>
            </div>

            {/* Announcement Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><Megaphone className="text-purple-600" size={20}/> Announcement</h3>
                 <button onClick={() => setSettings({...settings, announcement_enabled: settings.announcement_enabled === 'true' ? 'false' : 'true'})}>
                    {settings.announcement_enabled === 'true' ? <ToggleRight size={32} className="text-green-500"/> : <ToggleLeft size={32} className="text-slate-300"/>}
                 </button>
              </div>
              <input className="w-full border p-3 rounded-xl text-sm" placeholder="Notification Text" value={settings.announcement_text} onChange={e => setSettings({...settings, announcement_text: e.target.value})} />
            </div>

            {/* Ads & Scripts */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><Code className="text-slate-600" size={20}/> Ad Scripts (HTML)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea className="w-full border p-3 rounded-xl text-xs h-24 font-mono" placeholder="<head> Script (e.g. AdSense)" value={settings.ad_script_head} onChange={e => setSettings({...settings, ad_script_head: e.target.value})} />
                <textarea className="w-full border p-3 rounded-xl text-xs h-24 font-mono" placeholder="Banner Ad HTML code" value={settings.ad_banner_html} onChange={e => setSettings({...settings, ad_banner_html: e.target.value})} />
              </div>
            </div>

            {/* Links & Channels */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><Send className="text-blue-500" size={20}/> Telegram Channels (Max 5)</h3>
              
              <div className="space-y-3 mb-6 bg-blue-50 p-4 rounded-xl">
                 {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="flex gap-2">
                        <input className="w-1/3 border p-2 rounded text-sm" placeholder={`Label ${num}`} value={settings[`telegram_label_${num}`] || ''} onChange={e => setSettings({...settings, [`telegram_label_${num}`]: e.target.value})} />
                        <input className="w-2/3 border p-2 rounded text-sm" placeholder={`https://t.me/link_${num}`} value={settings[`telegram_link_${num}`] || ''} onChange={e => setSettings({...settings, [`telegram_link_${num}`]: e.target.value})} />
                    </div>
                 ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500">YouTube URL</label>
                    <input className="w-full border p-2 rounded-lg text-sm" value={settings.youtube_link} onChange={e => setSettings({...settings, youtube_link: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><AlertTriangle size={12} className="text-yellow-600"/> Shortlink (Monetization)</label>
                    <input className="w-full border border-yellow-300 bg-yellow-50 p-2 rounded-lg text-sm" value={settings.shortlink_url} onChange={e => setSettings({...settings, shortlink_url: e.target.value})} />
                 </div>
              </div>
            </div>

            {/* System Toggles */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-sm">Maintenance Mode</h4>
                 <button onClick={() => setSettings({...settings, maintenance_mode: settings.maintenance_mode === 'true' ? 'false' : 'true'})}>
                    {settings.maintenance_mode === 'true' ? <ToggleRight size={32} className="text-red-500"/> : <ToggleLeft size={32} className="text-slate-300"/>}
                 </button>
               </div>
               <div className="flex justify-between items-center">
                 <h4 className="font-bold text-sm">Social Popup</h4>
                 <button onClick={() => setSettings({...settings, popup_enabled: settings.popup_enabled === 'true' ? 'false' : 'true'})}>
                    {settings.popup_enabled === 'true' ? <ToggleRight size={32} className="text-green-500"/> : <ToggleLeft size={32} className="text-slate-300"/>}
                 </button>
               </div>
            </div>

            {/* Save Button */}
            <div className="lg:col-span-2 sticky bottom-4">
               <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 shadow-xl shadow-slate-900/20 flex justify-center items-center gap-2 transition transform active:scale-95">
                 {savingSettings ? "Saving..." : <><Save size={20} /> Save All Changes</>}
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
