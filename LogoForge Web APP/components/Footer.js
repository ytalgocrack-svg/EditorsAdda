"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Footer() {
  const [settings, setSettings] = useState({
    footer_about: 'The best place for design assets.',
    footer_copyright: '© 2024 LogoForge.',
    footer_link_1_label: 'Privacy', footer_link_1_url: '#',
    footer_link_2_label: 'Terms', footer_link_2_url: '#',
    footer_link_3_label: 'Contact', footer_link_3_url: '#',
  });

  useEffect(() => {
    supabase.from('settings').select('*').then(({data}) => {
      const config = {};
      if(data) data.forEach(item => config[item.key] = item.value);
      setSettings(prev => ({ ...prev, ...config }));
    });
  }, []);

  return (
    <footer className="bg-[#0b1120] border-t border-white/10 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-8">
        
        {/* About */}
        <div className="max-w-sm">
          <h3 className="text-white font-bold text-lg mb-4">About</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            {settings.footer_about}
          </p>
        </div>

        {/* Links */}
        <div>
           <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
           <ul className="space-y-2 text-sm text-slate-400">
             <li><Link href={settings.footer_link_1_url || '#'} className="hover:text-primary transition">{settings.footer_link_1_label}</Link></li>
             <li><Link href={settings.footer_link_2_url || '#'} className="hover:text-primary transition">{settings.footer_link_2_label}</Link></li>
             <li><Link href={settings.footer_link_3_url || '#'} className="hover:text-primary transition">{settings.footer_link_3_label}</Link></li>
           </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/5 text-center text-xs text-slate-500">
         {settings.footer_copyright}
      </div>
    </footer>
  );
}
