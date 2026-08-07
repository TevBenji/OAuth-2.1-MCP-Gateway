/**
 * Auto-looping animated explainer (pure CSS, no JS, no video files).
 * A 16s timeline in four 4s phases:
 *   1. MCP client asks for access
 *   2. Gateway runs the OAuth 2.1 + PKCE handshake
 *   3. A scoped, expiring token reaches the MCP server
 *   4. Everything lands in the audit trail
 */
import { Bot, ShieldCheck, Server, ScrollText } from 'lucide-react';

const captions = [
  {
    phase: 'p1',
    title: '1 · A client asks for access',
    body: 'Claude, Cursor, or any MCP client discovers your gateway and requests access — no API key involved.',
  },
  {
    phase: 'p2',
    title: '2 · The gateway authenticates it',
    body: 'A full OAuth 2.1 handshake with mandatory PKCE. The client proves who it is, every single time.',
  },
  {
    phase: 'p3',
    title: '3 · A scoped token reaches your server',
    body: 'The request is proxied to your MCP server with a short-lived JWT — only the scopes it needs, nothing more.',
  },
  {
    phase: 'p4',
    title: '4 · Everything is on the record',
    body: 'Every token and every request lands in the audit trail. Revoke any client in one click.',
  },
];

export function ExplainerAnimation() {
  return (
    <div className='overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B1D00]'>
      <style>{`
        .xp-stage * { box-sizing: border-box; }
        @keyframes xpNode1 { 0%, 2% { opacity: .35 } 5%, 22% { opacity: 1 } 25%, 100% { opacity: .35 } }
        @keyframes xpNode2 { 0%, 24% { opacity: .35 } 28%, 47% { opacity: 1 } 50%, 100% { opacity: .35 } }
        @keyframes xpNode3 { 0%, 49% { opacity: .35 } 53%, 72% { opacity: 1 } 75%, 100% { opacity: .35 } }
        @keyframes xpNode4 { 0%, 74% { opacity: .35 } 78%, 95% { opacity: 1 } 98%, 100% { opacity: .35 } }
        @keyframes xpDash { to { stroke-dashoffset: -28; } }
        @keyframes xpLine1 { 0%, 3% { opacity: 0 } 8%, 22% { opacity: 1 } 27%, 100% { opacity: 0 } }
        @keyframes xpLine2 { 0%, 51% { opacity: 0 } 56%, 72% { opacity: 1 } 77%, 100% { opacity: 0 } }
        @keyframes xpShield { 0%, 26% { transform: scale(1); opacity: .35 } 31% { transform: scale(1.12); opacity: 1 } 36%, 47% { transform: scale(1); opacity: 1 } 52%, 100% { transform: scale(1); opacity: .35 } }
        @keyframes xpToken {
          0%, 53% { opacity: 0; transform: translateX(0); }
          56% { opacity: 1; transform: translateX(0); }
          70% { opacity: 1; transform: translateX(var(--xp-travel, 190px)); }
          73%, 100% { opacity: 0; transform: translateX(var(--xp-travel, 190px)); }
        }
        @keyframes xpAudit1 { 0%, 76% { opacity: 0; transform: translateY(4px) } 80%, 96% { opacity: 1; transform: translateY(0) } 100% { opacity: 0 } }
        @keyframes xpAudit2 { 0%, 80% { opacity: 0; transform: translateY(4px) } 84%, 96% { opacity: 1; transform: translateY(0) } 100% { opacity: 0 } }
        @keyframes xpAudit3 { 0%, 84% { opacity: 0; transform: translateY(4px) } 88%, 96% { opacity: 1; transform: translateY(0) } 100% { opacity: 0 } }
        @keyframes xpCap1 { 0%, 1% { opacity: 0; transform: translateY(6px) } 4%, 22% { opacity: 1; transform: translateY(0) } 25%, 100% { opacity: 0; transform: translateY(-6px) } }
        @keyframes xpCap2 { 0%, 26% { opacity: 0; transform: translateY(6px) } 29%, 47% { opacity: 1; transform: translateY(0) } 50%, 100% { opacity: 0; transform: translateY(-6px) } }
        @keyframes xpCap3 { 0%, 51% { opacity: 0; transform: translateY(6px) } 54%, 72% { opacity: 1; transform: translateY(0) } 75%, 100% { opacity: 0; transform: translateY(-6px) } }
        @keyframes xpCap4 { 0%, 76% { opacity: 0; transform: translateY(6px) } 79%, 97% { opacity: 1; transform: translateY(0) } 100% { opacity: 0 } }
        @keyframes xpBar { from { width: 0 } to { width: 100% } }
        .xp-anim { animation-duration: 16s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
        .xp-dashline { stroke-dasharray: 6 8; animation: xpDash 1.1s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .xp-anim, .xp-dashline, .xp-bar { animation: none !important; opacity: 1 !important; }
        }
      `}</style>

      {/* Stage */}
      <div className='xp-stage relative px-6 pb-2 pt-8 sm:px-10'>
        <div className='relative mx-auto flex max-w-3xl items-start justify-between gap-3'>
          {/* Client node */}
          <div className='xp-anim relative z-10 flex w-24 flex-col items-center text-center sm:w-32' style={{ animationName: 'xpNode1' }}>
            <span className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-wise-green-bright'>
              <Bot className='h-7 w-7' />
            </span>
            <p className='mt-2.5 text-[13px] font-bold text-white'>MCP client</p>
            <p className='text-[11px] text-white/40'>Claude · Cursor</p>
          </div>

          {/* Connector 1 */}
          <div className='relative mt-7 h-px flex-1'>
            <svg className='xp-anim absolute inset-x-0 top-0 h-2 w-full overflow-visible' style={{ animationName: 'xpLine1' }} aria-hidden>
              <line x1='0' y1='1' x2='100%' y2='1' stroke='#9FE870' strokeWidth='2' className='xp-dashline' />
            </svg>
            <div className='absolute inset-x-0 top-0 h-px bg-white/10' />
          </div>

          {/* Gateway node */}
          <div className='relative z-10 flex w-28 flex-col items-center text-center sm:w-36'>
            <span
              className='xp-anim flex h-16 w-16 items-center justify-center rounded-2xl bg-wise-green-bright text-wise-green-forest shadow-[0_0_40px_-8px_rgba(159,232,112,0.45)]'
              style={{ animationName: 'xpShield' }}
            >
              <ShieldCheck className='h-8 w-8' />
            </span>
            <p className='mt-2.5 text-[13px] font-bold text-white'>MCP Gateway</p>
            <p className='text-[11px] text-white/40'>OAuth 2.1 · PKCE</p>
            {/* Token chip that travels to the server */}
            <span
              className='xp-anim absolute -right-4 top-5 z-20 rounded-md border border-wise-green-bright/60 bg-[#0B1D00] px-2 py-0.5 font-mono text-[10px] font-bold text-wise-green-bright'
              style={{ animationName: 'xpToken', ['--xp-travel' as never]: 'min(11rem, 22vw)' }}
            >
              JWT · scoped
            </span>
          </div>

          {/* Connector 2 */}
          <div className='relative mt-7 h-px flex-1'>
            <svg className='xp-anim absolute inset-x-0 top-0 h-2 w-full overflow-visible' style={{ animationName: 'xpLine2' }} aria-hidden>
              <line x1='0' y1='1' x2='100%' y2='1' stroke='#9FE870' strokeWidth='2' className='xp-dashline' />
            </svg>
            <div className='absolute inset-x-0 top-0 h-px bg-white/10' />
          </div>

          {/* Server node */}
          <div className='xp-anim relative z-10 flex w-24 flex-col items-center text-center sm:w-32' style={{ animationName: 'xpNode3' }}>
            <span className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-wise-green-bright'>
              <Server className='h-7 w-7' />
            </span>
            <p className='mt-2.5 text-[13px] font-bold text-white'>Your MCP servers</p>
            <p className='text-[11px] text-white/40'>untouched</p>
          </div>
        </div>

        {/* Audit ticker */}
        <div className='xp-anim mx-auto mt-8 max-w-md rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3' style={{ animationName: 'xpNode4' }}>
          <p className='flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/50'>
            <ScrollText className='h-3.5 w-3.5' /> Audit trail
          </p>
          <div className='mt-2 space-y-1 font-mono text-[11px]'>
            <p className='xp-anim text-white/60' style={{ animationName: 'xpAudit1' }}>
              <span className='text-[#28c840]'>✔</span> token issued · client mcp_client_9f2 · scope mcp:tools:read
            </p>
            <p className='xp-anim text-white/60' style={{ animationName: 'xpAudit2' }}>
              <span className='text-[#28c840]'>✔</span> request proxied · server weather-api · 200 OK
            </p>
            <p className='xp-anim text-white/60' style={{ animationName: 'xpAudit3' }}>
              <span className='text-[#28c840]'>✔</span> logged · tenant default · 12ms
            </p>
          </div>
        </div>
      </div>

      {/* Captions */}
      <div className='relative mx-auto h-24 max-w-xl px-6 sm:h-20'>
        {captions.map((caption, i) => (
          <div
            key={caption.phase}
            className='xp-anim absolute inset-x-6 top-3 text-center opacity-0'
            style={{ animationName: `xpCap${i + 1}` }}
          >
            <p className='text-[15px] font-bold text-wise-green-bright'>{caption.title}</p>
            <p className='mx-auto mt-1 max-w-lg text-[13px] leading-relaxed text-white/60'>
              {caption.body}
            </p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className='h-1 w-full bg-white/[0.06]'>
        <div
          className='xp-anim xp-bar h-full bg-wise-green-bright/70'
          style={{ animationName: 'xpBar', animationTimingFunction: 'linear' }}
        />
      </div>
    </div>
  );
}
