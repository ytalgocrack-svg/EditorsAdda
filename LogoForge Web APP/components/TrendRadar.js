"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Flame } from 'lucide-react';
import Link from 'next/link';

export default function TrendRadar() {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    supabase.from('settings').select('*').eq('key', 'trending_tags').single()
      .then(({ data }) => {
        if (data) setTags(data.value.split(',').map(t => t.trim()));
      });
  }, []);

  if (tags.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 p-5 rounded-2xl mb-6">
      <h3 className="font-bold text-orange-400 mb-3 flex items-center gap-2">
        <Flame size={20} className="fill-orange-500 animate-pulse"/> Trending Now
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <span key={i} className="text-xs font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer transition">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
