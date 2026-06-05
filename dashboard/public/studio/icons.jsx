// Icon set — single-stroke SVGs. Usage: <Icon name="bolt" />  /  <Icon name="x" cls="ic-lg" />
const ICON_PATHS = {
  search: <React.Fragment><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></React.Fragment>,
  bolt: <path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z"/>,
  plus: <React.Fragment><path d="M12 5v14"/><path d="M5 12h14"/></React.Fragment>,
  trash: <React.Fragment><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/></React.Fragment>,
  chevR: <path d="m9 6 6 6-6 6"/>,
  chevD: <path d="m6 9 6 6 6-6"/>,
  chevU: <path d="m6 15 6-6 6 6"/>,
  chevL: <path d="m15 6-6 6 6 6"/>,
  x: <React.Fragment><path d="M18 6 6 18"/><path d="m6 6 12 12"/></React.Fragment>,
  grid: <React.Fragment><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></React.Fragment>,
  home: <React.Fragment><path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.5V20h14V9.5"/></React.Fragment>,
  users: <React.Fragment><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.5a3 3 0 0 1 0 5.7"/><path d="M17.5 19a5 5 0 0 0-2.5-4.3"/></React.Fragment>,
  check: <path d="m5 12 5 5L20 6"/>,
  checkSquare: <React.Fragment><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="m8 12 3 3 5-6"/></React.Fragment>,
  target: <React.Fragment><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></React.Fragment>,
  megaphone: <React.Fragment><path d="M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1Z"/><path d="M18 8a4 4 0 0 1 0 8"/></React.Fragment>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h6a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>,
  doc: <React.Fragment><path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4"/></React.Fragment>,
  plug: <React.Fragment><path d="M9 3v5"/><path d="M15 3v5"/><path d="M6 8h12v3a6 6 0 0 1-12 0V8Z"/><path d="M12 17v4"/></React.Fragment>,
  settings: <React.Fragment><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L16.2 3h-4l-.4 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1c.6.5 1.3.9 2 1.2l.4 2.5h4l.4-2.5c.7-.3 1.4-.7 2-1.2l2.3 1 2-3.4-2-1.5c0-.4.1-.8.1-1.2Z"/></React.Fragment>,
  bell: <React.Fragment><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/></React.Fragment>,
  sparkle: <React.Fragment><path d="M12 3v6m0 6v6m9-9h-6m-6 0H3"/><path d="m6 6 3 3m6 6 3 3m0-12-3 3m-6 6-3 3" opacity=".4"/></React.Fragment>,
  trend: <React.Fragment><path d="M3 17 9 11l4 4 8-8"/><path d="M16 7h5v5"/></React.Fragment>,
  trendDn: <React.Fragment><path d="M3 7 9 13l4-4 8 8"/><path d="M16 17h5v-5"/></React.Fragment>,
  phone: <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5V18a2 2 0 0 1-2 2A14 14 0 0 1 4 6a2 2 0 0 1 1-2Z"/>,
  phoneMissed: <React.Fragment><path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5V18a2 2 0 0 1-2 2A14 14 0 0 1 4 6a2 2 0 0 1 1-2Z"/><path d="m16 3 5 5m0-5-5 5" strokeWidth="1.8"/></React.Fragment>,
  star: <path d="m12 3 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.2l5.9-.8L12 3Z"/>,
  crown: <React.Fragment><path d="M4 18h16M4 18l-1.5-9 5 4 4.5-7 4.5 7 5-4L20 18"/></React.Fragment>,
  calendar: <React.Fragment><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v4m8-4v4"/></React.Fragment>,
  globe: <React.Fragment><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.3 2.5 14.7 0 17M12 3.5c-2.5 2.3-2.5 14.7 0 17"/></React.Fragment>,
  eye: <React.Fragment><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></React.Fragment>,
  filter: <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"/>,
  dots: <React.Fragment><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></React.Fragment>,
  arrowR: <React.Fragment><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></React.Fragment>,
  arrowUpR: <React.Fragment><path d="M7 17 17 7"/><path d="M8 7h9v9"/></React.Fragment>,
  clock: <React.Fragment><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></React.Fragment>,
  flame: <path d="M12 3c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.5-2-1-2.5 0 1.5-1 2-1 2 .5-3-2.5-4.5-4-6.5Z"/>,
  euro: <React.Fragment><path d="M16 7a5.5 5.5 0 1 0 0 10"/><path d="M5 10.5h8M5 13.5h8"/></React.Fragment>,
  mail: <React.Fragment><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></React.Fragment>,
  msg: <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/>,
  layers: <React.Fragment><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></React.Fragment>,
  command: <path d="M9 6a2.5 2.5 0 1 0-2.5 2.5H18A2.5 2.5 0 1 0 15.5 6v12a2.5 2.5 0 1 0 2.5-2.5H6A2.5 2.5 0 1 0 8.5 18V6"/>,
  pin: <React.Fragment><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></React.Fragment>,
  edit: <React.Fragment><path d="M4 20h4l10-10-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></React.Fragment>,
  play: <path d="M7 5l11 7-11 7V5Z"/>,
  pause: <React.Fragment><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></React.Fragment>,
  refresh: <React.Fragment><path d="M4 9a8 8 0 0 1 14-3l2 2"/><path d="M20 5v4h-4"/><path d="M20 15a8 8 0 0 1-14 3l-2-2"/><path d="M4 19v-4h4"/></React.Fragment>,
  link: <React.Fragment><path d="M10 13a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5"/><path d="M14 11a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5"/></React.Fragment>,
  download: <React.Fragment><path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></React.Fragment>,
  pulse: <path d="M3 12h4l2-6 4 12 2-6h6"/>,
  inbox: <React.Fragment><path d="M3 13 6 5h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z"/><path d="M3 13h5l1.5 3h5L16 13h5"/></React.Fragment>,
  shield: <React.Fragment><path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z"/><path d="m9.5 12 1.8 1.8L15 10"/></React.Fragment>,
  hash: <path d="M5 9h14M5 15h14M9 4 7 20M17 4l-2 16"/>,
  list: <React.Fragment><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></React.Fragment>,
  collapse: <React.Fragment><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9 4v16"/></React.Fragment>,
  logout: <React.Fragment><path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"/><path d="M10 12h11m-4-4 4 4-4 4"/></React.Fragment>,
  copy: <React.Fragment><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></React.Fragment>
};

function Icon({ name, cls = "" }) {
  return (
    <svg className={"ic " + cls} viewBox="0 0 24 24" aria-hidden="true">
      {ICON_PATHS[name] || null}
    </svg>
  );
}

window.Icon = Icon;
