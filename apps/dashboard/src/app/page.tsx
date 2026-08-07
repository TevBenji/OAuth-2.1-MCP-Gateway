import Link from 'next/link';
import {
  ShieldCheck,
  KeyRound,
  Network,
  ScrollText,
  LayoutDashboard,
  Github,
  Lock,
  ArrowRight,
  Check,
} from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'OAuth 2.1, done right',
    body: 'PKCE-mandatory flows, refresh token rotation, and dynamic client registration (RFC 7591) — the hard parts of auth, already built and battle-tested.',
  },
  {
    icon: KeyRound,
    title: 'Never ship an API key again',
    body: 'Static keys in config files are a breach waiting to happen. Clients get short-lived, scoped JWTs instead — leaked tokens expire, keys never had to exist.',
  },
  {
    icon: Network,
    title: 'MCP-native reverse proxy',
    body: 'Register your MCP servers once. The gateway authenticates every request, enforces scopes, and routes it to the right upstream — Claude, Cursor, any MCP client.',
  },
  {
    icon: Lock,
    title: 'Multi-tenant by design',
    body: 'Tenants, per-tenant OAuth clients, servers, and API keys with strict isolation in every query. One gateway can safely serve every team you have.',
  },
  {
    icon: ScrollText,
    title: 'Audit everything',
    body: 'A structured, compliance-taggable audit trail of every token issued and every request proxied. When someone asks "who accessed what?", you have the answer.',
  },
  {
    icon: LayoutDashboard,
    title: 'Yours, forever',
    body: 'MIT licensed, self-hosted, zero vendor lock-in. One docker compose up and the whole stack — gateway, dashboard, Postgres — belongs to you.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Deploy in one command',
    body: 'docker compose up — the gateway, admin dashboard, and PostgreSQL come online with migrations applied automatically.',
  },
  {
    number: '02',
    title: 'Register your MCP servers',
    body: 'Point the gateway at your MCP servers from the dashboard or the admin API. Each one gets a resource identifier and required scopes.',
  },
  {
    number: '03',
    title: 'Clients authenticate themselves',
    body: 'MCP clients discover your gateway, register dynamically, and complete a PKCE flow. From then on, every request is a scoped, expiring token.',
  },
];

export default function LandingPage() {
  return (
    <div className='bg-white text-wise-gray-900 antialiased'>
      <style>{`
        @keyframes rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .rise { animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .caret { animation: blink 1.1s step-end infinite; }
      `}</style>

      {/* Nav */}
      <header className='absolute inset-x-0 top-0 z-20'>
        <nav className='mx-auto flex max-w-6xl items-center justify-between px-6 py-5'>
          <Link href='/' className='flex items-center gap-2.5'>
            <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-wise-green-bright font-black text-wise-green-forest'>
              G
            </span>
            <span className='text-[15px] font-semibold tracking-tight text-white'>
              MCP Gateway
            </span>
          </Link>
          <div className='flex items-center gap-2'>
            <a
              href='https://github.com'
              className='hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:text-white sm:flex'
            >
              <Github className='h-4 w-4' />
              GitHub
            </a>
            <Link
              href='/sign-in'
              className='rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:text-white'
            >
              Sign in
            </Link>
            <Link
              href='/sign-up'
              className='rounded-full bg-wise-green-bright px-4 py-2 text-sm font-semibold text-wise-green-forest transition hover:brightness-110'
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className='relative overflow-hidden bg-wise-green-forest'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0'
          style={{
            background:
              'radial-gradient(60rem 32rem at 78% -10%, rgba(159,232,112,0.22), transparent 60%), radial-gradient(40rem 24rem at 8% 110%, rgba(29,185,84,0.18), transparent 65%)',
          }}
        />
        <div className='relative mx-auto grid max-w-6xl gap-14 px-6 pb-24 pt-36 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-32'>
          <div>
            <p className='rise mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-medium tracking-wide text-wise-green-bright'>
              <span className='h-1.5 w-1.5 rounded-full bg-wise-green-bright' />
              100% open source · MIT · Self-hosted
            </p>
            <h1
              className='rise text-[2.75rem] font-black leading-[1.04] tracking-tight text-white sm:text-6xl'
              style={{ animationDelay: '80ms' }}
            >
              Ship MCP servers.
              <br />
              <span className='text-wise-green-bright'>Never ship an API key</span> again.
            </h1>
            <p
              className='rise mt-6 max-w-xl text-lg leading-relaxed text-white/70'
              style={{ animationDelay: '160ms' }}
            >
              The open-source OAuth 2.1 gateway that stands in front of every Model Context
              Protocol server you run. Real authentication, scoped tokens, a full audit trail —
              and it all lives on your own infrastructure, free forever.
            </p>
            <div className='rise mt-9 flex flex-wrap gap-3' style={{ animationDelay: '240ms' }}>
              <Link
                href='/sign-up'
                className='group inline-flex items-center gap-2 rounded-full bg-wise-green-bright px-6 py-3.5 text-[15px] font-bold text-wise-green-forest transition hover:brightness-110'
              >
                Get started free
                <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
              </Link>
              <a
                href='#how-it-works'
                className='inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-[15px] font-semibold text-white transition hover:border-white/40'
              >
                See how it works
              </a>
            </div>
            <p
              className='rise mt-6 text-[13px] text-white/40'
              style={{ animationDelay: '320ms' }}
            >
              One command to deploy. No credit card, no cloud account, no strings.
            </p>
          </div>

          {/* Terminal card */}
          <div className='rise' style={{ animationDelay: '280ms' }}>
            <div className='overflow-hidden rounded-2xl border border-white/10 bg-[#0d2000] shadow-2xl shadow-black/40'>
              <div className='flex items-center gap-1.5 border-b border-white/10 px-4 py-3'>
                <span className='h-2.5 w-2.5 rounded-full bg-white/15' />
                <span className='h-2.5 w-2.5 rounded-full bg-white/15' />
                <span className='h-2.5 w-2.5 rounded-full bg-white/15' />
                <span className='ml-3 text-xs text-white/40'>you@yourserver</span>
              </div>
              <pre className='overflow-x-auto px-5 py-5 text-[13px] leading-6 text-white/80'>
                <code>
                  <span className='text-wise-green-bright'>$</span> docker compose up -d{'\n'}
                  <span className='text-white/40'>
                    ✓ postgres · gateway :8787 · dashboard :3000{'\n'}
                    ✓ migrations applied
                  </span>
                  {'\n\n'}
                  <span className='text-wise-green-bright'>$</span> curl -X POST
                  localhost:8787/oauth/register \{'\n'}
                  {'    '}-d {`'{"redirect_uris":["..."]}'`}{'\n'}
                  <span className='text-white/40'>{`{ "client_id": "mcp_client_…" }`}</span>
                  {'\n\n'}
                  <span className='text-wise-green-bright'>$</span>{' '}
                  <span className='text-white'>
                    # your MCP servers are now behind OAuth 2.1
                  </span>
                  <span className='caret text-wise-green-bright'>▍</span>
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className='relative border-t border-white/10'>
          <div className='mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-8 text-center sm:grid-cols-4'>
            {[
              ['422', 'automated tests, all green'],
              ['PKCE', 'mandatory on every flow'],
              ['MIT', 'licensed, forever'],
              ['$0', 'vendor fees, ever'],
            ].map(([stat, label]) => (
              <div key={label}>
                <p className='text-2xl font-black tracking-tight text-wise-green-bright'>{stat}</p>
                <p className='mt-1 text-[13px] text-white/50'>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className='mx-auto max-w-6xl px-6 py-24'>
        <div className='max-w-2xl'>
          <h2 className='text-3xl font-black tracking-tight text-wise-green-forest sm:text-4xl'>
            Everything between your MCP servers and the outside world.
          </h2>
          <p className='mt-4 text-lg text-wise-gray-500'>
            You built the servers. The gateway handles the part that keeps you up at night.
          </p>
        </div>
        <div className='mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {features.map(feature => (
            <div
              key={feature.title}
              className='group rounded-2xl border border-wise-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-wise-green-primary/40 hover:shadow-lg hover:shadow-wise-green-primary/5'
            >
              <span className='inline-flex h-10 w-10 items-center justify-center rounded-xl bg-wise-green-bright/20 text-wise-green-forest transition group-hover:bg-wise-green-bright/35'>
                <feature.icon className='h-5 w-5' />
              </span>
              <h3 className='mt-4 text-[17px] font-bold text-wise-green-forest'>
                {feature.title}
              </h3>
              <p className='mt-2 text-[15px] leading-relaxed text-wise-gray-500'>{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id='how-it-works' className='bg-wise-green-forest'>
        <div className='mx-auto max-w-6xl px-6 py-24'>
          <h2 className='max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl'>
            From <span className='text-wise-green-bright'>zero</span> to production auth in an
            afternoon.
          </h2>
          <div className='mt-14 grid gap-10 md:grid-cols-3'>
            {steps.map(step => (
              <div key={step.number} className='relative'>
                <p className='text-5xl font-black tracking-tight text-wise-green-bright/25'>
                  {step.number}
                </p>
                <h3 className='mt-3 text-lg font-bold text-white'>{step.title}</h3>
                <p className='mt-2 text-[15px] leading-relaxed text-white/60'>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className='mx-auto max-w-3xl px-6 py-24 text-center'>
        <h2 className='text-3xl font-black tracking-tight text-wise-green-forest sm:text-4xl'>
          Life&apos;s too short to rotate leaked keys.
        </h2>
        <p className='mx-auto mt-4 max-w-xl text-lg text-wise-gray-500'>
          Put real authentication in front of your MCP servers today — and never think about a
          pasted API key again.
        </p>
        <ul className='mx-auto mt-6 flex max-w-md flex-col items-center gap-2 text-[15px] text-wise-gray-600 sm:flex-row sm:justify-center sm:gap-6'>
          {['Self-hosted', 'Open source', 'Free forever'].map(item => (
            <li key={item} className='flex items-center gap-1.5'>
              <Check className='h-4 w-4 text-wise-green-primary' />
              {item}
            </li>
          ))}
        </ul>
        <div className='mt-9 flex flex-wrap justify-center gap-3'>
          <Link
            href='/sign-up'
            className='group inline-flex items-center gap-2 rounded-full bg-wise-green-forest px-7 py-3.5 text-[15px] font-bold text-wise-green-bright transition hover:brightness-125'
          >
            Start now — it&apos;s yours
            <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
          </Link>
          <Link
            href='/sign-in'
            className='inline-flex items-center rounded-full border border-wise-gray-300 px-7 py-3.5 text-[15px] font-semibold text-wise-green-forest transition hover:border-wise-green-forest'
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t border-wise-gray-200'>
        <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-[13px] text-wise-gray-500 sm:flex-row'>
          <p className='flex items-center gap-2'>
            <span className='flex h-6 w-6 items-center justify-center rounded-md bg-wise-green-bright text-[11px] font-black text-wise-green-forest'>
              G
            </span>
            OAuth 2.1 MCP Gateway · MIT License
          </p>
          <div className='flex items-center gap-5'>
            <a href='https://github.com' className='transition hover:text-wise-green-forest'>
              GitHub
            </a>
            <Link href='/sign-in' className='transition hover:text-wise-green-forest'>
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
