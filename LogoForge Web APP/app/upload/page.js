"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { UploadCloud, Link as LinkIcon, FileCode, Image as ImageIcon } from 'lucide-react';

export default function Upload() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [form, setForm] = useState({ 
    title: '', 
    category: 'Abstract', 
    description: '',
    xml_link: ''
  });
  // Changed 'png' to 'image' to reflect it can be any format
  const [files, setFiles] = useState({ image: null, plp: null, xml: null });
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
    // Validation: Check for generic 'image'
    if (!files.image) return alert("Main Image (JPG/PNG) is required!");
    
    setUploading(true);
    const timestamp = Date.now();

    const uploadFile = async (file) => {
      if (!file) return null;
      // Sanitize filename
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '');
      const path = `${timestamp}_${cleanName}`;
      const { error } = await supabase.storage.from('assets').upload(path, file);
      if (error) { console.error(error); return null; }
      const { data } = supabase.storage.from('assets').getPublicUrl(path);
      return data.publicUrl;
    };

    try {
      // 1. Upload Files
      const imageUrl = await uploadFile(files.image); // Upload JPG or PNG
      const plpUrl = await uploadFile(files.plp);
      let xmlUrl = await uploadFile(files.xml);

      if (!xmlUrl && form.xml_link) {
        xmlUrl = form.xml_link;
      }

      // 2. Save to Database
      const { error } = await supabase.from('logos').insert({
        title: form.title,
        description: form.description,
        category: form.category,
        url_png: imageUrl, // We store the JPG/PNG url here
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

  if (loading) return <div className="p-10 text-center">Checking permissions...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-8 my-10 bg-white rounded-3xl shadow-xl">
        <h1 className="text-3xl font-bold mb-8 text-slate-800 flex items-center gap-2">
           <UploadCloud className="text-blue-600"/> Admin Upload
        </h1>
        
        <div className="space-y-6">
          {/* Inputs */}
          <div>
            <label className="block font-semibold mb-2 text-slate-700">Logo Title</label>
            <input className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none" placeholder="e.g. Red Dragon" onChange={e => setForm({...form, title: e.target.value})} />
          </div>
          <div>
             <label className="block font-semibold mb-2 text-slate-700">Description</label>
             <textarea className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none h-24" placeholder="Details..." onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-slate-700">Category</label>
            <input 
              list="categories"
              className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none" 
              placeholder="Select or Type Category"
              onChange={e => setForm({...form, category: e.target.value})}
            />
            <datalist id="categories">
              <option value="Abstract" />
              <option value="Gaming" />
              <option value="Technology" />
              <option value="Sports" />
            </datalist>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* IMAGE UPLOAD (JPG/PNG) */}
            <div className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer ${files.image ? 'border-green-500 bg-green-50' : 'border-slate-300'}`}>
              <label className="cursor-pointer block">
                <div className="flex justify-center mb-2">
                    <ImageIcon className={files.image ? "text-green-500" : "text-slate-400"} />
                </div>
                <span className="block font-bold text-sm mb-1">1. Main Image (JPG, PNG, WEBP) *</span>
                {/* Accept any image type */}
                <input type="file" accept="image/*" className="hidden" onChange={e => setFiles({...files, image: e.target.files[0]})} />
                <span className="text-xs text-slate-400">{files.image ? files.image.name : "Click to select Image"}</span>
              </label>
            </div>

            {/* PLP */}
            <div className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer ${files.plp ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}`}>
              <label className="cursor-pointer block">
                <span className="block font-bold text-sm mb-1">2. PixelLab File (.PLP)</span>
                <input type="file" className="hidden" onChange={e => setFiles({...files, plp: e.target.files[0]})} />
                <span className="text-xs text-slate-400">{files.plp ? files.plp.name : "Optional"}</span>
              </label>
            </div>

            {/* XML */}
            <div className="p-4 rounded-xl border-2 border-purple-100 bg-purple-50">
              <span className="block font-bold text-sm mb-2 text-purple-900">3. Vector Data (.XML)</span>
              
              <label className="cursor-pointer block bg-white border border-purple-200 rounded-lg p-3 mb-3 hover:bg-purple-50 transition">
                 <div className="flex items-center gap-2">
                    <FileCode size={18} className="text-purple-500"/>
                    <span className="text-sm font-medium text-slate-600">Option A: Upload XML File</span>
                 </div>
                 <input type="file" className="hidden" onChange={e => setFiles({...files, xml: e.target.files[0]})} />
                 <span className="text-xs text-purple-600 block mt-1 ml-6">{files.xml ? "Selected: " + files.xml.name : ""}</span>
              </label>

              <div className="text-center text-xs text-slate-400 font-bold mb-3">- OR -</div>

              <div className="flex items-center gap-2 bg-white border border-purple-200 rounded-lg p-2">
                 <LinkIcon size={18} className="text-purple-500 ml-2"/>
                 <input 
                   className="w-full text-sm outline-none p-1" 
                   placeholder="Option B: Paste External XML Link"
                   onChange={e => setForm({...form, xml_link: e.target.value})}
                 />
              </div>
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
