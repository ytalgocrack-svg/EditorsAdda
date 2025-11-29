"use client";
import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto close after 3 seconds
    return () => clearTimeout(timer);
  }, []);

  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
        type === 'success' ? 'bg-white border-green-100' : 'bg-white border-red-100'
      }`}>
        {type === 'success' ? <CheckCircle className="text-green-500"/> : <XCircle className="text-red-500"/>}
        <div>
          <h4 className={`font-bold ${type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {type === 'success' ? 'Success' : 'Error'}
          </h4>
          <p className="text-slate-500 text-sm">{message}</p>
        </div>
        <button onClick={onClose} className="ml-4 text-slate-400 hover:text-slate-600"><X size={16}/></button>
      </div>
    </div>
  );
}
