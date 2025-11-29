"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Upload() {
  const [form, setForm] = useState({ title: '', category: 'Abstract' });
  const [files, setFiles] = useState({ png: null, plp: null, xml: null });
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    setLoading(true);
    const timestamp = Date.now();

    // Helper to upload a single file
    const uploadFile = async (file, ext) => {
      if (!file) return null;
      const path = `${timestamp}_${form.title}_${ext}`;
      const { error } = await supabase.storage.from('assets').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('assets').getPublicUrl(path);
      return data.publicUrl;
    };

    try {
      const pngUrl = await uploadFile(files.png, 'png');
      const plpUrl = await uploadFile(files.plp, 'plp');
      const xmlUrl = await uploadFile(files.xml, 'xml');

      const { error } = await supabase.from('logos').insert({
        title: form.title,
        category: form.category,
        url_png: pngUrl,
        url_plp: plpUrl,
        url_xml: xmlUrl
      });

      if (error) throw error;
      alert('Logo uploaded successfully!');
    } catch (e) {
      alert('Error uploading: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-10 bg-white shadow mt-10 rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Upload New Logo</h1>
      
      <div className="space-y-4">
        <input className="w-full border p-2 rounded" placeholder="Logo Name" onChange={e => setForm({...form, title: e.target.value})} />
        <select className="w-full border p-2 rounded" onChange={e => setForm({...form, category: e.target.value})}>
          <option>Abstract</option>
          <option>Technology</option>
          <option>Food</option>
          <option>Sports</option>
        </select>

        <div>
          <label className="block text-sm font-bold mb-1">PNG (Preview)</label>
          <input type="file" accept="image/png" onChange={e => setFiles({...files, png: e.target.files[0]})} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">PLP File</label>
          <input type="file" onChange={e => setFiles({...files, plp: e.target.files[0]})} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">XML File</label>
          <input type="file" onChange={e => setFiles({...files, xml: e.target.files[0]})} />
        </div>

        <button 
          onClick={handleUpload} 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold"
        >
          {loading ? 'Uploading...' : 'Publish Logo'}
        </button>
      </div>
    </div>
  );
}