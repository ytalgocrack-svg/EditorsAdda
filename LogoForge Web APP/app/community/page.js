"use client";
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { Send, Smile, AlertOctagon, Shield, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- CONFIGURATION ---
const BAD_WORDS = ["badword", "abuse", "hate", "scam", "stupid", "idiot", "fool"]; 
// Strict Link Regex: Catches http, https, www, and common domains
const LINK_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9]+\.[a-z]{2,}\/)/i;

const STICKERS = [
  "https://cdn-icons-png.flaticon.com/128/742/742751.png", // Smile
  "https://cdn-icons-png.flaticon.com/128/742/742752.png", // Laugh
  "https://cdn-icons-png.flaticon.com/128/742/742920.png", // Cool
  "https://cdn-icons-png.flaticon.com/128/742/742760.png", // Love
  "https://cdn-icons-png.flaticon.com/128/742/742750.png", // Angry
  "https://cdn-icons-png.flaticon.com/128/742/742822.png", // Fire
  "https://cdn-icons-png.flaticon.com/128/742/742939.png", // Thumb Up
  "https://cdn-icons-png.flaticon.com/128/1616/1616567.png", // Rocket
];

export default function Community() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Rules Modal State
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesText, setRulesText] = useState("");
  
  const scrollRef = useRef(null);

  useEffect(() => {
    checkUser();
    fetchMessages();
    fetchRules();

    // Realtime Listener
    const channel = supabase.channel('community_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, 
      (payload) => { fetchSingleMessage(payload.new.id); })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/auth');
    setUser(user);

    // Check if user is already blocked
    const { data } = await supabase.from('profiles').select('status').eq('id', user.id).single();
    if (data?.status === 'blocked') setIsBlocked(true);
  }

  async function fetchRules() {
    const { data } = await supabase.from('settings').select('*').eq('key', 'community_rules').single();
    if (data) {
      setRulesText(data.value);
      // Check if user has already accepted rules this session
      const hasSeenRules = sessionStorage.getItem('rules_accepted');
      if (!hasSeenRules) setShowRulesModal(true);
    }
  }

  const acceptRules = () => {
    sessionStorage.setItem('rules_accepted', 'true');
    setShowRulesModal(false);
  };

  async function fetchMessages() {
    const { data } = await supabase.from('community_messages')
      .select('*, profiles(display_name, avatar_url, role)')
      .order('created_at', { ascending: true })
      .limit(50);
    if (data) setMessages(data);
  }

  async function fetchSingleMessage(id) {
    const { data } = await supabase.from('community_messages').select('*, profiles(display_name, avatar_url, role)').eq('id', id).single();
    if(data) setMessages(prev => [...prev, data]);
  }

  async function handleSendMessage(content, type = 'text') {
    if (isBlocked) return;
    if (type === 'text' && !content.trim()) return;

    // --- SECURITY CHECK 1: LINKS ---
    if (type === 'text' && LINK_REGEX.test(content)) {
      alert("⚠️ Security Alert: Links are strictly prohibited. Please read the rules.");
      return; 
    }

    // --- SECURITY CHECK 2: ABUSIVE LANGUAGE ---
    if (type === 'text') {
      const lowerContent = content.toLowerCase();
      const detectedWord = BAD_WORDS.find(word => lowerContent.includes(word));

      if (detectedWord) {
        setIsBlocked(true);
        setNewMessage("");
        
        // Block the user
        await supabase.from('profiles').update({ status: 'blocked' }).eq('id', user.id);
        
        // Log for Admin
        await supabase.from('abuse_logs').insert({ 
          user_id: user.id, 
          message_attempt: content, 
          detected_word: detectedWord 
        });
        
        alert("🚫 You have been blocked for violating community guidelines.");
        return;
      }
    }

    // --- SEND MESSAGE ---
    const { error } = await supabase.from('community_messages').insert({
      user_id: user.id,
      content: type === 'text' ? content : null,
      sticker_url: type === 'sticker' ? content : null,
      type: type
    });

    if (error) {
        if(error.message.includes("Active users")) setIsBlocked(true);
        else console.error(error);
    } else {
        setNewMessage("");
        setShowStickers(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col font-sans">
      <Navbar />
      
      {/* --- RULES MODAL --- */}
      {showRulesModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-white text-slate-900 p-8 rounded-3xl shadow-2xl max-w-md w-full animate-bounce-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Info size={32}/></div>
              <h2 className="text-2xl font-bold">Community Rules</h2>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-sm leading-relaxed whitespace-pre-line font-medium text-slate-700 max-h-60 overflow-y-auto">
              {rulesText || "Loading rules..."}
            </div>

            <button onClick={acceptRules} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition active:scale-95 shadow-lg">
              I Agree & Enter Chat
            </button>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="bg-slate-800/50 backdrop-blur-md border-b border-white/5 p-4 shadow-sm z-10 sticky top-16">
        <h1 className="text-lg font-bold flex items-center gap-2 max-w-4xl mx-auto text-slate-200">
          <Smile className="text-primary"/> Global Chat
          <span className="text-[10px] uppercase font-bold bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-1 rounded ml-auto">
            No Links • No Media
          </span>
        </h1>
      </div>

      {/* --- CHAT AREA --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full custom-scrollbar" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0 border border-white/10">
               <img src={msg.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${msg.profiles?.display_name || 'U'}`} className="w-full h-full object-cover"/>
            </div>
            
            {/* Bubble */}
            <div className={`max-w-[80%] flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
               <div className="flex items-center gap-1 mb-1">
                 {msg.profiles?.role === 'admin' && <Shield size={12} className="text-primary fill-primary/20"/>}
                 <span className={`text-[10px] font-bold ${msg.profiles?.role === 'admin' ? 'text-primary' : 'text-slate-400'}`}>
                   {msg.profiles?.display_name || 'User'}
                 </span>
               </div>
               
               {msg.type === 'sticker' ? (
                 <img src={msg.sticker_url} className="w-24 h-24 hover:scale-110 transition-transform drop-shadow-md"/>
               ) : (
                 <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-md ${
                   msg.user_id === user?.id 
                   ? 'bg-primary text-white rounded-tr-none' 
                   : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                 }`}>
                   {msg.content}
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* --- INPUT AREA --- */}
      <div className="bg-slate-800/80 backdrop-blur-lg border-t border-white/5 p-4">
        <div className="max-w-4xl mx-auto relative">
          
          {isBlocked ? (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center justify-center gap-3 text-red-400 font-bold animate-pulse">
              <AlertOctagon size={24} /> You have been blocked from the community.
            </div>
          ) : (
            <div className="flex gap-3 items-center">
              {/* Sticker Toggle */}
              <div className="relative">
                <button 
                  onClick={() => setShowStickers(!showStickers)}
                  className={`p-3 rounded-full transition shadow-lg ${showStickers ? 'bg-primary text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                  <Smile size={24}/>
                </button>
                {/* Sticker Popup */}
                {showStickers && (
                  <div className="absolute bottom-16 left-0 bg-slate-900 border border-white/10 p-3 rounded-2xl shadow-2xl w-72 grid grid-cols-4 gap-2 animate-bounce-in z-20">
                    {STICKERS.map((sticker, i) => (
                      <button key={i} onClick={() => handleSendMessage(sticker, 'sticker')} className="hover:bg-white/10 p-2 rounded-xl transition">
                        <img src={sticker} className="w-full"/>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Input */}
              <input 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage(newMessage)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-900/50 border border-white/10 rounded-full px-6 py-3.5 focus:outline-none focus:border-primary text-white placeholder:text-slate-500 transition"
              />
              
              {/* Send Button */}
              <button 
                onClick={() => handleSendMessage(newMessage)}
                disabled={!newMessage.trim()}
                className="bg-primary p-3.5 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition shadow-lg shadow-primary/20"
              >
                <Send size={20}/>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
