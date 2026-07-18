import { ShieldCheck, EyeOff, FileText, CheckCircle2, UserCheck, Trash2 } from 'lucide-react';

export default function Gdpr() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-6 py-8 text-left animate-fade-in">
      <div className="border-b border-brand-200 pb-4">
        <span className="text-[10px] font-bold text-success-text tracking-widest uppercase font-mono bg-success-soft px-2 py-0.5 rounded border border-success-border">
          Compliance & Regulatory
        </span>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 mt-2">
          GDPR Compliance & Data Protection
        </h1>
        <p className="text-xs md:text-sm text-brand-500 mt-1">
          How our zero-retention verification architecture aligns with the General Data Protection Regulation (EU 2016/679).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-8 flex flex-col gap-4">
          {[
            {
              icon: UserCheck,
              title: '1. Data Controller vs. Processor (Article 28)',
              text: 'Users act as the Data Controller for any lists they upload. The Bulk Email Verifier platform acts strictly as the Data Processor, executing instructions solely to confirm validity and check records.',
            },
            {
              icon: EyeOff,
              title: '2. Data Minimization (Article 5(1)(c))',
              text: 'We collect and process only the minimum personal data necessary. The engine requires an email string only; we do not ingest names, IP addresses, phone numbers, or other personal data.',
            },
            {
              icon: Trash2,
              title: '3. Right to Erasure (Article 17)',
              text: 'Because our server does not write uploaded data to disk, compliance with the Right to Erasure is instantaneous. Once you clear the workspace, all volatile memory buffers are purged.',
            },
            {
              icon: FileText,
              title: '4. No Profiling (Article 22)',
              text: 'We never cross-match uploaded emails to construct profiles, train models, or sell lead data to third parties. Every upload is private, siloed, and isolated.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white border border-brand-200 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-neutral-900 text-white rounded-md shrink-0"><Icon className="w-4 h-4" /></div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-sm text-neutral-900">{title}</h3>
                  <p className="text-[11px] text-brand-500 leading-relaxed mt-1.5">{text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-success-soft border border-success-border text-success-text rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 border-b border-success-border/30 pb-2">
              <ShieldCheck className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">GDPR Checklist</h4>
            </div>
            <div className="flex flex-col gap-2.5 text-[10.5px] leading-relaxed">
              {[
                'Zero server logging of email content.',
                'TLS 1.3 for all connections.',
                'No cookies or tracking scripts.',
                'Full customer data ownership.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success-solid shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-brand-200 rounded-lg p-4 text-left">
            <h4 className="text-[10px] font-bold text-neutral-900 uppercase tracking-tight">Compliance Verification</h4>
            <p className="text-[11px] text-brand-500 mt-1 leading-relaxed">
              Need a Data Processing Addendum (DPA) or custom compliance review? Contact our support team for detailed documentation of our architecture.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
