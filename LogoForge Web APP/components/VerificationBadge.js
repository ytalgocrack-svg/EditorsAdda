import { CheckCircle, ShieldCheck } from 'lucide-react';

export default function VerificationBadge({ role, isVerified }) {
  if (role === 'admin') {
    return <ShieldCheck size={16} className="text-yellow-400 fill-yellow-400/20 inline-block ml-1" title="Admin" />;
  }
  if (isVerified) {
    return <CheckCircle size={16} className="text-blue-500 fill-blue-500/10 inline-block ml-1" title="Verified Creator" />;
  }
  return null;
}
