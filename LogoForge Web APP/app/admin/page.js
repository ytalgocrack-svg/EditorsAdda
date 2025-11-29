"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, ExternalLink, Users, Image as ImageIcon, Settings, Save, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview'); 
  const [stats, setStats] = useState({ logos: 0, users: 0 });
  const [logos, setLogos] = useState([]);
  const [users, setUsers] = useState([]);
  
  // NEW: Settings State
  const [settings, setSettings] = useState({
    maintenance_mode: 'false',
    popup_enabled: 'true',
    telegram_link: '',
    youtube_link: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/');
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (data?.role !== 'admin') return router.push('/');
    
    fetchLogos();
    fetchUsers();
    fetchSettings();
    setLoading(false);
  }

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

  // NEW: Fetch Settings
  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const formatted = {};
      data.forEach(item => formatted[item.key] = item.value);
      setSettings(prev => ({ ...prev, ...formatted }));
    }
  }

  // NEW: Save Settings
  async function handleSaveSettings() {
    setSavingSettings(true);
    const updates = Object.keys(settings).map(key => ({ key, value: settings[key] }));
    const { error } = await supabase.from('settings').upsert(updates);
    
    if (error) alert("Error saving: " + error.message);
    else alert("Settings Saved!");
    setSavingSettings(false);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this logo?")) return;
    await supabase.from('logos').delete().eq('id', id);
    fetchLogos();
  }

  async function toggleRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change role to ${newRole.toUpperCase()}?`)) return;
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    fetchUsers();
  }

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800">Admin Control Panel</h1>
          <button onClick={() => router.push('/upload')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-lg transition">
            + Upload New Logo
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200 pb-1 overflow-x-auto">
          {['overview', 'logos', 'users', 'settings'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)} 
              className={`pb-3 px-2 font-medium capitalize transition ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* --- TABS CONTENT --- */}
        
        {/* OVERVIEW (Same as before) */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <h3 className="text-3xl font-bold text-blue-600">{stats.logos}</h3>
               <p className="text-slate-500">Total Logos</p>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <h3 className="text-3xl font-bold text-purple-600">{stats.users}</h3>
               <p className="text-slate-500">Total Users</p>
             </div>
          </div>
        )}

        {/* LOGOS (Same as before) */}
        {activeTab === 'logos' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr><th className="p-4">Name</th><th className="p-4 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {logos.map(l => (
                  <tr key={l.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 font-medium">{l.title}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => router.push(`/admin/edit?id=${l.id}`)}><Edit size={18} className="text-orange-500"/></button>
                      <button onClick={() => handleDelete(l.id)}><Trash2 size={18} className="text-red-500"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* USERS (Same as before) */}
        {activeTab === 'users' && (
           <div className="bg-white rounded-xl shadow overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-slate-50">
                 <tr><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4 text-right">Action</th></tr>
               </thead>
               <tbody>
                 {users.map(u => (
                   <tr key={u.id} className="border-b">
                     <td className="p-4">{u.email}</td>
                     <td className="p-4 font-bold text-xs uppercase">{u.role}</td>
                     <td className="p-4 text-right">
                       <button onClick={() => toggleRole(u.id, u.role)} className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200">Switch Role</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}

        {/* NEW: SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings className="text-blue-600"/> Site Configuration</h2>
            
            <div className="space-y-6">
              {/* Maintenance Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-800">Maintenance Mode</h3>
                  <p className="text-sm text-slate-500">Close the site for everyone except admins.</p>
                </div>
                <button 
                  onClick={() => setSettings({...settings, maintenance_mode: settings.maintenance_mode === 'true' ? 'false' : 'true'})}
                  className={`text-3xl transition ${settings.maintenance_mode === 'true' ? 'text-red-500' : 'text-slate-300'}`}
                >
                  {settings.maintenance_mode === 'true' ? <ToggleRight size={40}/> : <ToggleLeft size={40}/>}
                </button>
              </div>

              {/* Popup Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-800">Social Popup</h3>
                  <p className="text-sm text-slate-500">Show popup when user visits the site.</p>
                </div>
                <button 
                  onClick={() => setSettings({...settings, popup_enabled: settings.popup_enabled === 'true' ? 'false' : 'true'})}
                  className={`text-3xl transition ${settings.popup_enabled === 'true' ? 'text-green-500' : 'text-slate-300'}`}
                >
                  {settings.popup_enabled === 'true' ? <ToggleRight size={40}/> : <ToggleLeft size={40}/>}
                </button>
              </div>

              {/* Links */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Telegram Link</label>
                <input 
                  className="w-full border p-3 rounded-lg" 
                  value={settings.telegram_link}
                  onChange={e => setSettings({...settings, telegram_link: e.target.value})}
                  placeholder="https://t.me/..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">YouTube Link</label>
                <input 
                  className="w-full border p-3 rounded-lg" 
                  value={settings.youtube_link}
                  onChange={e => setSettings({...settings, youtube_link: e.target.value})}
                  placeholder="https://youtube.com/..."
                />
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex justify-center items-center gap-2"
              >
                <Save size={18} /> {savingSettings ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
