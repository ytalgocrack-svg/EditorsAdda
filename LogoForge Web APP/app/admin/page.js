"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { 
  Trash2, Edit, ExternalLink, Users, Image as ImageIcon, 
  Settings, Save, ToggleLeft, ToggleRight, Layout, Megaphone, 
  Link as LinkIcon, AlertTriangle, CheckCircle, 
  Send, Code, ShieldAlert, Check, X, Search, Layers, FileCode
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview'); 
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [stats, setStats] = useState({ logos: 0, users: 0, pending: 0 });
  const [logos, setLogos] = useState([]);
  const [pendingLogos, setPendingLogos] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [settings, setSettings] = useState({
    maintenance_mode: 'false', popup_enabled: 'true',
    site_name: '', hero_title: '', hero_subtitle: '',
    announcement_text: '', announcement_enabled: 'false',
    ad_script_head: '', ad_banner_html: '', 
    ad_native_code: '', ad_popunder_code: '', // Adsterra Support
    shortlink_url: '', youtube_link: '',
    telegram_label_1: '', telegram_link_1: '',
    // ... add other telegram keys 2-5 if needed
  });

  useEffect(() => { checkAdmin(); }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/');
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (data?.role !== 'admin') return router.push('/');
    
    await Promise.all([fetchLogos(), fetchPendingLogos(), fetchUsers(), fetchSettings()]);
    setLoading(false);
  }

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

  async function handleSaveSettings() {
    setSavingSettings(true);
    const updates = Object.keys(settings).map(key => ({ key, value: settings[key] || '' }));
    const { error } = await supabase.from('settings').upsert(updates);
    if (error) alert("Error: " + error.message);
    else alert("Settings Saved!");
    setSavingSettings(false);
  }

  async function handleApprove(id) {
    await supabase.from('logos').update({ status: 'approved' }).eq('id', id);
    fetchPendingLogos(); fetchLogos();
  }

  async function handleReject(id) {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    await supabase.from('logos').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
    fetchPendingLogos();
  }

  async function handleDelete(id) {
    if (!confirm("Delete permanently?")) return;
    await supabase.from('logos').delete().eq('id', id);
    fetchLogos();
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900 font-bold">Loading Panel...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-extrabold text-slate-900">Admin Panel</h1>
          <button onClick={() => router.push('/upload')} className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition">
            + Upload Asset
          </button>
        </div>

        {/* Scrollable Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-4 scrollbar-hide">
          {['overview', 'logos', 'moderation', 'users', 'settings'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)} 
              className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === tab ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-300'
              }`}
            >
              {tab === 'moderation' && pendingLogos.length > 0 && (
                 <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{pendingLogos.length}</span>
              )}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* --- OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <p className="text-slate-600 font-bold text-sm uppercase">Live Assets</p>
               <h3 className="text-4xl font-black text-blue-600">{stats.logos}</h3>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <p className="text-slate-600 font-bold text-sm uppercase">Pending</p>
               <h3 className="text-4xl font-black text-orange-500">{stats.pending}</h3>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <p className="text-slate-600 font-bold text-sm uppercase">Users</p>
               <h3 className="text-4xl font-black text-purple-600">{stats.users}</h3>
             </div>
          </div>
        )}

        {/* --- MODERATION (Downloads Included) --- */}
        {activeTab === 'moderation' && (
          <div className="space-y-4">
             {pendingLogos.length === 0 ? <p className="text-slate-500 text-center py-10 font-bold">No pending logos.</p> : null}
             
             {pendingLogos.map(l => (
                <div key={l.id} className="bg-white p-4 rounded-xl shadow-sm border border-orange-200 flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <img src={l.url_png} className="w-20 h-20 object-contain bg-slate-100 rounded-lg border border-slate-200" />
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-slate-900">{l.title}</h4>
                      <p className="text-sm text-slate-600">{l.description}</p>
                      <span className="inline-block bg-slate-200 text-slate-800 text-xs px-2 py-1 rounded font-bold mt-1 uppercase">{l.category}</span>
                    </div>
                  </div>
                  
                  {/* Admin Downloads */}
                  <div className="flex gap-2 flex-wrap">
                    {l.url_plp && (
                      <a href={l.url_plp} target="_blank" className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-200">
                        <Layers size={14}/> Check .PLP
                      </a>
                    )}
                    {l.url_xml && (
                      <a href={l.url_xml} target="_blank" className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-purple-200">
                        <FileCode size={14}/> Check .XML
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                      <button onClick={() => handleApprove(l.id)} className="bg-green-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2"><Check size={18}/> Approve</button>
                      <button onClick={() => handleReject(l.id)} className="bg-red-100 text-red-600 py-3 rounded-xl font-bold flex justify-center items-center gap-2"><X size={18}/> Reject</button>
                  </div>
                </div>
             ))}
          </div>
        )}

        {/* --- SETTINGS (Adsterra) --- */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-lg mb-4 text-slate-900 flex items-center gap-2"><Layout size={20}/> Visuals</h3>
              <div className="space-y-4">
                <input className="w-full border p-3 rounded-xl text-slate-900 font-medium" placeholder="Site Name" value={settings.site_name} onChange={e => setSettings({...settings, site_name: e.target.value})} />
                <input className="w-full border p-3 rounded-xl text-slate-900" placeholder="Hero Title" value={settings.hero_title} onChange={e => setSettings({...settings, hero_title: e.target.value})} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
              <h3 className="font-bold text-lg mb-4 text-slate-900 flex items-center gap-2"><Code size={20}/> Adsterra & Ads</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Popunder Script</label>
                  <textarea className="w-full border border-slate-300 p-3 rounded-xl text-xs font-mono h-32 text-slate-800 bg-slate-50" placeholder="Paste Popunder JS..." value={settings.ad_popunder_code} onChange={e => setSettings({...settings, ad_popunder_code: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Native/Banner Code</label>
                  <textarea className="w-full border border-slate-300 p-3 rounded-xl text-xs font-mono h-32 text-slate-800 bg-slate-50" placeholder="Paste Banner/Native Script..." value={settings.ad_native_code} onChange={e => setSettings({...settings, ad_native_code: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 sticky bottom-4">
               <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 shadow-xl flex justify-center items-center gap-2">
                 {savingSettings ? "Saving..." : <><Save size={20}/> Save Changes</>}
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
