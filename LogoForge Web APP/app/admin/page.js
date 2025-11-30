"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { 
  Trash2, Edit, ExternalLink, Users, Image as ImageIcon, 
  Settings, Save, ToggleLeft, ToggleRight, Layout, Megaphone, 
  Link as LinkIcon, AlertTriangle, CheckCircle, 
  Send, Code, ShieldAlert, Check, X, Search, Layers, FileCode, Ban, Unlock
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  
  // -- UI STATE --
  const [activeTab, setActiveTab] = useState('overview'); 
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // -- DATA STATE --
  const [stats, setStats] = useState({ logos: 0, users: 0, pending: 0, banned: 0 });
  const [logos, setLogos] = useState([]);
  const [pendingLogos, setPendingLogos] = useState([]);
  const [users, setUsers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  
  // -- SETTINGS STATE --
  const [settings, setSettings] = useState({
    // System
    maintenance_mode: 'false',
    popup_enabled: 'true',
    // Visuals
    site_name: 'LogoForge',
    hero_title: 'Design Your Brand.',
    hero_subtitle: 'Premium assets for creators.',
    announcement_text: '',
    announcement_enabled: 'false',
    // Viral & Monetization (NEW)
    monetization_mode: 'shortlink', // options: 'share', 'shortlink', 'none'
    trending_tags: '',
    active_contest_title: '',
    active_contest_tag: '',
    // Community
    community_rules: '',
    // Ads (Adsterra/Google)
    ad_script_head: '',
    ad_banner_html: '',
    ad_native_code: '', // Adsterra Native
    ad_popunder_code: '', // Adsterra Popunder
    // Links
    shortlink_url: '',
    youtube_link: '',
    // Telegram
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
    
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (data?.role !== 'admin') return router.push('/');
    
    await Promise.all([
        fetchLogos(), 
        fetchPendingLogos(), 
        fetchUsers(), 
        fetchBannedUsers(),
        fetchSettings()
    ]);
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
    // Fetch users who are NOT blocked
    const { data, count } = await supabase.from('profiles').select('*', { count: 'exact' }).neq('status', 'blocked').order('id', { ascending: true });
    setUsers(data || []);
    setStats(prev => ({ ...prev, users: count }));
  }

  async function fetchBannedUsers() {
    const { data, count } = await supabase.from('profiles').select('*', { count: 'exact' }).eq('status', 'blocked');
    setBannedUsers(data || []);
    setStats(prev => ({ ...prev, banned: count }));
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
    const updates = Object.keys(settings).map(key => ({ key, value: settings[key] || '' }));
    const { error } = await supabase.from('settings').upsert(updates);
    if (error) alert("Error saving: " + error.message);
    else alert("Configuration Saved!");
    setSavingSettings(false);
  }

  async function handleApprove(id) {
    await supabase.from('logos').update({ status: 'approved' }).eq('id', id);
    fetchPendingLogos(); fetchLogos();
  }

  async function handleReject(id) {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    await supabase.from('logos').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
    fetchPendingLogos();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this logo permanently?")) return;
    await supabase.from('logos').delete().eq('id', id);
    fetchLogos();
  }

  // -- USER ACTIONS --
  async function handleBanUser(id) {
    if (!confirm("Are you sure you want to BAN this user? They will lose access.")) return;
    await supabase.from('profiles').update({ status: 'blocked' }).eq('id', id);
    fetchUsers();
    fetchBannedUsers();
  }

  async function handleUnblock(id) {
    if (!confirm("Unblock this user?")) return;
    await supabase.from('profiles').update({ status: 'active' }).eq('id', id);
    fetchUsers();
    fetchBannedUsers();
  }

  async function toggleRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change role to ${newRole.toUpperCase()}?`)) return;
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    fetchUsers();
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900 font-bold">Loading Panel...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">Control center for {settings.site_name}</p>
          </div>
          <button onClick={() => router.push('/upload')} className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
            <ImageIcon size={20}/> Upload Asset
          </button>
        </div>

        {/* TABS */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-4 scrollbar-hide">
          {['overview', 'logos', 'moderation', 'users', 'bans', 'settings'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)} 
              className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === tab ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              {tab === 'moderation' && pendingLogos.length > 0 && (
                 <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse">{pendingLogos.length}</span>
              )}
              {tab === 'bans' && bannedUsers.length > 0 && (
                 <span className="bg-slate-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{bannedUsers.length}</span>
              )}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* --- OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <p className="text-slate-500 font-bold text-xs uppercase">Live Assets</p><h3 className="text-3xl font-black text-blue-600">{stats.logos}</h3>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <p className="text-slate-500 font-bold text-xs uppercase">Pending Review</p><h3 className="text-3xl font-black text-orange-500">{stats.pending}</h3>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <p className="text-slate-500 font-bold text-xs uppercase">Active Users</p><h3 className="text-3xl font-black text-purple-600">{stats.users}</h3>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <p className="text-slate-500 font-bold text-xs uppercase">Banned Users</p><h3 className="text-3xl font-black text-red-600">{stats.banned}</h3>
             </div>
          </div>
        )}

        {/* --- LIVE LOGOS --- */}
        {activeTab === 'logos' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center bg-white border p-3 rounded-xl">
              <Search className="text-slate-400 mr-2"/>
              <input className="w-full outline-none text-sm" placeholder="Search logos..." onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {logos.filter(l => l.title.toLowerCase().includes(searchTerm.toLowerCase())).map(l => (
                <div key={l.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                  <img src={l.url_png} className="h-16 w-16 object-cover rounded-lg bg-slate-100 border" />
                  <div className="flex-1 w-full">
                    <h4 className="font-bold text-slate-900">{l.title}</h4>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold uppercase">{l.category}</span>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => window.open(`/view?id=${l.id}`, '_blank')} className="p-2 bg-slate-100 rounded-lg hover:text-blue-600"><ExternalLink size={18}/></button>
                      <button onClick={() => router.push(`/admin/edit?id=${l.id}`)} className="p-2 bg-slate-100 rounded-lg hover:text-orange-500"><Edit size={18}/></button>
                      <button onClick={() => handleDelete(l.id)} className="p-2 bg-slate-100 rounded-lg hover:text-red-600"><Trash2 size={18}/></button>
                  </div>
                </div>
            ))}
          </div>
        )}

        {/* --- MODERATION --- */}
        {activeTab === 'moderation' && (
          <div className="space-y-4 animate-fade-in">
             {pendingLogos.length === 0 && <div className="text-center p-10 text-slate-400 font-bold bg-white rounded-2xl border border-dashed">All caught up! No pending uploads.</div>}
             {pendingLogos.map(l => (
                <div key={l.id} className="bg-white p-4 rounded-xl shadow-sm border border-orange-200 flex flex-col md:flex-row gap-4">
                  <div className="relative shrink-0">
                    <img src={l.url_png} className="w-24 h-24 object-contain bg-slate-50 rounded-lg border" />
                    <span className="absolute top-0 left-0 bg-orange-500 text-white text-[10px] px-2 py-1 rounded-tl-lg font-bold">New</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-slate-900">{l.title}</h4>
                    <p className="text-sm text-slate-600 mb-2">{l.description}</p>
                    <div className="flex gap-2">
                       {l.url_plp && <a href={l.url_plp} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1 font-bold"><Layers size={12}/> PLP</a>}
                       {l.url_xml && <a href={l.url_xml} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1 font-bold"><FileCode size={12}/> XML</a>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 justify-center min-w-[120px]">
                      <button onClick={() => handleApprove(l.id)} className="bg-green-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700"><Check size={16}/> Approve</button>
                      <button onClick={() => handleReject(l.id)} className="bg-white border border-red-200 text-red-600 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-50"><X size={16}/> Reject</button>
                  </div>
                </div>
             ))}
          </div>
        )}

        {/* --- USERS --- */}
        {activeTab === 'users' && (
           <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden animate-fade-in">
             {users.map(u => (
               <div key={u.id} className="p-4 border-b last:border-0 flex items-center justify-between hover:bg-slate-50">
                 <div>
                   <p className="font-bold text-slate-900 text-sm">{u.email}</p>
                   <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}`}>{u.role}</span>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => toggleRole(u.id, u.role)} className="text-xs bg-slate-100 px-3 py-2 rounded-lg font-bold hover:bg-slate-200 border border-slate-300">
                     {u.role === 'admin' ? 'Demote' : 'Promote'}
                   </button>
                   <button onClick={() => handleBanUser(u.id)} className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg font-bold hover:bg-red-100 border border-red-200 flex items-center gap-1">
                     <Ban size={14}/> Ban
                   </button>
                 </div>
               </div>
             ))}
           </div>
        )}

        {/* --- BANS --- */}
        {activeTab === 'bans' && (
          <div className="space-y-4 animate-fade-in">
            {bannedUsers.length === 0 && <p className="text-center p-10 text-slate-500 font-bold">No banned users found.</p>}
            {bannedUsers.map(u => (
                <div key={u.id} className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-red-900">{u.email}</h4>
                    <p className="text-xs text-red-700 uppercase font-bold">Status: Blocked</p>
                  </div>
                  <button onClick={() => handleUnblock(u.id)} className="bg-white text-green-700 border border-green-200 px-4 py-2 rounded-lg font-bold hover:bg-green-50 flex items-center gap-2">
                    <Unlock size={16}/> Unblock User
                  </button>
                </div>
            ))}
          </div>
        )}

        {/* --- SETTINGS --- */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            
            {/* Visuals */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-lg mb-4 text-slate-900 flex items-center gap-2"><Layout size={20} className="text-blue-600"/> Website Visuals</h3>
              <div className="space-y-3">
                <input className="w-full border p-3 rounded-xl text-slate-900 text-sm" placeholder="Site Name" value={settings.site_name} onChange={e => setSettings({...settings, site_name: e.target.value})} />
                <input className="w-full border p-3 rounded-xl text-slate-900 text-sm" placeholder="Hero Title" value={settings.hero_title} onChange={e => setSettings({...settings, hero_title: e.target.value})} />
                <input className="w-full border p-3 rounded-xl text-slate-900 text-sm" placeholder="Hero Subtitle" value={settings.hero_subtitle} onChange={e => setSettings({...settings, hero_subtitle: e.target.value})} />
              </div>
            </div>

            {/* Viral & Monetization */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-lg mb-4 text-slate-900 flex items-center gap-2"><AlertTriangle size={20} className="text-orange-500"/> Viral & Monetization</h3>
              
              <div className="space-y-4">
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mode</label>
                   <select className="w-full border p-2 rounded-lg bg-white" value={settings.monetization_mode} onChange={e => setSettings({...settings, monetization_mode: e.target.value})}>
                      <option value="none">None (Free)</option>
                      <option value="shortlink">Shortlink Token</option>
                      <option value="share">Share to Unlock</option>
                   </select>
                 </div>
                 
                 {settings.monetization_mode === 'shortlink' && (
                    <input className="w-full border border-yellow-400 bg-yellow-50 p-2 rounded-lg text-sm" placeholder="Shortlink URL (/verify)" value={settings.shortlink_url} onChange={e => setSettings({...settings, shortlink_url: e.target.value})} />
                 )}

                 <div className="pt-4 border-t">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Active Contest</label>
                    <div className="flex gap-2">
                        <input className="w-full border p-2 rounded-lg text-sm" placeholder="Contest Title" value={settings.active_contest_title} onChange={e => setSettings({...settings, active_contest_title: e.target.value})} />
                        <input className="w-full border p-2 rounded-lg text-sm" placeholder="Tag" value={settings.active_contest_tag} onChange={e => setSettings({...settings, active_contest_tag: e.target.value})} />
                    </div>
                 </div>
              </div>
            </div>

            {/* Community Rules */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="font-bold text-lg mb-4 text-slate-900 flex items-center gap-2"><ShieldAlert size={20} className="text-red-500"/> Community Rules</h3>
               <textarea className="w-full border border-slate-300 p-3 rounded-xl text-sm h-32 text-slate-800" placeholder="1. No copyright material..." value={settings.community_rules} onChange={e => setSettings({...settings, community_rules: e.target.value})} />
            </div>

            {/* Adsterra / Ads */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
              <h3 className="font-bold text-lg mb-4 text-slate-900 flex items-center gap-2"><Code size={20} className="text-slate-600"/> Adsterra / Ads Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Popunder JS Code</label>
                  <textarea className="w-full border border-slate-300 p-3 rounded-xl text-xs font-mono h-24 bg-slate-50" placeholder="Paste Adsterra Popunder Script..." value={settings.ad_popunder_code} onChange={e => setSettings({...settings, ad_popunder_code: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Native/Banner Code</label>
                  <textarea className="w-full border border-slate-300 p-3 rounded-xl text-xs font-mono h-24 bg-slate-50" placeholder="Paste Native Banner Script..." value={settings.ad_native_code} onChange={e => setSettings({...settings, ad_native_code: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
              <h3 className="font-bold text-lg mb-4 text-slate-900 flex items-center gap-2"><LinkIcon size={20} className="text-blue-500"/> Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">YouTube URL</label>
                    <input className="w-full border p-2 rounded-lg text-sm" value={settings.youtube_link} onChange={e => setSettings({...settings, youtube_link: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Telegram Channels (Label - Link)</label>
                    {[1, 2, 3].map((num) => (
                        <div key={num} className="flex gap-2">
                            <input className="w-1/3 border p-2 rounded text-xs" placeholder="Label" value={settings[`telegram_label_${num}`] || ''} onChange={e => setSettings({...settings, [`telegram_label_${num}`]: e.target.value})} />
                            <input className="w-2/3 border p-2 rounded text-xs" placeholder="Link" value={settings[`telegram_link_${num}`] || ''} onChange={e => setSettings({...settings, [`telegram_link_${num}`]: e.target.value})} />
                        </div>
                    ))}
                 </div>
              </div>
            </div>

            {/* Save Action */}
            <div className="lg:col-span-2 sticky bottom-4">
               <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 shadow-xl flex justify-center items-center gap-2 transition transform active:scale-95">
                 {savingSettings ? "Saving..." : <><Save size={20} /> Save Configuration</>}
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
