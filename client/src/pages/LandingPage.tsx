import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, Shield, Zap, AlertTriangle, ArrowRight, HelpCircle, Server, FileSpreadsheet, Check } from 'lucide-react';
import type { FAQItem } from '@/types';

const FAQS: FAQItem[] = [
  {
    question: "How does the SMTP-powered mailbox verification work?",
    answer: "Our engine performs a real-time MX record lookup to locate the recipient's mail servers. It then opens a secure socket connection to simulate an SMTP handshake, inquiring if the mailbox exists without ever sending an actual message. This prevents spam flags while ensuring high precision.",
  },
  {
    question: "What are the rate limits per tier?",
    answer: "Free tier: 10 requests/min, 50 emails per batch, 500 emails/day. Pro tier: 100 requests/min, 1,000 emails per batch, 50,000 emails/day. Enterprise tier: 1,000 requests/min, 10,000 emails per batch, unlimited daily.",
  },
  {
    question: "Do you maintain databases of disposable domains?",
    answer: "Yes. Our database tracks over 160,000 temporary mail generators, burner domains, and wildcard mail redirections, updated regularly with security intelligence feeds.",
  },
  {
    question: "Is this platform compliant with privacy and GDPR regulations?",
    answer: "Absolutely. We do not store, distribute, or serialize the emails you upload beyond usage counting. All validation happens in real-time, and no email content is persisted. We support SOC 2 compliance standards.",
  },
];

const FEATURES = [
  { icon: Server, title: 'SMTP Mailbox Probe', desc: 'Connects directly to the recipient mail server via a sandboxed socket to confirm the account actually exists without delivering spam.' },
  { icon: Shield, title: 'Disposable Shield', desc: 'Identifies temporary and burner mail providers (like Mailinator or GuerrillaMail) to prevent high-churn fake registrations.' },
  { icon: AlertTriangle, title: 'Smart Typo Prevention', desc: 'Fuzzy match domain typo suggestions (e.g. gamil, hotmial) and alerts users to increase valid capture rates.' },
  { icon: FileSpreadsheet, title: 'Bulk CSV Multi-Parser', desc: 'Seamlessly accepts drag-and-drop spreadsheets, isolates the email column dynamically, and exports structured results.' },
  { icon: Zap, title: 'Concurrent Handshakes', desc: 'Processes checks concurrently with high-efficiency thread division, verifying thousands of rows in seconds.' },
  { icon: CheckCircle2, title: '0-100 Reputation Scoring', desc: 'Every email gets a composite score, marking them as Deliverable, Risky, or Undeliverable.' },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/forever',
    features: ['10 requests/min', '50 emails per batch', '500 emails/day', 'All 5 validators', 'API access'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    features: ['100 requests/min', '1,000 emails per batch', '50,000 emails/day', 'All 5 validators', 'Priority support', 'Webhook callbacks'],
    cta: 'Start Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: '/month',
    features: ['1,000 requests/min', '10,000 emails per batch', 'Unlimited daily', 'All 5 validators', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="bg-neutral-50 text-neutral-900 min-h-screen flex flex-col">
      {/* Trust Banner */}
      <div className="bg-brand-900 text-white text-xs py-2 px-4 text-center font-medium tracking-tight">
        Trusted by lead generation teams at top-tier agencies and high-growth sales organizations.
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 md:py-12 flex flex-col gap-14">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-10 items-center">
          <div className="flex-1 flex flex-col gap-4 text-left max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-accent-50 border border-accent-100 text-accent-700 text-[10px] font-bold w-fit font-mono uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
              API v1.0 (Secure)
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 leading-[1.1]">
              Verify thousands of emails with confidence.
            </h1>
            <p className="text-xs md:text-sm text-brand-600 leading-relaxed">
              SMTP-powered validation without expensive third-party subscriptions. Eliminate hard bounces, protect your sender score, and clean lists with maximum speed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-1">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors text-xs shadow-sm no-underline"
              >
                Start Verifying Free
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <a
                href="/docs"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-white border border-brand-200 text-brand-700 font-medium hover:bg-neutral-100 transition-colors text-xs no-underline"
              >
                View API Docs
              </a>
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-brand-200 pt-4 mt-2">
              <div>
                <div className="text-base font-bold text-brand-900 font-mono">99.9%</div>
                <div className="text-[10px] text-brand-500 font-semibold uppercase tracking-tight">Delivery Target</div>
              </div>
              <div>
                <div className="text-base font-bold text-brand-900 font-mono">5-Layer</div>
                <div className="text-[10px] text-brand-500 font-semibold uppercase tracking-tight">Validation</div>
              </div>
              <div>
                <div className="text-base font-bold text-brand-900 font-mono">0%</div>
                <div className="text-[10px] text-brand-500 font-semibold uppercase tracking-tight">Data Retention</div>
              </div>
            </div>
          </div>

          {/* Terminal Preview */}
          <div className="flex-1 w-full max-w-md">
            <div className="bg-white border border-brand-200 rounded-lg shadow-sm overflow-hidden font-mono text-[11px]">
              <div className="bg-neutral-50 border-b border-brand-200 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-200" />
                  <span className="text-brand-500 text-[9px] ml-1.5 font-bold">API_VALIDATION_LOG</span>
                </div>
                <span className="text-[9px] text-accent-600 bg-accent-50 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">Live</span>
              </div>
              <div className="p-3.5 bg-white flex flex-col gap-2.5">
                <div className="text-brand-400 text-[10px]">// POST /api/v1/validate/bulk</div>
                <div className="flex flex-col gap-1.5 bg-neutral-50 p-2.5 rounded-md border border-brand-100">
                  <div className="flex justify-between items-center pb-1.5 border-b border-brand-100">
                    <span className="text-brand-700 font-bold text-[10px]">results</span>
                    <span className="text-brand-400 text-[9px]">620 emails/sec</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1 text-[10px] text-brand-600">
                    <div className="flex items-center gap-2 text-success-text">
                      <span className="w-1 h-1 rounded-full bg-success-solid" />
                      <span>sarah@company.io</span>
                      <span className="ml-auto text-[9px] bg-success-soft px-1 py-0.2 rounded border border-success-border font-bold">Score 92</span>
                    </div>
                    <div className="flex items-center gap-2 text-danger-text">
                      <span className="w-1 h-1 rounded-full bg-danger-solid" />
                      <span>john@gamil.com</span>
                      <span className="ml-auto text-[9px] text-brand-500 font-sans font-medium">Typo: gmail.com?</span>
                    </div>
                    <div className="flex items-center gap-2 text-warning-text">
                      <span className="w-1 h-1 rounded-full bg-warning-solid" />
                      <span>temp@mailinator.com</span>
                      <span className="ml-auto text-[9px] bg-warning-soft px-1 py-0.2 rounded border border-warning-border font-bold">Disposable</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="flex-1 bg-brand-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-neutral-900 h-full w-[84%]" />
                  </div>
                  <span className="text-brand-900 font-bold font-mono">84% Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="border-y border-brand-200 py-5 flex flex-col gap-2.5 text-center">
          <div className="text-[9px] uppercase font-bold text-brand-400 tracking-wider font-mono">
            ENGINE TRUSTED BY DEMAND GENERATION LEADERS AT
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-brand-500 font-bold tracking-tight text-[11px] font-mono">
            <span className="hover:text-brand-900 transition-colors cursor-default">Vercel Group</span>
            <span className="hover:text-brand-900 transition-colors cursor-default">Linear Operations</span>
            <span className="hover:text-brand-900 transition-colors cursor-default">Stripe Billing</span>
            <span className="hover:text-brand-900 transition-colors cursor-default">Mercury Bank</span>
            <span className="hover:text-brand-900 transition-colors cursor-default">Resend Systems</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="flex flex-col gap-6">
          <div className="text-center max-w-lg mx-auto flex flex-col gap-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              Validated on 5 security checkpoints.
            </h2>
            <p className="text-xs text-brand-500">
              No generic regex-only checks. Our pipeline evaluates every email on a holistic multi-step scorecard.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-brand-200 p-4 rounded-lg flex flex-col gap-2.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                <div className="w-7 h-7 rounded bg-neutral-900 text-white flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-brand-900 text-xs">{title}</h3>
                <p className="text-[11px] text-brand-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="flex flex-col gap-6 border-t border-brand-200 pt-10">
          <div className="text-center max-w-lg mx-auto flex flex-col gap-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">Simple, transparent pricing</h2>
            <p className="text-xs text-brand-500">Start free, upgrade when you need more volume.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(({ name, price, period, features, highlighted }) => (
              <div
                key={name}
                className={`bg-white border rounded-lg p-5 flex flex-col gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)] ${
                  highlighted ? 'border-accent-500 ring-1 ring-accent-500' : 'border-brand-200'
                }`}
              >
                {highlighted && (
                  <span className="text-[9px] font-bold text-accent-600 bg-accent-50 border border-accent-100 px-2 py-0.5 rounded w-fit uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="font-bold text-brand-900 text-sm">{name}</h3>
                  <div className="flex items-baseline gap-0.5 mt-1">
                    <span className="text-2xl font-bold text-brand-900 font-mono">{price}</span>
                    <span className="text-xs text-brand-400">{period}</span>
                  </div>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[11px] text-brand-600">
                      <Check className="w-3.5 h-3.5 text-success-solid shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-colors no-underline ${
                    highlighted
                      ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                      : 'bg-white border border-brand-200 text-brand-700 hover:bg-neutral-100'
                  }`}
                >
                  {name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="flex flex-col md:flex-row gap-8 border-t border-brand-200 pt-10">
          <div className="flex-1 text-left max-w-sm flex flex-col gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">Frequently Asked Questions</h2>
            <p className="text-[11px] text-brand-500 leading-relaxed">
              Have questions about email verifications, rate limiting, or SMTP socket handshake timeouts? Reach out to our technical support team.
            </p>
          </div>
          <div className="flex-1 flex flex-col gap-2.5">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white border border-brand-200 rounded-md overflow-hidden transition-all shadow-[0_1px_1.5px_rgba(0,0,0,0.01)] text-left">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-brand-900 font-semibold text-xs text-left hover:bg-neutral-50 cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <HelpCircle className={`w-3.5 h-3.5 text-brand-400 transition-transform ${activeFaq === idx ? 'rotate-180 text-accent-600' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-3 text-[11px] text-brand-500 leading-relaxed border-t border-brand-100 pt-2 bg-brand-50/10">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-white border border-brand-200 rounded-lg p-6 md:p-8 text-center flex flex-col items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div className="w-10 h-10 rounded-md bg-neutral-950 text-white flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div className="max-w-md flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-brand-900 tracking-tight">Ready to verify with authority?</h3>
            <p className="text-xs text-brand-500 leading-relaxed">
              Launch our clean, lightning-fast workspace. Import emails directly via CSV, or paste your raw lists instantly.
            </p>
          </div>
          <Link
            to="/signup"
            className="px-4 py-2 rounded-md bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors text-xs flex items-center gap-1.5 shadow-sm no-underline"
          >
            Get Started Free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
