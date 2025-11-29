"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { UploadCloud, Check } from 'lucide-react';

export default function Upload() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [form, setForm] = useState({ title: '', category: 'Abstract', description: '' });
  const [files, setFiles] = useState({ png: null, plp: null, xml: null });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (data?.role !== 'admin') { router.push('/'); return; }
    
    setIsAdmin(true);
    setLoading(false);
  }

  const handleUpload = async () => {
    if (!files.png) return alert("PNG is required!");
    setUploading(true);
    const timestamp = Date.now();

    const uploadFile = async (file, ext) => {
      if (!file) return null;
      const path = `${timestamp}_${file.name.replace(/\s/g, '')}`; // Clean filename
      const { error } = await supabase.storage.from('assets').upload(path, file);
      if (error) { console.error(error); return null; }
      const { data } = supabase.storage.from('assets').getPublicUrl(path);
      return data.publicUrl;
    };

    try {
      const pngUrl = await uploadFile(files.png, 'png');
      const plpUrl = await uploadFile(files.plp, 'plp');
      const xmlUrl = await uploadFile(files.xml, 'xml');

      const { error } = await supabase.from('logos').insert({
        title: form.title,
        description: form.description,
        category: form.category,
        url_png: pngUrl,
        url_plp: plpUrl,
        url_xml: xmlUrl
      });

      if (error) throw error;
      alert('Logo uploaded successfully!');
      router.push('/');
    } catch (e) {
      alert('Error uploading: ' + e.message);
    }
    setUploading(false);
  };

  if (loading) return <div className="p-10">Checking permissions...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-8 my-10 bg-white rounded-3xl shadow-xl">
        <h1 className="text-3xl font-bold mb-8 text-slate-800 flex items-center gap-2">
           <UploadCloud className="text-blue-600"/> Admin Upload
        </h1>
        
        <div className="space-y-6">
          <div>
            <label className="block font-semibold mb-2 text-slate-700">Logo Title</label>
            <input className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none" placeholder="e.g. Red Dragon" onChange={e => setForm({...form, title: e.target.value})} />
          </div>

          <div>
             <label className="block font-semibold mb-2 text-slate-700">Description</label>
             <textarea className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none h-24" placeholder="Brief details about the logo..." onChange={e => setForm({...form, description: e.target.value})} />
          </div>

          <div>
            <label className="block font-semibold mb-2 text-slate-700">Category</label>
            <select className="w-full border-2 border-slate-200 p-3 rounded-xl bg-white" onChange={e => setForm({...form, category: e.target.value})}>
              <option>Abstract</option>
              <option>Technology</option>
              <option>Food</option>
              <option>Sports</option>
              <option>Gaming</option>
              <option>Education</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer ${files.png ? 'border-green-500 bg-green-50' : 'border-slate-300'}`}>
              <label className="cursor-pointer block">
                <span className="block font-bold text-sm mb-1">Main Image (PNG)</span>
                <input type="file" accept="image/png" className="hidden" onChange={e => setFiles({...files, png: e.target.files[0]})} />
                <span className="text-xs text-slate-400">{files.png ? files.png.name : "Click to select"}</span>
              </label>
            </div>

            <div className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer ${files.plp ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}`}>
              <label className="cursor-pointer block">
                <span className="block font-bold text-sm mb-1">PixelLab (.PLP)</span>
                <input type="file" className="hidden" onChange={e => setFiles({...files, plp: e.target.files[0]})} />
                <span className="text-xs text-slate-400">{files.plp ? files.plp.name : "Optional"}</span>
              </label>
            </div>

            <div className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer ${files.xml ? 'border-purple-500 bg-purple-50' : 'border-slate-300'}`}>
              <label className="cursor-pointer block">
                 <span className="block font-bold text-sm mb-1">Vector (.XML)</span>
                 <input type="file" className="hidden" onChange={e => setFiles({...files, xml: e.target.files[0]})} />
                 <span className="text-xs text-slate-400">{files.xml ? files.xml.name : "Optional"}</span>
              </label>
            </div>
          </div>

          <button 
            onClick={handleUpload} 
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 font-bold text-lg shadow-lg shadow-blue-500/30 transition transform active:scale-95"
          >
            {uploading ? 'Uploading Assets...' : '🚀 Publish Logo'}
          </button>
        </div>
      </div>
    </div>
  );
}
