"use client";
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { Send, Trash2, Shield, User, Loader2 } from 'lucide-react';

export default function CommunityChat() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function checkSession() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/auth');
    setUser(user);

    // Check Role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    setIsAdmin(profile?.role === 'admin');

    fetchMessages();
    setupRealtime();
  }

  async function fetchMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(id, display_name, avatar_url, role)')
      .order('created_at', { ascending: true })
      .limit(100); // Last 100 messages

    if (!error) setMessages(data);
    setLoading(false);
  }

  function setupRealtime() {
    const channel = supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        // Fetch the full profile for the new message
        const { data } = await supabase
          .from('messages')
          .select('*, profiles(id, display_name, avatar_url, role)')
          .eq('id', payload.new.id)
          .single();
        
        if (data) setMessages((prev) => [...prev, data]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage;
    setNewMessage(''); // Optimistic clear

    await supabase.from('messages').insert({
      content: text,
      user_id: user.id
    });
  }

  async function handleDelete(id) {
    if (!confirm("Delete this message?")) return;
    await supabase.from('messages').delete().eq('id', id);
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-white">
      <div className="flex-none">
        <Navbar />
      </div>

      {/* CHAT HEADER */}
      <div className="bg-[#1e293b]/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
            Editors Community
          </h1>
          <p className="text-xs text-slate-400">Discussion, Help & Feedback</p>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {loading && <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-primary"/></div>}
        
        {!loading && messages.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <p>No messages yet. Be the first to say hello! 👋</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.user_id === user?.id;
          const isMsgAdmin = msg.profiles?.role === 'admin';

          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className="flex-shrink-0">
                <img 
                  src={msg.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${msg.profiles?.display_name || 'User'}`} 
                  className={`w-10 h-10 rounded-full object-cover border-2 ${isMsgAdmin ? 'border-red-500' : 'border-white/10'}`}
                />
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[80%] md:max-w-[60%] group relative`}>
                <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <span className={`text-xs font-bold ${isMsgAdmin ? 'text-red-400' : 'text-slate-300'}`}>
                    {msg.profiles?.display_name || 'User'}
                  </span>
                  {isMsgAdmin && <Shield size={12} className="text-red-400" />}
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-md ${
                  isMe 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'
                }`}>
                  {msg.content}
                </div>

                {/* Admin Delete Button */}
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(msg.id)}
                    className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition p-2 text-slate-500 hover:text-red-500 ${isMe ? '-left-8' : '-right-8'}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-[#1e293b] border-t border-white/10">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
          <input
            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition shadow-lg shadow-primary/20"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
