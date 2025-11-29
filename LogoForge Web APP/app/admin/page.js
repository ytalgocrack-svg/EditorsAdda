"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { Trash2, ExternalLink } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [logos, setLogos] = useState([]);
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
    setLoading(false);
  }

  async function fetchLogos() {
    const { data } = await supabase.from('logos').select('*').order('created_at', { ascending: false });
    setLogos(data || []);
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this logo forever?")) return;
    const { error } = await supabase.from('logos').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchLogos();
  }

  if (loading) return <div className="p-10">Verifying Admin Access...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
          <button onClick={() => router.push('/upload')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">
            + Add New Logo
          </button>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Preview</th>
                <th className="p-4 font-semibold text-slate-600">Title</th>
                <th className="p-4 font-semibold text-slate-600">Category</th>
                <th className="p-4 font-semibold text-slate-600">Date</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logos.map((logo) => (
                <tr key={logo.id} className="border-b hover:bg-slate-50">
                  <td className="p-4">
                    <img src={logo.url_png} className="h-12 w-12 object-cover rounded bg-slate-200" />
                  </td>
                  <td className="p-4 font-medium">{logo.title}</td>
                  <td className="p-4"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs uppercase">{logo.category}</span></td>
                  <td className="p-4 text-slate-500 text-sm">{new Date(logo.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-right flex justify-end gap-3">
                    <button onClick={() => window.open(/view?id=${logo.id}, '_blank')} className="text-slate-400 hover:text-blue-600">
                      <ExternalLink size={18} />
                    </button>
                    <button onClick={() => handleDelete(logo.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
