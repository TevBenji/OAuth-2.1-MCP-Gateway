import Link from 'next/link';
import {
  ShieldCheck,
  KeyRound,
  Network,
  ScrollText,
  Lock,
  Github,
  ArrowRight,
  Check,
  X,
  Container,
} from 'lucide-react';
import { ExplainerAnimation } from './explainer-animation';

const painPoints = [
  'API keys pasted into config files, committed to repos, shared in Slack',
  'No idea which client accessed which server, or when',
  'One leaked key means rotating everything and hoping for the best',
];

const fixes = [
  'Clients authenticate with OAuth 2.1 — PKCE required, no exceptions',
  'Every token is scoped, short-lived, and logged in a full audit trail',
  'Revoke one client in one click; nothing else is touched',
];

const features = [
  {
    icon: ShieldCheck,
    title: 'OAuth 2.1, by the book',
    body: 'Mandatory PKCE, refresh token rotation, RFC 7591 dynamic client registration, and RFC 8414 discovery. The standard, implemented properly.',
  },
  {
    icon: Network,
    title: 'MCP-native reverse proxy',
    body: 'Register your MCP servers once. The gateway authenticates every request, enforces scopes, and routes to the right upstream.',
  },
  {
    icon: Lock,
    title: 'Multi-tenant isolation',
    body: 'Tenants, clients, servers, and keys are isolated in every query. One gateway safely serves every team in your organization.',
  },
  {
    icon: ScrollText,
    title: 'Complete audit trail',
    body: 'Every token issued and every request proxied is recorded with compliance tags. "Who accessed what?" always has an answer.',
  },
  {
    icon: KeyRound,
    title: 'Admin dashboard included',
    body: 'Manage tenants, OAuth clients, and MCP servers from a clean web UI — with analytics and audit logs built in.',
  },
  {
    icon: Container,
    title: 'Self-hosted, MIT licensed',
    body: 'One docker compose up on your own infrastructure. No vendor, no fees, no lock-in — the whole stack is yours.',
  },
];

const steps = [
  {
    number: '1',
    title: 'Deploy',
    body: 'docker compose up brings up the gateway, dashboard, and PostgreSQL. Migrations run themselves.',
  },
  {
    number: '2',
    title: 'Register servers',
    body: 'Add your MCP servers in the dashboard. Each gets a resource identifier and required scopes.',
  },
  {
    number: '3',
    title: 'Connect clients',
    body: 'MCP clients discover the gateway and complete a PKCE flow. Every request from then on is a scoped, expiring token.',
  },
];

const faqs = [
  {
    q: 'Is it really free?',
    a: 'Yes. The entire stack is MIT licensed and self-hosted. There is no hosted tier, no usage meter, and no paid features — you run it on your own infrastructure.',
  },
  {
    q: 'Do I have to change my MCP servers?',
    a: 'No. The gateway sits in front of your existing servers as a reverse proxy. You register their endpoints; clients talk to the gateway instead of directly to them.',
  },
  {
    q: 'Which MCP clients work with it?',
    a: 'Any client that speaks OAuth 2.1 with PKCE — including Claude, Cursor, and other MCP clients. Clients can self-register via RFC 7591 dynamic registration.',
  },
  {
    q: 'What does it run on?',
    a: 'Node.js and PostgreSQL, packaged as Docker images. It runs on any VPS, home server, or container platform — a Railway deployment guide is included.',
  },
  {
    q: 'How production-ready is it?',
    a: 'The gateway ships with 400+ automated tests covering the OAuth flows, tenant isolation, and security paths, and the whole codebase is open for your own review.',
  },
];

export default function LandingPage() {
  return (
    <div className='bg-white text-wise-gray-900 antialiased'>
      {/* Nav */}
      <header className='bg-wise-green-forest'>
        <nav className='mx-auto flex h-16 max-w-6xl items-center justify-between px-6'>
          <Link href='/' className='flex items-center gap-2.5'>
            <span className='flex h-7 w-7 items-center justify-center rounded-md bg-wise-green-bright text-sm font-black text-wise-green-forest'>
              G
            </span>
            <span className='text-[15px] font-semibold tracking-tight text-white'>
              MCP Gateway
            </span>
          </Link>
          <div className='flex items-center gap-6'>
            <a
              href='https://github.com/TevBenji/OAuth-2.1-MCP-Gateway'
              className='hidden items-center gap-1.5 text-sm font-medium text-white/70 transition hover:text-white sm:flex'
            >
              <Github className='h-4 w-4' />
              GitHub
            </a>
            <Link
              href='/sign-in'
              className='text-sm font-medium text-white/70 transition hover:text-white'
            >
              Sign in
            </Link>
            <Link
              href='/sign-up'
              className='rounded-lg bg-wise-green-bright px-4 py-2 text-sm font-bold text-wise-green-forest transition hover:brightness-105'
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className='relative bg-wise-green-forest'>
        <div className='mx-auto grid max-w-6xl items-center gap-16 px-6 pb-20 pt-16 lg:grid-cols-2 lg:pb-24 lg:pt-24'>
          <div>
            <p className='mb-5 text-[13px] font-semibold uppercase tracking-[0.14em] text-wise-green-bright'>
              Open source · MIT · Self-hosted
            </p>
            <h1 className='text-[2.5rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-[3.25rem]'>
              Put real authentication in front of your MCP servers.
            </h1>
            <p className='mt-5 max-w-md text-[17px] leading-relaxed text-white/70'>
              An open-source OAuth 2.1 gateway that replaces pasted API keys with scoped,
              expiring tokens — deployed on your infrastructure in one command.
            </p>
            <div className='mt-8 flex flex-col gap-4 sm:flex-row sm:items-center'>
              <Link
                href='/sign-up'
                className='group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-wise-green-bright px-7 text-[15px] font-bold text-wise-green-forest transition hover:brightness-105'
              >
                Start free — deploy in minutes
                <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
              </Link>
              <a
                href='#how-it-works'
                className='text-[15px] font-semibold text-white/70 underline-offset-4 transition hover:text-white hover:underline sm:px-2'
              >
                See how it works
              </a>
            </div>
            <p className='mt-5 text-[13px] text-white/40'>
              No credit card. No cloud account. MIT licensed, forever.
            </p>
          </div>

          {/* Terminal */}
          <div className='w-full'>
            <div className='overflow-hidden rounded-xl border border-white/[0.08] bg-[#081400] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.6)]'>
              <div className='flex items-center justify-between border-b border-white/[0.08] px-4 py-2.5'>
                <div className='flex items-center gap-1.5'>
                  <span className='h-2.5 w-2.5 rounded-full bg-[#ff5f57]' />
                  <span className='h-2.5 w-2.5 rounded-full bg-[#febc2e]' />
                  <span className='h-2.5 w-2.5 rounded-full bg-[#28c840]' />
                </div>
                <span className='font-mono text-[11px] text-white/30'>zsh — deploy</span>
              </div>
              <pre className='overflow-x-auto p-5 font-mono text-[13px] leading-[1.7]'>
                <code>
                  <span className='text-wise-green-bright'>➜</span>{' '}
                  <span className='text-white'>docker compose up -d</span>
                  {'\n'}
                  <span className='text-white/35'>[+] Running 3/3</span>
                  {'\n'}
                  <span className='text-[#28c840]'> ✔</span>{' '}
                  <span className='text-white/60'>postgres</span>
                  <span className='text-white/35'>{'      '}Healthy</span>
                  {'\n'}
                  <span className='text-[#28c840]'> ✔</span>{' '}
                  <span className='text-white/60'>gateway</span>
                  <span className='text-white/35'>{'       '}Started · :8787</span>
                  {'\n'}
                  <span className='text-[#28c840]'> ✔</span>{' '}
                  <span className='text-white/60'>dashboard</span>
                  <span className='text-white/35'>{'     '}Started · :3000</span>
                  {'\n\n'}
                  <span className='text-wise-green-bright'>➜</span>{' '}
                  <span className='text-white'>curl localhost:8787/health</span>
                  {'\n'}
                  <span className='text-white/35'>{`{ "status": `}</span>
                  <span className='text-wise-green-bright'>&quot;healthy&quot;</span>
                  <span className='text-white/35'>{` }`}</span>
                </code>
              </pre>
            </div>
            <p className='mt-4 text-center font-mono text-[12px] text-white/30'>
              gateway · dashboard · postgres — one command
            </p>
          </div>
        </div>

        {/* Proof bar */}
        <div className='border-t border-white/[0.08]'>
          <div className='mx-auto grid max-w-6xl grid-cols-2 divide-white/[0.08] px-6 py-7 text-center sm:grid-cols-4 sm:divide-x'>
            {[
              ['400+', 'automated tests'],
              ['OAuth 2.1', 'PKCE mandatory'],
              ['RFC 7591', 'dynamic registration'],
              ['MIT', 'licensed, no fees'],
            ].map(([stat, label]) => (
              <div key={label} className='py-1'>
                <p className='text-lg font-bold tracking-tight text-white'>{stat}</p>
                <p className='mt-0.5 text-[13px] text-white/45'>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className='mx-auto max-w-6xl px-6 py-20 lg:py-24'>
        <p className='text-[13px] font-semibold uppercase tracking-[0.14em] text-wise-green-primary'>
          The problem
        </p>
        <h2 className='mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-wise-green-forest sm:text-4xl'>
          MCP adoption is exploding. MCP security hasn&apos;t caught up.
        </h2>
        <div className='mt-12 grid gap-6 lg:grid-cols-2'>
          <div className='rounded-xl border border-wise-gray-200 bg-wise-gray-50 p-7'>
            <p className='text-sm font-bold uppercase tracking-wide text-wise-gray-500'>
              Without a gateway
            </p>
            <ul className='mt-5 space-y-4'>
              {painPoints.map(item => (
                <li key={item} className='flex gap-3 text-[15px] leading-relaxed text-wise-gray-600'>
                  <X className='mt-0.5 h-5 w-5 shrink-0 text-wise-gray-400' />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className='rounded-xl border border-wise-green-primary/30 bg-wise-green-50 p-7'>
            <p className='text-sm font-bold uppercase tracking-wide text-wise-green-700'>
              With MCP Gateway
            </p>
            <ul className='mt-5 space-y-4'>
              {fixes.map(item => (
                <li key={item} className='flex gap-3 text-[15px] leading-relaxed text-wise-gray-700'>
                  <Check className='mt-0.5 h-5 w-5 shrink-0 text-wise-green-primary' />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className='border-y border-wise-gray-200 bg-wise-gray-50'>
        <div className='mx-auto max-w-6xl px-6 py-20 lg:py-24'>
          <p className='text-[13px] font-semibold uppercase tracking-[0.14em] text-wise-green-primary'>
            What you get
          </p>
          <h2 className='mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-wise-green-forest sm:text-4xl'>
            Everything between your servers and the outside world.
          </h2>
          <div className='mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            {features.map(feature => (
              <div key={feature.title} className='rounded-xl border border-wise-gray-200 bg-white p-6'>
                <span className='inline-flex h-9 w-9 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright'>
                  <feature.icon className='h-[18px] w-[18px]' />
                </span>
                <h3 className='mt-4 text-base font-bold text-wise-green-forest'>{feature.title}</h3>
                <p className='mt-1.5 text-[14px] leading-relaxed text-wise-gray-500'>
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id='how-it-works' className='mx-auto max-w-6xl px-6 py-20 lg:py-24'>
        <p className='text-[13px] font-semibold uppercase tracking-[0.14em] text-wise-green-primary'>
          How it works
        </p>
        <h2 className='mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-wise-green-forest sm:text-4xl'>
          Watch a request make it through.
        </h2>
        <div className='mt-10'>
          <ExplainerAnimation />
        </div>
        <div className='mt-12 grid gap-5 md:grid-cols-3'>
          {steps.map(step => (
            <div key={step.number} className='relative rounded-xl border border-wise-gray-200 p-6'>
              <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-wise-green-bright text-sm font-black text-wise-green-forest'>
                {step.number}
              </span>
              <h3 className='mt-4 text-base font-bold text-wise-green-forest'>{step.title}</h3>
              <p className='mt-1.5 text-[14px] leading-relaxed text-wise-gray-500'>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className='border-t border-wise-gray-200'>
        <div className='mx-auto max-w-3xl px-6 py-20 lg:py-24'>
          <h2 className='text-center text-3xl font-extrabold tracking-tight text-wise-green-forest'>
            Questions, answered.
          </h2>
          <div className='mt-10 divide-y divide-wise-gray-200 border-y border-wise-gray-200'>
            {faqs.map(faq => (
              <details key={faq.q} className='group py-5'>
                <summary className='flex cursor-pointer list-none items-center justify-between text-[15px] font-semibold text-wise-green-forest [&::-webkit-details-marker]:hidden'>
                  {faq.q}
                  <span className='ml-4 text-wise-gray-400 transition-transform group-open:rotate-45'>
                    +
                  </span>
                </summary>
                <p className='mt-3 text-[15px] leading-relaxed text-wise-gray-500'>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className='bg-wise-green-forest'>
        <div className='mx-auto max-w-3xl px-6 py-20 text-center lg:py-24'>
          <h2 className='text-3xl font-extrabold tracking-tight text-white sm:text-4xl'>
            Your MCP servers, properly secured — tonight.
          </h2>
          <p className='mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-white/60'>
            One command to deploy. One evening to never worry about a pasted API key again.
          </p>
          <div className='mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
            <Link
              href='/sign-up'
              className='group inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-wise-green-bright px-8 text-[15px] font-bold text-wise-green-forest transition hover:brightness-105 sm:w-auto'
            >
              Get started free
              <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
            </Link>
            <a
              href='https://github.com/TevBenji/OAuth-2.1-MCP-Gateway'
              className='inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-8 text-[15px] font-semibold text-white transition hover:border-white/50 sm:w-auto'
            >
              <Github className='h-4 w-4' />
              View the source
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-wise-green-forest'>
        <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/[0.08] px-6 py-8 text-[13px] text-white/40 sm:flex-row'>
          <p>OAuth 2.1 MCP Gateway · MIT License</p>
          <div className='flex items-center gap-6'>
            <a href='https://github.com/TevBenji/OAuth-2.1-MCP-Gateway' className='transition hover:text-white'>
              GitHub
            </a>
            <Link href='/sign-in' className='transition hover:text-white'>
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
