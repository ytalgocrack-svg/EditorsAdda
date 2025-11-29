"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { 
  Trash2, Edit, ExternalLink, Users, Image as ImageIcon, 
  Settings, Save, ToggleLeft, ToggleRight, Layout, Megaphone, 
  Type, Link as LinkIcon, AlertTriangle, CheckCircle 
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  
  // -- STATE MANAGEMENT --
  const [activeTab, setActiveTab] = useState('overview'); 
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Data State
  const [stats, setStats] = useState({ logos: 0, users: 0 });
  const [logos, setLogos] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Settings State (Default values to prevent crashes)
  const [settings, setSettings] = useState({
    maintenance_mode: 'false',
    popup_enabled: 'true',
    telegram_link: '',
    youtube_link: '',
    shortlink_url: '',
    site_name: 'LogoForge',
    hero_title: 'Design Your Brand, Instantly.',
    hero_subtitle: 'Access premium assets for free.',
    announcement_text: 'New PLP files added!',
    announcement_enabled: 'false'
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
    await Promise.all([fetchLogos(), fetchUsers(), fetchSettings()]);
    setLoading(false);
  }

  // -- DATA FETCHERS --
  async function fetchLogos() {
    const { data, count } = await supabase.from('logos').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    setLogos(data || []);
    setStats(prev => ({ ...prev, logos: count }));
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
      // Merge with defaults to ensure all keys exist
      setSettings(prev => ({ ...prev, ...config }));
    }
  }

  // -- ACTIONS --
  async function handleSaveSettings() {
    setSavingSettings(true);
    // Convert object back to Supabase key-value format
    const updates = Object.keys(settings).map(key => ({ 
      key, 
      value: settings[key] || '' // Ensure no nulls
    }));
    
    const { error } = await supabase.from('settings').upsert(updates);
    
    if (error) alert("Error saving: " + error.message);
    else alert("Configuration Saved Successfully!");
    
    setSavingSettings(false);
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this logo? This cannot be undone.")) return;
    await supabase.from('logos').delete().eq('id', id);
    fetchLogos();
  }

  async function toggleRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change this user's role to ${newRole.toUpperCase()}?`)) return;
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

        {/* NAVIGATION TABS (Scrollable on Mobile) */}
        <div className="sticky top-0 z-10 bg-slate-50 pt-2 pb-4 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="flex gap-2 md:gap-4">
            {['overview', 'logos', 'users', 'settings'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)} 
                className={`px-5 py-2.5 rounded-full font-bold text-sm transition capitalize flex items-center gap-2 ${
                  activeTab === tab 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
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
                 <p className="text-slate-500 font-medium text-sm">Total Assets</p>
                 <h3 className="text-4xl font-extrabold text-blue-600">{stats.logos}</h3>
               </div>
               <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><ImageIcon size={32} /></div>
             </div>
             
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
               <div>
                 <p className="text-slate-500 font-medium text-sm">Total Users</p>
                 <h3 className="text-4xl font-extrabold text-purple-600">{stats.users}</h3>
               </div>
               <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><Users size={32} /></div>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
               <div>
                 <p className="text-slate-500 font-medium text-sm">System Status</p>
                 <h3 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
                 </h3>
               </div>
               <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle size={32} /></div>
             </div>
          </div>
        )}

        {/* 2. LOGOS MANAGEMENT */}
        {activeTab === 'logos' && (
          <div className="animate-slide-up">
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-4 text-sm font-bold text-slate-500">Preview</th>
                    <th className="p-4 text-sm font-bold text-slate-500">Title</th>
                    <th className="p-4 text-sm font-bold text-slate-500">Category</th>
                    <th className="p-4 text-sm font-bold text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logos.map(l => (
                    <tr key={l.id} className="border-b hover:bg-slate-50 transition">
                      <td className="p-4"><img src={l.url_png} className="h-12 w-12 object-cover rounded bg-slate-100" /></td>
                      <td className="p-4 font-bold text-slate-800">{l.title}</td>
                      <td className="p-4"><span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase font-bold">{l.category}</span></td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button onClick={() => window.open(`/view?id=${l.id}`, '_blank')} className="p-2 bg-slate-100 rounded-lg hover:text-blue-600"><ExternalLink size={18}/></button>
                        <button onClick={() => router.push(`/admin/edit?id=${l.id}`)} className="p-2 bg-slate-100 rounded-lg hover:text-orange-500"><Edit size={18}/></button>
                        <button onClick={() => handleDelete(l.id)} className="p-2 bg-slate-100 rounded-lg hover:text-red-500"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {logos.map(l => (
                <div key={l.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-center">
                  <img src={l.url_png} className="h-20 w-20 object-cover rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 truncate">{l.title}</h4>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase font-bold">{l.category}</span>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => router.push(`/admin/edit?id=${l.id}`)} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-xs font-bold"><Edit size={16} className="mx-auto"/></button>
                      <button onClick={() => handleDelete(l.id)} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold"><Trash2 size={16} className="mx-auto"/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. USER MANAGEMENT */}
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
                 <button 
                   onClick={() => toggleRole(u.id, u.role)} 
                   className="shrink-0 text-xs bg-slate-100 px-3 py-2 rounded-lg font-bold hover:bg-slate-200 transition"
                 >
                   {u.role === 'admin' ? 'Demote' : 'Promote'}
                 </button>
               </div>
             ))}
           </div>
        )}

        {/* 4. SETTINGS (The Big Upgrade) */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
            
            {/* Visual Customization Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
                <Layout className="text-blue-600" size={20}/> 
                Visual Customization
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Website Name</label>
                  <input className="w-full border p-3 rounded-xl bg-slate-50 focus:bg-white transition" value={settings.site_name} onChange={e => setSettings({...settings, site_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Hero Title (Main Heading)</label>
                  <input className="w-full border p-3 rounded-xl bg-slate-50 focus:bg-white transition" value={settings.hero_title} onChange={e => setSettings({...settings, hero_title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Hero Subtitle</label>
                  <input className="w-full border p-3 rounded-xl bg-slate-50 focus:bg-white transition" value={settings.hero_subtitle} onChange={e => setSettings({...settings, hero_subtitle: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Announcement Bar Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
                <Megaphone className="text-purple-600" size={20}/> 
                Announcement Bar
              </h3>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100 mb-4">
                <div>
                  <h4 className="font-bold text-purple-900 text-sm">Enable Top Bar</h4>
                  <p className="text-xs text-purple-700">Shows a notification at the top of site.</p>
                </div>
                <button onClick={() => setSettings({...settings, announcement_enabled: settings.announcement_enabled === 'true' ? 'false' : 'true'})}>
                    {settings.announcement_enabled === 'true' ? <ToggleRight size={36} className="text-purple-600"/> : <ToggleLeft size={36} className="text-slate-300"/>}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Notification Text</label>
                <input className="w-full border p-3 rounded-xl bg-slate-50 focus:bg-white transition" value={settings.announcement_text} onChange={e => setSettings({...settings, announcement_text: e.target.value})} />
              </div>
            </div>

            {/* System Configuration Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
                <Settings className="text-slate-600" size={20}/> 
                System & Features
              </h3>

              <div className="space-y-4">
                {/* Maintenance */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Maintenance Mode</h4>
                    <p className="text-xs text-slate-500">Close site for non-admins.</p>
                  </div>
                  <button onClick={() => setSettings({...settings, maintenance_mode: settings.maintenance_mode === 'true' ? 'false' : 'true'})}>
                     {settings.maintenance_mode === 'true' ? <ToggleRight size={36} className="text-red-500"/> : <ToggleLeft size={36} className="text-slate-300"/>}
                  </button>
                </div>

                {/* Social Popup */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Social Join Popup</h4>
                    <p className="text-xs text-slate-500">Prompts users to join channels.</p>
                  </div>
                  <button onClick={() => setSettings({...settings, popup_enabled: settings.popup_enabled === 'true' ? 'false' : 'true'})}>
                     {settings.popup_enabled === 'true' ? <ToggleRight size={36} className="text-green-500"/> : <ToggleLeft size={36} className="text-slate-300"/>}
                  </button>
                </div>
              </div>
            </div>

            {/* Links & Monetization Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
                <LinkIcon className="text-orange-500" size={20}/> 
                Links & Monetization
              </h3>

              <div className="space-y-4">
                {/* Shortlink */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                     <AlertTriangle size={16} className="text-yellow-600"/>
                     <span className="text-xs font-bold text-yellow-800 uppercase">Shortlink Monetization</span>
                  </div>
                  <p className="text-xs text-yellow-700 mb-2 leading-relaxed">
                    Shorten this URL: <code className="bg-white px-1 rounded border border-yellow-200">/verify</code>
                  </p>
                  <input className="w-full border border-yellow-300 p-2 rounded-lg text-sm bg-white" placeholder="https://ad-link.com/..." value={settings.shortlink_url} onChange={e => setSettings({...settings, shortlink_url: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Telegram URL</label>
                    <input className="w-full border p-2 rounded-lg text-sm bg-slate-50" value={settings.telegram_link} onChange={e => setSettings({...settings, telegram_link: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">YouTube URL</label>
                    <input className="w-full border p-2 rounded-lg text-sm bg-slate-50" value={settings.youtube_link} onChange={e => setSettings({...settings, youtube_link: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            {/* SAVE BUTTON BAR */}
            <div className="lg:col-span-2 sticky bottom-4">
               <button 
                 onClick={handleSaveSettings} 
                 disabled={savingSettings} 
                 className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 shadow-xl shadow-slate-900/20 flex justify-center items-center gap-2 transition transform active:scale-95"
               >
                 {savingSettings ? "Saving..." : <><Save size={20} /> Save Configuration</>}
               </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
