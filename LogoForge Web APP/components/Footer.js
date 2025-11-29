import { Twitter, Instagram, Github, Heart } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand */}
        <div className="col-span-1 md:col-span-2">
          <h2 className="text-2xl font-bold text-white mb-4">LogoForge</h2>
          <p className="max-w-xs text-slate-400">
            The #1 source for free PLP, XML, and PNG assets for content creators and designers.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="font-bold text-white mb-4">Explore</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-blue-400 transition">Latest Logos</Link></li>
            <li><Link href="/auth" className="hover:text-blue-400 transition">Login / Sign Up</Link></li>
            <li><Link href="/upload" className="hover:text-blue-400 transition">Submit Logo</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="font-bold text-white mb-4">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><span className="cursor-pointer hover:text-blue-400">Privacy Policy</span></li>
            <li><span className="cursor-pointer hover:text-blue-400">Terms of Service</span></li>
            <li><span className="cursor-pointer hover:text-blue-400">Cookie Policy</span></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-sm">
        <p>© {new Date().getFullYear()} LogoForge. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <Twitter size={20} className="hover:text-white cursor-pointer"/>
          <Instagram size={20} className="hover:text-white cursor-pointer"/>
          <Github size={20} className="hover:text-white cursor-pointer"/>
        </div>
      </div>
    </footer>
  );
}
