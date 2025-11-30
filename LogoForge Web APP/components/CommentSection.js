"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CommentSection({ logoId, user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [logoId]);

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(id, display_name, avatar_url, role, is_verified)')
      .eq('logo_id', logoId)
      .order('created_at', { ascending: false });
    setComments(data || []);
    setLoading(false);
  }

  async function postComment() {
    if (!newComment.trim()) return;
    if (!user) return alert("Please login to comment.");

    const { error } = await supabase.from('comments').insert({
      user_id: user.id,
      logo_id: logoId,
      content: newComment
    });

    if (!error) {
      setNewComment('');
      fetchComments();
    }
  }

  async function deleteComment(id) {
    if(!confirm("Delete comment?")) return;
    await supabase.from('comments').delete().eq('id', id);
    fetchComments();
  }

  return (
    <div className="bg-black/20 p-6 rounded-2xl border border-white/5 mt-8">
      <h3 className="text-lg font-bold text-white mb-4">Comments ({comments.length})</h3>
      
      {/* Input */}
      <div className="flex gap-2 mb-6">
        <input 
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
          placeholder="Ask about password or editing..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && postComment()}
        />
        <button onClick={postComment} className="bg-primary p-2 rounded-full text-white hover:brightness-110">
          <Send size={18} />
        </button>
      </div>

      {/* List */}
      <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Link href={`/channel/${c.profiles.id}`}>
               <img src={c.profiles.avatar_url || `https://ui-avatars.com/api/?name=${c.profiles.display_name}`} className="w-8 h-8 rounded-full object-cover border border-white/10" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 hover:text-white cursor-pointer">
                  {c.profiles.display_name}
                </span>
                <span className="text-[10px] text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                {user?.id === c.user_id && (
                  <button onClick={() => deleteComment(c.id)} className="text-red-500 hover:text-red-400 ml-auto">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-200 mt-1">{c.content}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && !loading && <p className="text-sm text-slate-500 text-center">No comments yet. Be the first!</p>}
      </div>
    </div>
  );
}
