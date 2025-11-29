"use client";
import { useEffect, useState } from 'react';
import { X, Send, Youtube } from 'lucide-react';

export default function SocialPopup({ settings }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if popup is enabled in settings AND if user hasn't closed it this session
    const sessionClosed = sessionStorage.getItem('popup_closed');
    if (settings.popup_enabled === 'true' && !sessionClosed) {
      // Small delay so it feels natural
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [settings]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('popup_closed', 'true'); // Don't show again this session
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full relative animate-bounce-in">
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition"
        >
          <X size={24} />
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Join Our Community!</h2>
          <p className="text-slate-500 mb-6">Get daily updates, exclusive PLP files, and design tips directly.</p>
          
          <div className="space-y-3">
            {settings.telegram_link && (
              <a href={settings.telegram_link} target="_blank" className="flex items-center justify-center gap-2 w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition">
                <Send size={20} /> Join Telegram
              </a>
            )}
            {settings.youtube_link && (
              <a href={settings.youtube_link} target="_blank" className="flex items-center justify-center gap-2 w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition">
                <Youtube size={20} /> Subscribe YouTube
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
