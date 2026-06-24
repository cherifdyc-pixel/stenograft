'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

const RED    = '#E0492F';
const GOLD   = '#C9A24B';
const BG     = '#000000';
const BORDER = '#1C1C1C';
const TEXT   = '#E7E9EA';
const TEXT2  = '#71767B';
const MUTED  = '#444444';

type NavItem  = { href: string; icon: string; label: string; exact: boolean; notifBadge?: boolean; msgBadge?: boolean };
type NavGroup = { label: string; icon: string; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

const NAV: NavEntry[] = [
  { href: '/dashboard',               icon: '🏠',  label: 'Le Fil',       exact: true  },
  { href: '/dashboard/recherche',     icon: '🔎',  label: 'Recherche',    exact: false },
  { href: '/dashboard/explorer',      icon: '🔭',  label: 'Explorer',     exact: false },
  { href: '/dashboard/notifications', icon: '🔔',  label: 'Notifications',exact: false, notifBadge: true },
  { href: '/dashboard/messages',      icon: '💬',  label: 'Messages',     exact: false, msgBadge: true   },
  { href: '/dashboard/live',          icon: '🔴',  label: 'STENO LIVE',   exact: false },
  { href: '/dashboard/profil',        icon: '👤',  label: 'Profil',       exact: false },
  { href: '/dashboard/parametres',    icon: '⚙️',  label: 'Paramètres',  exact: false },
  {
    label: 'Plus', icon: '···',
    items: [
      { href: '/dashboard/tendances',   icon: '🔥',  label: 'Tendances',    exact: false },
      { href: '/dashboard/abonnements', icon: '❤️',  label: 'Abonnements',  exact: false },
      { href: '/dashboard/tv',          icon: '📺',  label: 'STENO TV',     exact: false },
      { href: '/dashboard/chaines',     icon: '📡',  label: 'Chaînes',      exact: false },
      { href: '/dashboard/podcasts',    icon: '🎙️', label: 'Podcasts',     exact: false },
      { href: '/dashboard/studio',      icon: '🎬',  label: 'STENO STUDIO', exact: false },
      { href: '/dashboard/ia',          icon: '🤖',  label: 'Grafter IA',   exact: false },
      { href: '/dashboard/actualites',  icon: '📰',  label: "L'Actu",       exact: false },
      { href: '/dashboard/territoires', icon: '🗺️',  label: 'Territoires',  exact: false },
      { href: '/dashboard/alertes',     icon: '🔔',  label: 'Alertes',      exact: false },
      { href: '/dashboard/registre',    icon: '🏛️',  label: 'Mon Registre', exact: false },
    ],
  },
];

function isGroup(e: NavEntry): e is NavGroup { return 'items' in e; }
function active(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export default function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();

  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [openGroups,  setOpenGroups]  = useState<Record<string, boolean>>({ 'Plus': false });
  const [display,     setDisplay]     = useState('…');
  const [handle,      setHandle]      = useState('…');
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null);
  const [unreadN,     setUnreadN]     = useState(0);
  const [unreadM,     setUnreadM]     = useState(0);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Fetch user + counts
  useEffect(() => {
    const supabase = createClient();
    let cleanup: (() => void) | undefined;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const meta = user.user_metadata;
      setHandle(meta?.username ?? user.email?.split('@')[0] ?? 'grafter');
      setDisplay(meta?.display_name ?? meta?.username ?? user.email?.split('@')[0] ?? 'Grafter');

      const { data: prof } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle();
      if (prof?.avatar_url) setAvatarUrl(prof.avatar_url);

      const fetchN = async () => {
        const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false);
        setUnreadN(count ?? 0);
      };
      await fetchN();

      const fetchM = async () => {
        const { data: convs } = await supabase.from('conversations').select('id').or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);
        const ids = (convs ?? []).map((c: { id: string }) => c.id);
        if (!ids.length) { setUnreadM(0); return; }
        const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).in('conversation_id', ids).neq('sender_id', user.id).eq('lu', false);
        setUnreadM(count ?? 0);
      };
      await fetchM();

      const ch = supabase.channel('bn-notifs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchN)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchM)
        .subscribe();
      cleanup = () => supabase.removeChannel(ch);
    };

    init();
    return () => { cleanup?.(); };
  }, []);

  const toggleGroup = (label: string) => setOpenGroups(p => ({ ...p, [label]: !p[label] }));

  const openGrafter = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('sg:grafter'));
    if (pathname !== '/dashboard') router.push('/dashboard');
  };

  const openLive = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('sg:start-live'));
    if (!pathname.startsWith('/dashboard/live')) router.push('/dashboard/live');
    setDrawerOpen(false);
  };

  const notifOn = active(pathname, '/dashboard/notifications', false);
  const avatarLetter = display[0]?.toUpperCase() ?? '?';

  // ── Drawer nav item renderer ───────────────────────────────────────────────
  const DrawerItem = ({ item, indent = false }: { item: NavItem; indent?: boolean }) => {
    const on    = active(pathname, item.href, item.exact);
    const badge = item.notifBadge ? unreadN : item.msgBadge ? unreadM : 0;
    return (
      <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 10px', borderRadius: '100px', marginBottom: '1px', background: on ? `${RED}12` : 'transparent', transition: 'background 0.12s', paddingLeft: indent ? '14px' : '10px' }}
          onMouseEnter={e => { if (!on) e.currentTarget.style.background = '#0f0f0f'; }}
          onMouseLeave={e => { if (!on) e.currentTarget.style.background = on ? `${RED}12` : 'transparent'; }}
        >
          <span style={{ fontSize: indent ? '16px' : '18px', lineHeight: 1, width: indent ? '20px' : '22px', textAlign: 'center', flexShrink: 0, position: 'relative', display: 'inline-block' }}>
            {item.icon}
            {badge > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-5px', background: RED, color: '#fff', borderRadius: '50%', fontSize: '8px', fontWeight: 700, minWidth: '13px', height: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #000', padding: '0 2px' }}>
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </span>
          <span style={{ color: TEXT, fontSize: indent ? '14px' : '15px', fontWeight: on ? 800 : 400, letterSpacing: '-0.1px', flex: 1 }}>{item.label}</span>
          {on && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: RED, flexShrink: 0 }} />}
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* ── Overlay ── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 490, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
        />
      )}

      {/* ── Drawer ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '285px', zIndex: 500,
        background: BG, borderRight: `1px solid ${BORDER}`,
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.27s cubic-bezier(0.4,0,0.2,1)',
        overflowY: 'auto', scrollbarWidth: 'none',
        display: 'flex', flexDirection: 'column',
        padding: '0 10px 32px',
      }}>

        {/* Header: logo + close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 4px 10px', flexShrink: 0 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>S</div>
            <div>
              <span style={{ color: TEXT, fontSize: '14px', fontWeight: 900, letterSpacing: '1.5px', display: 'block', lineHeight: 1 }}>STENOGRAFT</span>
              <span style={{ color: GOLD, fontSize: '9px', fontWeight: 700, letterSpacing: '3px', display: 'block', opacity: 0.85 }}>SOUVERAIN</span>
            </div>
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: TEXT2, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >✕</button>
        </div>

        {/* Profile card */}
        <Link
          href="/dashboard/profil"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 8px', borderRadius: '14px', margin: '0 0 4px', transition: 'background 0.12s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#0f0f0f')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg,${RED} 0%,#8B1A15 100%)`, border: `2px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '17px', fontWeight: 900, overflow: 'hidden' }}>
            {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarLetter}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: TEXT, fontSize: '15px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display}</p>
            <p style={{ color: MUTED, fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{handle}</p>
          </div>
        </Link>

        <div style={{ height: '1px', background: BORDER, margin: '2px 0 8px' }} />

        {/* Nav */}
        <nav>
          {NAV.map(entry => {
            if (!isGroup(entry)) return <DrawerItem key={(entry as NavItem).href} item={entry as NavItem} />;

            const group = entry as NavGroup;
            const isOpen = openGroups[group.label] ?? true;
            const hasActive = group.items.some(it => active(pathname, it.href, it.exact));

            return (
              <div key={group.label} style={{ marginBottom: '2px' }}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '9px 10px', borderRadius: '100px', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0a0a0a')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1, width: '22px', textAlign: 'center', flexShrink: 0 }}>{group.icon}</span>
                  <span style={{ color: hasActive ? RED : TEXT2, fontSize: '14px', fontWeight: hasActive ? 700 : 500, flex: 1, textAlign: 'left' }}>{group.label}</span>
                  <span style={{ color: TEXT2, fontSize: '13px', transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</span>
                </button>
                {isOpen && (
                  <div style={{ paddingLeft: '8px' }}>
                    {group.items.map(item => <DrawerItem key={item.href} item={item} indent />)}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ height: '1px', background: BORDER, margin: '10px 0' }} />

        {/* Action buttons */}
        <button
          onClick={() => { openGrafter(); setDrawerOpen(false); }}
          style={{ width: '100%', padding: '14px 0', background: RED, border: 'none', borderRadius: '100px', color: '#fff', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 20px ${RED}45`, marginBottom: '8px', letterSpacing: '0.2px' }}
        >
          Grafter
        </button>
        <button
          onClick={openLive}
          style={{ width: '100%', padding: '11px 0', background: 'transparent', border: `1.5px solid ${RED}`, borderRadius: '100px', color: RED, fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
        >
          🔴 Démarrer un Live
        </button>

        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div style={{ padding: '16px 4px 0', marginTop: '16px' }}>
          <p style={{ fontSize: '10px', lineHeight: 1.8, margin: '0 0 2px' }}>
            <Link href="/dashboard/cgu" style={{ color: MUTED, textDecoration: 'none' }}>CGU</Link>
            {' · '}
            <Link href="/dashboard/confidentialite" style={{ color: MUTED, textDecoration: 'none' }}>Confidentialité</Link>
            {' · '}
            <Link href="/dashboard/parametres" style={{ color: MUTED, textDecoration: 'none' }}>Paramètres</Link>
          </p>
          <p style={{ color: MUTED, fontSize: '10px', margin: 0 }}>© 2026 STENOGRAFT 🇫🇷</p>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <nav
        className="sg-bottom-nav"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300,
          background: `${BG}F2`,
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderTop: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: '4px 8px calc(4px + env(safe-area-inset-bottom))',
        }}
      >
        {/* Le Fil */}
        <BarTab href="/dashboard" icon="🏠" label="Le Fil" exact pathname={pathname} />

        {/* Recherche */}
        <BarTab href="/dashboard/recherche" icon="🔎" label="Recherche" exact={false} pathname={pathname} />

        {/* Grafter — central red button */}
        <button
          onClick={openGrafter}
          style={{
            width: '50px', height: '50px', borderRadius: '50%',
            background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`,
            border: 'none', color: '#fff', fontSize: '22px',
            cursor: 'pointer', flexShrink: 0,
            boxShadow: `0 4px 18px ${RED}65`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '6px', transition: 'transform 0.12s',
          }}
          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.92)')}
          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
        >✎</button>

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '52px', opacity: notifOn ? 1 : 0.4, transition: 'opacity 0.15s' }}
        >
          <span style={{ fontSize: '22px', lineHeight: 1, position: 'relative', display: 'inline-block' }}>
            🔔
            {unreadN > 0 && (
              <span style={{ position: 'absolute', top: '-3px', right: '-5px', background: RED, color: '#fff', borderRadius: '50%', fontSize: '8px', fontWeight: 700, minWidth: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #000', padding: '0 2px' }}>
                {unreadN > 9 ? '9+' : unreadN}
              </span>
            )}
          </span>
          <span style={{ fontSize: '10px', color: notifOn ? RED : '#666', fontWeight: notifOn ? 700 : 400 }}>Notifs</span>
        </Link>

        {/* Profil → ouvre le drawer */}
        <button
          onClick={() => setDrawerOpen(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', minWidth: '52px', padding: 0, opacity: drawerOpen ? 1 : 0.6, transition: 'opacity 0.15s' }}
        >
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `linear-gradient(135deg,${RED} 0%,#8B1A15 100%)`, border: `2px solid ${drawerOpen ? GOLD : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 900, overflow: 'hidden', transition: 'border-color 0.15s', flexShrink: 0 }}>
            {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarLetter}
          </div>
          <span style={{ fontSize: '10px', color: drawerOpen ? RED : '#666', fontWeight: drawerOpen ? 700 : 400 }}>Profil</span>
        </button>
      </nav>
    </>
  );
}

function BarTab({ href, icon, label, exact, pathname }: { href: string; icon: string; label: string; exact: boolean; pathname: string }) {
  const on = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '52px', opacity: on ? 1 : 0.4, transition: 'opacity 0.15s' }}>
      <span style={{ fontSize: '22px', lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: '10px', color: on ? RED : '#666', fontWeight: on ? 700 : 400 }}>{label}</span>
    </Link>
  );
}
