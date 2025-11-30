"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { Copy, Sparkles, Check } from 'lucide-react';

export default function AIPrompts() {
  const [prompts, setPrompts] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    // Fetch logos where category is 'AI-Art'
    supabase.from('logos').select('*, profiles(display_name)').eq('category', 'AI-Art').eq('status', 'approved')
      .then(({data}) => setPrompts(data || []));
  }, []);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-10">
           <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">AI Prompt Library</h1>
           <p className="text-slate-400">Copy high-quality prompts for Bing & Midjourney.</p>
        </div>

        <div className="columns-1 md:columns-3 gap-6 space-y-6">
           {prompts.map((item) => (
             <div key={item.id} className="break-inside-avoid bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition group">
                <img src={item.url_png} className="w-full h-auto" />
                <div className="p-4">
                   <div className="flex justify-between items-start gap-4">
                      <p className="text-sm text-slate-300 line-clamp-3 font-mono bg-black/30 p-2 rounded border border-white/5 w-full">
                        {item.ai_prompt || item.description}
                      </p>
                      <button 
                        onClick={() => copyToClipboard(item.ai_prompt || item.description, item.id)}
                        className={`p-2 rounded-lg shrink-0 transition ${copiedId === item.id ? 'bg-green-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                      >
                        {copiedId === item.id ? <Check size={18}/> : <Copy size={18}/>}
                      </button>
                   </div>
                   <div className="mt-3 flex items-center gap-2">
                      <Sparkles size={12} className="text-purple-400"/>
                      <span className="text-xs text-slate-500">Prompt by {item.profiles?.display_name}</span>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
