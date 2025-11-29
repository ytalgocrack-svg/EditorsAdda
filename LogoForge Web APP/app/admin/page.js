"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { 
  Trash2, Edit, ExternalLink, Users, Image as ImageIcon, 
  Settings, Save, ToggleLeft, ToggleRight, Layout, Megaphone, 
  Link as LinkIcon, AlertTriangle, CheckCircle, 
  Send, Code, ShieldAlert, Check, X, Search, Eye, Download
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  
  // -- UI STATE --
  const [activeTab, setActiveTab] = useState('overview'); 
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // -- DATA STATE --
  const [stats, setStats] = useState({ logos: 0, users: 0, pending: 0 });
  const [logos, setLogos] = useState([]);
  const [pendingLogos, setPendingLogos] = useState([]);
  const [users, setUsers] = useState([]);
  
  // -- USER MODAL STATE --
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState({ uploads: [], downloads: [] });

  // -- SETTINGS STATE --
  const [settings, setSettings] = useState({
    maintenance_mode: 'false',
    popup_enabled: 'true',
    site_name: 'LogoForge',
    hero_title: 'Design Your Brand.',
    hero_subtitle: 'Premium assets for creators.',
    announcement_text: '',
    announcement_enabled: 'false',
    ad_script_head: '',
    ad_script_body: '',
    ad_banner_html: '',
    shortlink_url: '',
    youtube_link: '',
    // Telegram Channels
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
    
    // Fetch All Data
    await Promise.all([
      fetchLogos(), 
      fetchPendingLogos(), 
      fetchUsers(), 
      fetchSettings()
    ]);
    setLoading(false);
  }

  // -- DATA FETCHING --
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

  // -- USER MANAGEMENT ACTIONS --
  async function openUserModal(user) {
    setSelectedUser(user);
    // Fetch Uploads
    const { data: uploads } = await supabase.from('logos').select('*').eq('uploader_id', user.id);
    
    // Fetch Downloads (using foreign key relation to get logo titles)
    const { data: downloads } = await supabase.from('user_downloads')
      .select('*, logos(title)')
      .eq('user_id', user.id)
      .order('downloaded_at', { ascending: false });
      
    setUserStats({ 
      uploads: uploads || [], 
      downloads: downloads || [] 
    });
  }

  async function handleDeleteUser(userId) {
    const confirmDelete = prompt("WARNING: This will permanently delete the user and all their data.\nType 'DELETE' to confirm.");
    if (confirmDelete !== 'DELETE') return;

    // Call RPC function created in SQL
    const { error } = await supabase.rpc('delete_user_by_id', { target_user_id: userId });
    
    if (error) alert("Error: " + error.message);
    else {
      alert("User account deleted.");
      setSelectedUser(null);
      fetchUsers();
    }
  }

  async function toggleRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change role to ${newRole.toUpperCase()}?`)) return;
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    fetchUsers();
  }

  // -- CONTENT ACTIONS --
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
    if (reason === null) return;
    await supabase.from('logos').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
    fetchPendingLogos();
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
                   <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse">{pendingLogos.length}</span>
                )}
                {tab === 'settings' && <Settings size={14}/>}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* --- TAB CONTENT --- */}
        
        {/* 1. OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 animate-slide-up">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden">
               <div className="relative z-10">
                 <p className="text-slate-500 font-medium text-sm">Live Assets</p>
                 <h3 className="text-4xl font-extrabold text-blue-600">{stats.logos}</h3>
               </div>
               <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><ImageIcon size={32} /></div>
             </div>
             
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
               <div>
                 <p className="text-slate-500 font-medium text-sm">Pending Review</p>
                 <h3 className="text-4xl font-extrabold text-orange-500">{stats.pending}</h3>
               </div>
               <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><ShieldAlert size={32} /></div>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
               <div>
                 <p className="text-slate-500 font-medium text-sm">Total Users</p>
                 <h3 className="text-4xl font-extrabold text-purple-600">{stats.users}</h3>
               </div>
               <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><Users size={32} /></div>
             </div>
          </div>
        )}

        {/* 2. LOGOS (Live) */}
        {activeTab === 'logos' && (
          <div className="animate-slide-up space-y-4">
            <div className="flex items-center bg-white border p-2 rounded-xl mb-4 shadow-sm">
              <Search className="text-slate-400 ml-2"/>
              <input 
                placeholder="Search live logos..." 
                className="w-full p-2 outline-none text-sm" 
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {logos.filter(l => l.title.toLowerCase().includes(searchTerm.toLowerCase())).map(l => (
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
               <div className="text-center p-10 bg-white rounded-2xl border border-dashed border-slate-300">
                 <CheckCircle className="mx-auto text-green-500 mb-2" size={32}/>
                 <p className="text-slate-500 font-medium">All caught up! No pending uploads.</p>
               </div>
             ) : (
               pendingLogos.map(l => (
                <div key={l.id} className="bg-white p-4 rounded-2xl shadow-sm border border-orange-200 bg-orange-50/10 flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative shrink-0">
                    <img src={l.url_png} className="h-20 w-20 object-cover rounded-xl bg-slate-100" />
                    <span className="absolute -top-2 -left-2 bg-orange-500 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-sm">Review</span>
                  </div>
                  <div className="flex-1 w-full text-center md:text-left">
                    <h4 className="font-bold text-slate-800">{l.title}</h4>
                    <p className="text-sm text-slate-500 mb-2 line-clamp-2">{l.description || "No description provided."}</p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <span className="text-xs bg-white border px-2 py-1 rounded font-bold uppercase text-slate-500">{l.category}</span>
                        {l.url_plp && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">PLP</span>}
                        {l.url_xml && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">XML</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={() => handleApprove(l.id)} className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-1 font-bold shadow-lg shadow-green-500/20"><Check size={18}/> Approve</button>
                      <button onClick={() => handleReject(l.id)} className="flex-1 md:flex-none px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-1 font-bold"><X size={18}/> Reject</button>
                  </div>
                </div>
               ))
             )}
          </div>
        )}

        {/* 4. USERS */}
        {activeTab === 'users' && (
           <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-100 animate-slide-up">
             <table className="w-full text-left">
               <thead className="bg-slate-50 border-b">
                 <tr>
                   <th className="p-4 text-sm font-bold text-slate-500">Email</th>
                   <th className="p-4 text-sm font-bold text-slate-500">Role</th>
                   <th className="p-4 text-sm font-bold text-slate-500 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {users.map(u => (
                   <tr key={u.id} className="border-b hover:bg-slate-50 transition">
                     <td className="p-4 font-bold text-slate-800">{u.email}</td>
                     <td className="p-4">
                       <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                         {u.role}
                       </span>
                     </td>
                     <td className="p-4 text-right flex justify-end gap-2">
                       <button onClick={() => toggleRole(u.id, u.role)} className="shrink-0 text-xs bg-slate-100 px-3 py-2 rounded-lg font-bold hover:bg-slate-200">
                         {u.role === 'admin' ? 'Demote' : 'Promote'}
                       </button>
                       <button onClick={() => openUserModal(u)} className="shrink-0 text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-2 rounded-lg font-bold hover:bg-blue-100">
                         View Details
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}

        {/* 5. SETTINGS */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
            
            {/* Visuals */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><Layout className="text-blue-600" size={20}/> Site Visuals</h3>
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
                <textarea className="w-full border p-3 rounded-xl text-xs h-24 font-mono bg-slate-50" placeholder="<script>... (Head)</script>" value={settings.ad_script_head} onChange={e => setSettings({...settings, ad_script_head: e.target.value})} />
                <textarea className="w-full border p-3 rounded-xl text-xs h-24 font-mono bg-slate-50" placeholder="<a href='...'><img.../></a> (Banner)" value={settings.ad_banner_html} onChange={e => setSettings({...settings, ad_banner_html: e.target.value})} />
              </div>
            </div>

            {/* Links & Channels */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><Send className="text-blue-500" size={20}/> Telegram Channels (Max 5)</h3>
              
              <div className="space-y-3 mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                 {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="flex gap-2 items-center">
                        <span className="text-xs font-bold text-blue-300 w-4">{num}</span>
                        <input className="w-1/3 border p-2 rounded text-sm" placeholder="Label (e.g. Main)" value={settings[`telegram_label_${num}`] || ''} onChange={e => setSettings({...settings, [`telegram_label_${num}`]: e.target.value})} />
                        <input className="w-2/3 border p-2 rounded text-sm" placeholder="https://t.me/..." value={settings[`telegram_link_${num}`] || ''} onChange={e => setSettings({...settings, [`telegram_link_${num}`]: e.target.value})} />
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
                    <input className="w-full border border-yellow-300 bg-yellow-50 p-2 rounded-lg text-sm" placeholder="Shortened /verify link" value={settings.shortlink_url} onChange={e => setSettings({...settings, shortlink_url: e.target.value})} />
                 </div>
              </div>
            </div>

            {/* System Toggles */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><Settings className="text-slate-600" size={20}/> System Controls</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex justify-between items-center p-3 border rounded-xl">
                   <div><h4 className="font-bold text-sm">Maintenance Mode</h4><p className="text-xs text-slate-400">Close site for users</p></div>
                   <button onClick={() => setSettings({...settings, maintenance_mode: settings.maintenance_mode === 'true' ? 'false' : 'true'})}>
                      {settings.maintenance_mode === 'true' ? <ToggleRight size={32} className="text-red-500"/> : <ToggleLeft size={32} className="text-slate-300"/>}
                   </button>
                 </div>
                 <div className="flex justify-between items-center p-3 border rounded-xl">
                   <div><h4 className="font-bold text-sm">Social Popup</h4><p className="text-xs text-slate-400">Show on entry</p></div>
                   <button onClick={() => setSettings({...settings, popup_enabled: settings.popup_enabled === 'true' ? 'false' : 'true'})}>
                      {settings.popup_enabled === 'true' ? <ToggleRight size={32} className="text-green-500"/> : <ToggleLeft size={32} className="text-slate-300"/>}
                   </button>
                 </div>
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

        {/* USER DETAILS MODAL */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-bounce-in">
              
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedUser.email}</h2>
                  <p className="text-xs text-slate-500 uppercase font-bold">User ID: {selectedUser.id}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-blue-50 rounded-xl text-center">
                     <h3 className="text-2xl font-bold text-blue-600">{userStats.uploads.length}</h3>
                     <p className="text-xs font-bold text-blue-400 uppercase">Uploads</p>
                   </div>
                   <div className="p-4 bg-green-50 rounded-xl text-center">
                     <h3 className="text-2xl font-bold text-green-600">{userStats.downloads.length}</h3>
                     <p className="text-xs font-bold text-green-400 uppercase">Downloads</p>
                   </div>
                </div>

                {/* Upload History */}
                <div>
                   <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><ImageIcon size={16}/> Recent Uploads</h3>
                   <div className="bg-slate-50 rounded-xl border p-2 max-h-40 overflow-y-auto space-y-2">
                      {userStats.uploads.length === 0 && <p className="text-sm text-slate-400 p-2">No uploads yet.</p>}
                      {userStats.uploads.map(up => (
                        <div key={up.id} className="flex items-center gap-3 p-2 bg-white rounded border border-slate-100">
                           <img src={up.url_png} className="w-8 h-8 rounded bg-slate-100 object-cover"/>
                           <span className="text-sm font-medium truncate">{up.title}</span>
                           <span className={`text-[10px] ml-auto px-1 rounded uppercase font-bold ${up.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{up.status}</span>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Download History */}
                <div>
                   <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Download size={16}/> Recent Downloads</h3>
                   <div className="bg-slate-50 rounded-xl border p-2 max-h-40 overflow-y-auto space-y-2">
                      {userStats.downloads.length === 0 && <p className="text-sm text-slate-400 p-2">No downloads yet.</p>}
                      {userStats.downloads.map(dl => (
                        <div key={dl.id} className="flex items-center justify-between p-2 bg-white rounded border border-slate-100">
                           <span className="text-sm font-medium truncate">{dl.logos?.title || 'Deleted Logo'}</span>
                           <span className="text-xs text-slate-400">{new Date(dl.downloaded_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-6 border-t mt-6">
                  <button 
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-600 hover:text-white transition flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18}/> Delete Account Permanently
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
