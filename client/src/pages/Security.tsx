import { Shield, Lock, Cpu, EyeOff, CheckCircle } from 'lucide-react';

export default function Security() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-6 py-8 text-left animate-fade-in">
      <div className="border-b border-brand-200 pb-4">
        <span className="text-[10px] font-bold text-accent-600 tracking-widest uppercase font-mono bg-accent-50 px-2 py-0.5 rounded border border-accent-100">
          Security Specifications
        </span>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 mt-2">
          Security Specs & Protocol Controls
        </h1>
        <p className="text-xs md:text-sm text-brand-500 mt-1">
          Technical specifications of our SMTP probe sandbox, data boundaries, and memory lifecycle.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bg-white border border-brand-200 rounded-lg p-3.5 shadow-[0_1px_1.5px_rgba(0,0,0,0.01)]">
          <div className="text-[9px] font-bold text-brand-400 uppercase tracking-wider">Storage Retention</div>
          <div className="text-base font-extrabold text-neutral-900 mt-1">0 Days (Volatile)</div>
        </div>
        <div className="bg-white border border-brand-200 rounded-lg p-3.5 shadow-[0_1px_1.5px_rgba(0,0,0,0.01)]">
          <div className="text-[9px] font-bold text-brand-400 uppercase tracking-wider">Socket Protocol</div>
          <div className="text-base font-extrabold text-neutral-900 mt-1">SMTP + TLS 1.3</div>
        </div>
        <div className="bg-white border border-brand-200 rounded-lg p-3.5 shadow-[0_1px_1.5px_rgba(0,0,0,0.01)]">
          <div className="text-[9px] font-bold text-brand-400 uppercase tracking-wider">Compliance</div>
          <div className="text-base font-extrabold text-neutral-900 mt-1">SOC 2 Type II</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-8 flex flex-col gap-4">
          <div className="bg-white border border-brand-200 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-neutral-900 text-white rounded-md shrink-0"><Cpu className="w-4 h-4" /></div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-sm text-neutral-900">SMTP Handshake Sandbox</h3>
                <span className="text-[9px] font-mono font-bold text-brand-400">ISOLATED SOCKET TUNNEL</span>
                <p className="text-[11px] text-brand-500 leading-relaxed mt-1.5">
                  Our system simulates a standard SMTP transmission over a raw socket but strictly terminates the transaction before the message payload step. The sequence follows a safe protocol interaction:
                </p>
                <div className="bg-neutral-50 border border-brand-100 p-3 rounded-md font-mono text-[10px] text-brand-600 mt-3 space-y-1">
                  <div className="text-brand-400">// Handshake Sequence</div>
                  <div>1. Resolve MX Host of the domain (DNS lookup)</div>
                  <div>2. Establish TCP connection on Port 25 / 587</div>
                  <div>3. Execute HELO/EHLO handshake greetings</div>
                  <div>4. Send <span className="text-brand-900 font-bold">MAIL FROM:&lt;sandbox@verify.io&gt;</span></div>
                  <div>5. Send <span className="text-brand-900 font-bold">RCPT TO:&lt;target@email.com&gt;</span></div>
                  <div>6. Parse response code (e.g., <span className="text-success-text">250 OK</span>, <span className="text-danger-text">550 User Unknown</span>)</div>
                  <div>7. Send <span className="text-brand-900 font-semibold">QUIT</span> and shut down socket instantly</div>
                </div>
                <p className="text-[11px] text-brand-500 leading-relaxed mt-3">
                  This transaction is entirely read-only. We do not transmit actual email headers or body copy, meaning no spam indicators are triggered and your sender IP scores are preserved.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-brand-200 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-neutral-900 text-white rounded-md shrink-0"><EyeOff className="w-4 h-4" /></div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-sm text-neutral-900">Zero Server-Side Storage</h3>
                <span className="text-[9px] font-mono font-bold text-brand-400">VOLATILE IN-MEMORY LIFECYCLE</span>
                <p className="text-[11px] text-brand-500 leading-relaxed mt-1.5">
                  We do not write lists, records, or results to server hard drives or active database tables. All validations are processed in-memory. Usage logs store only counts and metadata (no email content). History is persisted locally in your browser.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-brand-200 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-neutral-900 text-white rounded-md shrink-0"><Lock className="w-4 h-4" /></div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-sm text-neutral-900">End-to-End Transport Security</h3>
                <span className="text-[9px] font-mono font-bold text-brand-400">TLS 1.3 / HTTPS</span>
                <p className="text-[11px] text-brand-500 leading-relaxed mt-1.5">
                  Every socket transaction utilizes TLS 1.3 encryption. All API traffic is transmitted over HTTPS. API keys are stored as SHA-256 hashes in our database and never logged in plaintext.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-neutral-900 text-white rounded-lg p-4 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-2.5">
              <Shield className="w-4 h-4 text-accent-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Specs Checklist</h4>
            </div>
            <div className="flex flex-col gap-3 font-mono text-[10px]">
              {[
                { title: 'No SMTP Relaying', desc: 'We prevent relaying to block malicious mail injections.' },
                { title: 'In-Memory Processing', desc: 'All validation runs in volatile memory, never on disk.' },
                { title: 'API Key Hashing', desc: 'Keys stored as SHA-256 hashes. Raw keys never logged.' },
                { title: 'Rate Limiting', desc: 'Per-key rate limits prevent abuse and DDoS attacks.' },
              ].map(({ title, desc }) => (
                <div key={title} className="flex items-start gap-2 text-left">
                  <CheckCircle className="w-3.5 h-3.5 text-accent-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-neutral-200">{title}</div>
                    <div className="text-neutral-400 text-[9px] mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-brand-200 rounded-lg p-4 text-left">
            <h4 className="text-[10px] font-bold text-neutral-900 uppercase tracking-tight">Zero Server Footprint</h4>
            <p className="text-[11px] text-brand-500 mt-1 leading-relaxed">
              Because we don't store your proprietary lists on any databases, your lists are immune to third-party server-side data leaks or compliance violations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
