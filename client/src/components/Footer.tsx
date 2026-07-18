import { Link } from 'react-router-dom';
import { Shield, FileText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-brand-200 bg-white py-6 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-[11px] text-brand-400 font-mono">
          &copy; {new Date().getFullYear()} Bulk Email Verifier. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <Link to="/security" className="flex items-center gap-1 text-brand-500 hover:text-brand-900 transition-colors no-underline">
            <Shield className="w-3 h-3" />
            Security
          </Link>
          <Link to="/gdpr" className="flex items-center gap-1 text-brand-500 hover:text-brand-900 transition-colors no-underline">
            <FileText className="w-3 h-3" />
            GDPR
          </Link>
          <a href="/docs" className="text-brand-500 hover:text-brand-900 transition-colors no-underline">
            API Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
