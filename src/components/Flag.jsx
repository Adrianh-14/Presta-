const bars = (colors) => colors.map((color, index) => <rect key={`${color}-${index}`} y={(20 / colors.length) * index} width="30" height={20 / colors.length} fill={color} />);

export default function Flag({ country, className = '' }) {
  const children = {
    do: <><rect width="30" height="20" fill="#fff" /><rect width="12" height="8" fill="#002d62" /><rect x="18" width="12" height="8" fill="#ce1126" /><rect y="12" width="12" height="8" fill="#ce1126" /><rect x="18" y="12" width="12" height="8" fill="#002d62" /><path d="M14 0h2v20h-2zM0 9h30v2H0z" fill="#fff" /></>,
    us: <>{bars(['#b22234', '#fff', '#b22234', '#fff', '#b22234', '#fff', '#b22234'])}<rect width="13" height="10.8" fill="#3c3b6e" /></>,
    eu: <><rect width="30" height="20" fill="#039" /><circle cx="15" cy="10" r="5.5" fill="none" stroke="#fc0" strokeWidth="2" strokeDasharray="1 2.1" /></>,
    mx: <><rect width="10" height="20" fill="#006847" /><rect x="10" width="10" height="20" fill="#fff" /><rect x="20" width="10" height="20" fill="#ce1126" /><circle cx="15" cy="10" r="2" fill="#8c5a2b" /></>,
    gt: <><rect width="30" height="20" fill="#4997d0" /><rect x="10" width="10" height="20" fill="#fff" /><circle cx="15" cy="10" r="2" fill="#3a8b4a" /></>,
    hn: <><rect width="30" height="20" fill="#0073cf" /><rect y="7" width="30" height="6" fill="#fff" /><circle cx="12" cy="10" r="1" fill="#0073cf" /><circle cx="15" cy="10" r="1" fill="#0073cf" /><circle cx="18" cy="10" r="1" fill="#0073cf" /></>,
    ni: <><rect width="30" height="20" fill="#0067c6" /><rect y="7" width="30" height="6" fill="#fff" /><circle cx="15" cy="10" r="2" fill="#d9a400" /></>,
    cr: <><rect width="30" height="20" fill="#002b7f" /><rect y="3.3" width="30" height="13.4" fill="#fff" /><rect y="6.7" width="30" height="6.6" fill="#ce1126" /></>,
    pa: <><rect width="15" height="10" fill="#fff" /><rect x="15" width="15" height="10" fill="#d21034" /><rect y="10" width="15" height="10" fill="#005293" /><rect x="15" y="10" width="15" height="10" fill="#fff" /><circle cx="7.5" cy="5" r="2" fill="#005293" /><circle cx="22.5" cy="15" r="2" fill="#d21034" /></>,
    co: <><rect width="30" height="10" fill="#fcd116" /><rect y="10" width="30" height="5" fill="#003893" /><rect y="15" width="30" height="5" fill="#ce1126" /></>,
    pe: <><rect width="10" height="20" fill="#d91023" /><rect x="10" width="10" height="20" fill="#fff" /><rect x="20" width="10" height="20" fill="#d91023" /></>,
    br: <><rect width="30" height="20" fill="#009b3a" /><path d="M15 2L28 10 15 18 2 10z" fill="#ffdf00" /><circle cx="15" cy="10" r="5" fill="#002776" /></>,
    ar: <><rect width="30" height="6.7" fill="#74acdf" /><rect y="6.7" width="30" height="6.6" fill="#fff" /><rect y="13.3" width="30" height="6.7" fill="#74acdf" /><circle cx="15" cy="10" r="1.8" fill="#f6b40e" /></>,
    cl: <><rect width="30" height="10" fill="#fff" /><rect y="10" width="30" height="10" fill="#d52b1e" /><rect width="12" height="10" fill="#0039a6" /><path d="M6 2l1 3 3-.5-2.5 2 1 3-2.5-1.8L3.5 9.5l1-3-2.5-2 3 .5z" fill="#fff" /></>,
    ca: <><rect width="7" height="20" fill="#d52b1e" /><rect x="7" width="16" height="20" fill="#fff" /><rect x="23" width="7" height="20" fill="#d52b1e" /><path d="M15 4l1 4 3-1-2 3 3 2-4 .2.3 4-2.3-3-2.3 3 .3-4-4-.2 3-2-2-3 3 1z" fill="#d52b1e" /></>,
    gb: <><rect width="30" height="20" fill="#012169" /><path d="M0 0l30 20M30 0L0 20" stroke="#fff" strokeWidth="4" /><path d="M0 0l30 20M30 0L0 20" stroke="#c8102e" strokeWidth="2" /><path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" /><path d="M15 0v20M0 10h30" stroke="#c8102e" strokeWidth="3" /></>,
  }[String(country || '').toLowerCase()];

  return <svg viewBox="0 0 30 20" className={`inline-block h-5 w-8 shrink-0 rounded-[4px] shadow-[0_0_0_1px_rgba(7,27,46,.14)] ${className}`} role="img" aria-label="Bandera"><>{children || <rect width="30" height="20" fill="#d5dee7" />}</></svg>;
}
