"use strict";
/* ============================================================
   Margem · diário de leitura open source (MIT)
   Tudo fica no seu aparelho (IndexedDB). Sem conta, sem servidor.
   ============================================================ */

const DAY = 86400000;
const $ = (s, el = document) => el.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const dkey = t => { const d = new Date(t); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
const sod = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const addDays = (t, n) => { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); };
const MES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const MES3 = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const DSEM = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
const fmtDate = t => { const d = new Date(t); return d.getDate() + " " + MES3[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? " " + d.getFullYear() : ""); };
const hms = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 3600) + ":" + pad(Math.floor(s % 3600 / 60)) + ":" + pad(s % 60); };
const hmin = s => { const m = Math.round(s / 60); return m < 60 ? m + "min" : Math.floor(m / 60) + "h" + (m % 60 ? pad(m % 60) : ""); };
const clock = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600); return (h ? h + ":" : "") + pad(Math.floor(s % 3600 / 60)) + ":" + pad(s % 60); };
const plural = (n, a, b) => n + " " + (n === 1 ? a : b);

/* ---------------- ícones ---------------- */
const sv = (p, w = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I = {
  home: sv('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>'),
  shelf: sv('<path d="M4 4v16M8.5 4v16M13 6l4.5 14M3 20h18"/>'),
  notes: sv('<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4M8.5 12h7M8.5 16h5"/>'),
  cards: sv('<rect x="3.5" y="6.5" width="13" height="14" rx="2"/><path d="M7.5 3.5h11a2 2 0 0 1 2 2v12"/>'),
  chart: sv('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  gear: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>', 2.2),
  cam: sv('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  img: sv('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'),
  search: sv('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>'),
  star: sv('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
  starF: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  mic: sv('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c1 3.5 5 5.6 5 10.5A5 5 0 0 1 12 18a5 5 0 0 1-5-5.2c0-2 1-3.4 2-4.3.2 1.7 1 2.7 2 3 0-3.4.4-6.6 1-9.5zM7.5 19.5h9a4.5 4.5 0 0 1-9 0z" opacity=".95"/></svg>',
  x: sv('<path d="M6 6l12 12M18 6 6 18"/>', 2),
  back: sv('<path d="M15 5l-7 7 7 7"/>', 2),
  left: sv('<path d="M14.5 6 8.5 12l6 6"/>', 2),
  right: sv('<path d="m9.5 6 6 6-6 6"/>', 2),
  trash: sv('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  edit: sv('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  check: sv('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 2.2),
  book: sv('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>'),
  clock: sv('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  quote: sv('<path d="M7 7h4v4c0 3-1.5 5-4 6M15 7h4v4c0 3-1.5 5-4 6"/>'),
  bulb: sv('<path d="M9 18h6M10 21h4M8.5 14.5A6 6 0 1 1 15.5 14.5c-.8.7-1.5 1.6-1.5 2.5h-4c0-.9-.7-1.8-1.5-2.5z"/>'),
  medal: sv('<circle cx="12" cy="14" r="5.5"/><path d="M8.5 9.5 6 3h4l2 4 2-4h4l-2.5 6.5"/>'),
  barcode: sv('<path d="M4 5v14M7 5v14M10.5 5v14M13 5v14M16.5 5v14M20 5v14"/>'),
  download: sv('<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'),
  upload: sv('<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14"/>'),
  copy: sv('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  heart: sv('<path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.3 4.5 4.5 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>'),
};
/* marca: um marcador de página */
const MARK = `<svg viewBox="0 0 22 26" aria-hidden="true"><path d="M3 1.5h16v23l-8-6.2-8 6.2z" fill="currentColor"/></svg>`;
const MARK_NIGHT = `<svg viewBox="0 0 22 26" aria-hidden="true"><path d="M3 1.5h16v23l-8-6.2-8 6.2z" fill="currentColor"/></svg>`;

/* ---------------- armazenamento (IndexedDB, com plano B em memória) ---------------- */
const DB = {
  db: null,
  open() {
    return new Promise(res => {
      try {
        const r = indexedDB.open("margem", 1);
        r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("kv"); d.createObjectStore("img"); };
        r.onsuccess = () => { this.db = r.result; res(true); };
        r.onerror = () => res(false);
        r.onblocked = () => res(false);
      } catch (e) { res(false); }
    });
  },
  tx(store, mode, fn) {
    return new Promise(res => {
      if (!this.db) return res(undefined);
      try {
        const t = this.db.transaction(store, mode); const os = t.objectStore(store);
        const out = fn(os);
        t.oncomplete = () => res(out && "result" in out ? out.result : true);
        t.onerror = () => res(undefined);
      } catch (e) { res(undefined); }
    });
  },
  get(store, key) { return this.tx(store, "readonly", os => os.get(key)); },
  set(store, key, val) { return this.tx(store, "readwrite", os => { os.put(val, key); }); },
  del(store, key) { return this.tx(store, "readwrite", os => { os.delete(key); }); },
  clear(store) { return this.tx(store, "readwrite", os => { os.clear(); }); },
  async entries(store) {
    if (!this.db) return [];
    const keys = await this.tx(store, "readonly", os => os.getAllKeys());
    const vals = await this.tx(store, "readonly", os => os.getAll());
    return (keys || []).map((k, i) => [k, (vals || [])[i]]);
  }
};
const IMG = {}; // id -> dataURL
async function putImg(dataURL) { const id = "i" + uid(); IMG[id] = dataURL; await DB.set("img", id, dataURL); return id; }
async function dropImg(id) { if (!id) return; delete IMG[id]; await DB.del("img", id); }

const DEFAULT = () => ({
  v: 1, books: [], sessions: [], notes: [], cards: [], reviews: [],
  folders: ["Geral", "Ideias", "Para reler"],
  wishlist: [],
  settings: { name: "", weekGoal: 210, yearGoal: 12, theme: "system" },
  active: null, seeded: false, createdAt: Date.now()
});
let S = DEFAULT();
let saveT = null;
function save() { clearTimeout(saveT); saveT = setTimeout(() => DB.set("kv", "state", S), 250); }

/* ---------------- estado da interface ---------------- */
const UI = { view: "home", bookId: null, shelfF: "all", shelfMode: "covers", q: "", nf: "all", nq: "", bookTab: "notes", calM: sod(new Date(new Date().setDate(1))), period: "week", back: "shelf" };

/* ---------------- dados de exemplo (marcados, removíveis) ---------------- */
function seed() {
  const now = Date.now();
  const mk = (o) => Object.assign({ id: uid(), author: "", pages: 200, currentPage: 0, status: "quero", genre: "", color: "#5B3A29", coverId: null, coverUrl: null, rating: 0, review: "", addedAt: now - 30 * DAY, startedAt: null, finishedAt: null, sample: true }, o);
  const b1 = mk({ title: "Dom Casmurro", author: "Machado de Assis", pages: 256, currentPage: 172, status: "lendo", genre: "Romance", color: "#9A3B2E", startedAt: now - 16 * DAY });
  const b2 = mk({ title: "Meditações", author: "Marco Aurélio", pages: 254, currentPage: 88, status: "lendo", genre: "Filosofia", color: "#2F5D57", startedAt: now - 12 * DAY });
  const b3 = mk({ title: "O Alienista", author: "Machado de Assis", pages: 96, currentPage: 96, status: "lido", genre: "Novela", color: "#4A3768", startedAt: now - 28 * DAY, finishedAt: now - 19 * DAY, rating: 5, review: "Curto e afiado. A Casa Verde vai enchendo até a ironia virar contra o próprio Bacamarte." });
  const b4 = mk({ title: "Memórias Póstumas de Brás Cubas", author: "Machado de Assis", pages: 240, currentPage: 0, status: "quero", genre: "Romance", color: "#B07A1E" });
  const b5 = mk({ title: "Os Sertões", author: "Euclides da Cunha", pages: 600, currentPage: 0, status: "quero", genre: "História", color: "#1F3A68" });
  S.books.push(b1, b2, b3, b4, b5);
  const plan = [[19,b3,42,24],[18,b3,35,20],[17,b3,40,22],[16,b1,28,18],[15,b1,51,30],[13,b1,33,21],[12,b2,25,14],[11,b1,46,26],[10,b2,30,16],[9,b1,38,22],[7,b2,22,12],[6,b1,55,31],[5,b1,31,19],[4,b2,27,15],[3,b1,44,25],[2,b2,36,18],[1,b1,29,16]];
  for (const [ago, b, min, pg] of plan) {
    const start = sod(now - ago * DAY) + (20 + (ago % 4)) * 3600000 + (ago * 7 % 50) * 60000;
    S.sessions.push({ id: uid(), bookId: b.id, start, end: start + min * 60000, sec: min * 60, pages: pg, pageTo: 0, sample: true });
  }
  const n = (bookId, text, o = {}) => S.notes.push(Object.assign({ id: uid(), bookId, text, title: "", page: null, folder: "Geral", fav: false, kind: "insight", color: 1, imgId: null, createdAt: now - Math.floor(Math.random() * 14) * DAY, sample: true }, o));
  n(b1.id, "Olhos de cigana oblíqua e dissimulada.", { kind: "quote", page: 63, fav: true, color: 3, title: "José Dias sobre Capitu" });
  n(b1.id, "O narrador é advogado e conduz o leitor como num julgamento. Tudo o que sei de Capitu passa pela memória do Bentinho velho. Ler desconfiando.", { title: "Narrador não confiável", folder: "Ideias", color: 1 });
  n(b2.id, "Separar o que depende de mim do que não depende. Ele volta nesse ponto quase todo capítulo, como quem treina.", { title: "Dicotomia do controle", fav: true, color: 2, folder: "Ideias" });
  n(b2.id, "São anotações pessoais, não um livro pensado para publicar. Muda a forma de ler: é um diário de treino mental.", { title: "Contexto da obra", color: 4 });
  n(b3.id, "A Casa Verde começa com poucos internos e termina com quase a vila toda. O critério de loucura muda de mão a cada capítulo.", { title: "Escalada da Casa Verde", color: 5, folder: "Para reler" });
  const c = (bookId, front, back, dueIn, reps) => S.cards.push({ id: uid(), bookId, front, back, ease: 2.5, interval: Math.max(0, reps * 2), reps, lapses: 0, due: sod(now) + dueIn * DAY + 3600000, createdAt: now - 10 * DAY, sample: true });
  c(b1.id, "Quem narra Dom Casmurro?", "Bento Santiago, o Bentinho, já mais velho, relembrando a juventude.", 0, 1);
  c(b1.id, "Como José Dias descreve os olhos de Capitu?", "Olhos de cigana oblíqua e dissimulada.", 0, 2);
  c(b1.id, "Qual é a grande dúvida que o livro deixa em aberto?", "Se Capitu traiu Bentinho com Escobar.", 2, 2);
  c(b3.id, "Em que vila se passa O Alienista?", "Itaguaí.", 0, 1);
  c(b3.id, "Como se chama o hospício fundado por Simão Bacamarte?", "Casa Verde.", 4, 3);
  c(b2.id, "O que é a dicotomia do controle?", "Distinguir o que depende de nós (juízos, escolhas) do que não depende (corpo, fama, os outros) e só se ocupar do primeiro.", 0, 0);
  S.reviews.push(...[3,3,2,2,1,1,1].map((ago, i) => ({ t: now - ago * DAY, g: 2, sample: true })));
  S.seeded = true;
}
function clearSamples() {
  S.books = S.books.filter(b => !b.sample); S.sessions = S.sessions.filter(x => !x.sample);
  S.notes = S.notes.filter(x => !x.sample); S.cards = S.cards.filter(x => !x.sample); S.reviews = S.reviews.filter(x => !x.sample);
  if (S.active && !S.books.find(b => b.id === S.active.bookId)) S.active = null;
  save(); toast("Exemplos removidos. A estante é toda sua."); render();
}
const hasSamples = () => S.books.some(b => b.sample) || S.notes.some(n => n.sample) || S.cards.some(c => c.sample);

/* ---------------- números ---------------- */
function dayMap() {
  const m = {};
  for (const s of S.sessions) { const k = dkey(s.start); const e = m[k] || (m[k] = { sec: 0, pages: 0, n: 0 }); e.sec += s.sec; e.pages += s.pages; e.n++; }
  return m;
}
function streak(m) {
  let t = sod(Date.now()); if (!m[dkey(t)]) t = addDays(t, -1);
  let n = 0; while (m[dkey(t)]) { n++; t = addDays(t, -1); } return n;
}
function bestStreak(m) {
  const ks = Object.keys(m).sort(); let best = 0, cur = 0, prev = null;
  for (const k of ks) { const t = new Date(k + "T12:00:00").getTime(); cur = prev && Math.round((t - prev) / DAY) === 1 ? cur + 1 : 1; best = Math.max(best, cur); prev = t; }
  return best;
}
function weekStart(t = Date.now()) { const d = new Date(sod(t)); const wd = (d.getDay() + 6) % 7; return addDays(d.getTime(), -wd); }
function weekSec(m) { const ws = weekStart(); let s = 0; for (let i = 0; i < 7; i++) s += (m[dkey(addDays(ws, i))] || {}).sec || 0; return s; }
function totals() {
  const pages = S.sessions.reduce((a, s) => a + s.pages, 0), sec = S.sessions.reduce((a, s) => a + s.sec, 0);
  const done = S.books.filter(b => b.status === "lido").length;
  return { pages, sec, done };
}
function xpInfo() {
  const t = totals();
  const xp = t.pages * 10 + Math.floor(t.sec / 60) + t.done * 200 + S.reviews.length * 2 + S.notes.length * 5;
  const lvl = Math.floor(Math.sqrt(xp / 120)) + 1;
  const cur = 120 * (lvl - 1) ** 2, next = 120 * lvl ** 2;
  const titles = ["Leitor curioso", "Folheador", "Leitor de cabeceira", "Leitor assíduo", "Devorador de páginas", "Rato de biblioteca", "Bibliófilo", "Erudito", "Guardião da estante"];
  return { xp, lvl, cur, next, title: titles[Math.min(titles.length - 1, Math.floor((lvl - 1) / 3))] };
}
function bookStats(b) {
  const ss = S.sessions.filter(s => s.bookId === b.id);
  const sec = ss.reduce((a, s) => a + s.sec, 0), pages = ss.reduce((a, s) => a + s.pages, 0);
  const pph = sec > 0 ? pages / (sec / 3600) : 0;
  // previsão: média de páginas por dia nos últimos 14 dias de leitura deste livro
  const since = Date.now() - 14 * DAY; const recent = ss.filter(s => s.start >= since).reduce((a, s) => a + s.pages, 0);
  const perDay = recent / 14; const left = Math.max(0, (b.pages || 0) - (b.currentPage || 0));
  const eta = b.status === "lendo" && perDay > 0 && left > 0 ? Date.now() + Math.ceil(left / perDay) * DAY : null;
  return { ss, sec, pages, pph, eta, left };
}
const pct = b => b.pages ? Math.min(100, Math.round((b.currentPage || 0) / b.pages * 100)) : 0;

const ACH = [
  ["Primeira página", "Concluir a primeira sessão", (c) => c.sessions >= 1],
  ["Semana cheia", "7 dias seguidos lendo", (c) => c.best >= 7],
  ["Hábito formado", "30 dias seguidos lendo", (c) => c.best >= 30],
  ["Livro fechado", "Terminar um livro", (c) => c.done >= 1],
  ["Meia dúzia", "Terminar 6 livros", (c) => c.done >= 6],
  ["Mil páginas", "Ler 1.000 páginas", (c) => c.pages >= 1000],
  ["Dez horas", "10 horas de leitura", (c) => c.sec >= 36000],
  ["Fôlego", "Uma sessão de 1 hora", (c) => c.longest >= 3600],
  ["Marginália", "Escrever 20 notas", (c) => c.notes >= 20],
  ["Memória viva", "Revisar 100 flashcards", (c) => c.reviews >= 100],
  ["Madrugador", "Ler antes das 7h", (c) => c.early],
  ["Coruja", "Ler depois das 23h", (c) => c.late],
];
function achCtx() {
  const m = dayMap(), t = totals();
  return { sessions: S.sessions.length, best: bestStreak(m), done: t.done, pages: t.pages, sec: t.sec, longest: Math.max(0, ...S.sessions.map(s => s.sec)), notes: S.notes.length, reviews: S.reviews.length, early: S.sessions.some(s => new Date(s.start).getHours() < 7), late: S.sessions.some(s => new Date(s.start).getHours() >= 23) };
}

/* ---------------- revisão espaçada (SM-2 simplificado) ---------------- */
function nextState(c, g) {
  let ease = c.ease || 2.5, interval = c.interval || 0, reps = c.reps || 0, lapses = c.lapses || 0, due;
  const now = Date.now();
  if (g === 0) { reps = 0; interval = 0; ease = Math.max(1.3, ease - 0.2); lapses++; due = now + 10 * 60000; }
  else {
    if (reps === 0) interval = g === 3 ? 3 : 1;
    else if (reps === 1) interval = g === 1 ? 2 : g === 2 ? 4 : 6;
    else interval = Math.max(interval + 1, Math.round(interval * (g === 1 ? 1.2 : g === 2 ? ease : ease * 1.3)));
    ease = Math.max(1.3, ease + (g === 1 ? -0.15 : g === 3 ? 0.15 : 0));
    reps++; due = sod(now) + interval * DAY + 3 * 3600000;
  }
  return { ease, interval, reps, lapses, due };
}
const ivLabel = (c, g) => { const n = nextState(c, g); return g === 0 ? "10 min" : n.interval === 1 ? "1 dia" : n.interval < 30 ? n.interval + " dias" : Math.round(n.interval / 30) + " m"; };
const endToday = () => addDays(sod(Date.now()), 1) - 1;
const dueCards = (bookId) => S.cards.filter(c => c.due <= endToday() && (bookId === undefined || (c.bookId || "") === bookId));

/* ---------------- utilidades de interface ---------------- */
function toast(msg, ms = 2600) { const el = document.createElement("div"); el.textContent = msg; $("#toast").appendChild(el); setTimeout(() => el.remove(), ms); }
const bookById = id => S.books.find(b => b.id === id);
function greeting() { const h = new Date().getHours(); return h < 5 ? "Boa madrugada" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"; }
function coverHTML(b, cls = "") {
  if (!b) return `<div class="cover ${cls}"></div>`;
  const src = b.coverId && IMG[b.coverId] ? IMG[b.coverId] : b.coverUrl;
  const tc = `<div class="tc"><span class="t">${esc(b.title)}</span><span class="a">${esc(b.author)}</span></div>`;
  if (src) return `<div class="cover ${cls}" style="background:${esc(b.color)}">${tc}<img src="${esc(src)}" alt="Capa de ${esc(b.title)}" loading="lazy" onerror="this.remove()"></div>`;
  return `<div class="cover ${cls}" style="background:${esc(b.color)}">${tc}</div>`;
}
function statusLabel(s) { return { lendo: "Lendo", quero: "Quero ler", lido: "Lido", pausado: "Pausado" }[s] || s; }
const SPINES = ["#1F3A68", "#9A3B2E", "#2F5D57", "#B07A1E", "#4A3768", "#16213A", "#7C2F4E", "#3E6B3A", "#5B4636", "#2C6E8F"];

function gaugeSVG(frac) {
  frac = Math.max(0, Math.min(1, frac));
  return `<svg viewBox="0 0 300 168" role="img" aria-label="${Math.round(frac * 100)}% da meta semanal">
    <path class="g-bg" d="M24 150 A126 126 0 0 1 276 150" fill="none" stroke-width="16" stroke-linecap="round"/>
    <path class="g-fg" d="M24 150 A126 126 0 0 1 276 150" fill="none" stroke-width="16" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100 - frac * 100}"/>
  </svg>`;
}
function ringSVG(frac) {
  frac = Math.max(0, Math.min(1, frac)); const r = 34, c = 2 * Math.PI * r;
  return `<svg viewBox="0 0 84 84" aria-hidden="true"><circle class="rb" cx="42" cy="42" r="${r}" fill="none" stroke-width="9"/><circle class="rf" cx="42" cy="42" r="${r}" fill="none" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - frac)}" transform="rotate(-90 42 42)"/></svg>`;
}

/* ============================================================
   VIEWS
   ============================================================ */
function topbar(title, opts = {}) {
  const left = opts.back ? `<button class="ib" data-a="go" data-v="${opts.back}" aria-label="Voltar">${I.back}</button>` : `<button class="ib" data-a="go" data-v="stats" aria-label="Números">${I.chart}</button>`;
  const right = opts.right ?? `<button class="ib" data-a="go" data-v="settings" aria-label="Ajustes">${I.gear}</button>`;
  return `<header class="bar">${left}${title ? `<h1>${title}</h1>` : `<div class="logo">${MARK}<span>Margem</span></div>`}${right}</header>`;
}
function sampleBanner() {
  if (!hasSamples()) return "";
  return `<div class="sample"><span><b>Dados de exemplo.</b> Explore à vontade e apague quando for começar.</span><button class="btn sm alt" data-a="clearSamples">Apagar</button></div>`;
}

function viewHome() {
  const m = dayMap(), st = streak(m), ws = weekStart(), goal = S.settings.weekGoal || 210;
  const wsec = weekSec(m), frac = wsec / 60 / goal, left = Math.max(0, Math.round(goal - wsec / 60));
  const today = dkey(Date.now());
  const days = DSEM.map((d, i) => { const t = addDays(ws, i), k = dkey(t); return `<div class="d ${m[k] ? "on" : ""} ${k === today ? "today" : ""}">${d[0]}<span class="c num">${new Date(t).getDate()}</span></div>`; }).join("");
  const reading = S.books.filter(b => b.status === "lendo").sort((a, b) => lastRead(b) - lastRead(a));
  const cur = reading[0], rest = reading.slice(1);
  const due = dueCards().length, lv = xpInfo();
  const pool = S.notes.filter(n => n.text);
  const note = pool.length ? pool[(new Date().getDate() + new Date().getMonth() * 31) % pool.length] : null;
  const yr = new Date().getFullYear(), doneYr = S.books.filter(b => b.status === "lido" && b.finishedAt && new Date(b.finishedAt).getFullYear() === yr).length;
  const r = 46, c = 2 * Math.PI * r, f = Math.min(1, frac);
  return `${topbar("")}
  ${sampleBanner()}
  <section class="hero">
    <div class="fhead"><span>Ficha de leitura</span><span class="num">Sem. ${pad(isoWeek())} · Nº ${String(S.sessions.length).padStart(4, "0")}</span></div>
    <div class="htop"><div><p class="eyebrow">${greeting()}${S.settings.name ? ", " + esc(S.settings.name) : ""}</p><h2 class="num">${hmin(wsec)}<small>lidas nesta semana</small></h2></div><span class="stamp" title="Dias seguidos lendo"><b class="num">${st}</b>${st === 1 ? "dia" : "dias"} seguidos</span></div>
    <div class="hmid">
      <div class="hring"><svg viewBox="0 0 108 108" aria-hidden="true"><circle class="rb" cx="54" cy="54" r="${r}" fill="none" stroke-width="10"/><circle class="rf" cx="54" cy="54" r="${r}" fill="none" stroke-width="10" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" transform="rotate(-90 54 54)"/></svg><b class="num">${Math.round(frac * 100)}%</b></div>
      <div class="hstats">
        <div><strong class="num">${hms(wsec)}</strong><small>de ${goal} min de meta</small></div>
        <div><strong class="num">${left ? left + " min" : "Meta batida"}</strong><small>${left ? "faltam para fechar a semana" : "a semana está fechada"}</small></div>
      </div>
    </div>
    <div class="week">${days}</div>
  </section>
  ${cur ? `<section class="now">
      <button data-a="openBook" data-id="${cur.id}" aria-label="Abrir ${esc(cur.title)}">${coverHTML(cur)}</button>
      <div class="bd"><p class="eyebrow">Continue lendo</p><h3>${esc(cur.title)}</h3><small class="muted">${esc(cur.author)}</small>
        <div class="prog"><i style="width:${pct(cur)}%"></i></div><small class="muted num">p. ${cur.currentPage || 0} de ${cur.pages || "?"} · ${pct(cur)}%</small>
        <button class="btn acc sm" data-a="startSession" data-id="${cur.id}">${I.play} Ler agora</button></div>
    </section>` : `<section class="card empty"><h3>Nada aberto na cabeceira</h3><p>Fotografe a capa do livro que você está lendo e ele aparece aqui.</p><button class="btn" data-a="addBook">${I.cam} Adicionar livro</button></section>`}
  ${rest.length ? `<section><div class="sh"><h2>Também na cabeceira</h2><button class="link" data-a="go" data-v="shelf">Estante</button></div><div class="shelfrow">${rest.map(b => `<button class="tile" data-a="openBook" data-id="${b.id}">${coverHTML(b)}<div class="prog"><i style="width:${pct(b)}%"></i></div><div class="meta"><b>${esc(b.title)}</b><span class="muted num">${pct(b)}%</span></div></button>`).join("")}</div></section>` : ""}
  <section class="trio">
    <button class="mini" data-a="go" data-v="cards"><span class="k num">${due}</span><span class="l">${due === 1 ? "card hoje" : "cards hoje"}</span></button>
    <button class="mini" data-a="go" data-v="stats"><span class="k num">${doneYr}<span class="muted" style="font-size:16px">/${S.settings.yearGoal}</span></span><span class="l">livros em ${yr}</span></button>
    <button class="mini" data-a="go" data-v="stats"><span class="k num">${lv.lvl}</span><span class="l">nível · ${esc(lv.title.toLowerCase())}</span></button>
  </section>
  ${note ? `<section class="resurface"><p class="eyebrow">Da sua margem</p><blockquote>${esc(note.text.length > 220 ? note.text.slice(0, 220) + "…" : note.text)}</blockquote><div class="src">${esc(bookById(note.bookId)?.title || "Sem livro")}${note.page ? ", p. " + note.page : ""}</div></section>` : ""}`;
}
function isoWeek(t = Date.now()) { const d = new Date(sod(t)); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); const w1 = new Date(d.getFullYear(), 0, 4); return 1 + Math.round(((d - w1) / DAY - 3 + (w1.getDay() + 6) % 7) / 7); }
function lastRead(b) { let t = b.startedAt || b.addedAt || 0; for (const s of S.sessions) if (s.bookId === b.id && s.end > t) t = s.end; return t; }

function viewShelf() {
  const f = UI.shelfF;
  const counts = { all: S.books.length, lendo: 0, quero: 0, lido: 0, pausado: 0 };
  S.books.forEach(b => counts[b.status] = (counts[b.status] || 0) + 1);
  const chips = [["all", "Todos"], ["lendo", "Lendo"], ["quero", "Quero ler"], ["lido", "Lidos"], ["pausado", "Pausados"]]
    .map(([k, l]) => `<button class="chip" aria-pressed="${f === k}" data-a="shelfF" data-f="${k}">${l} <span class="num">${counts[k] || 0}</span></button>`).join("");
  return `${topbar("Estante", { right: `<button class="ib" data-a="shelfMode" aria-label="Trocar visualização">${UI.shelfMode === "covers" ? I.shelf : I.img}</button>` })}
  <div class="search">${I.search}<input id="shelfQ" placeholder="Buscar por título, autor ou gênero" value="${esc(UI.q)}" data-in="shelfQ" autocomplete="off"></div>
  <div class="chips">${chips}</div>
  <div id="shelfList">${shelfList()}</div>
  <button class="fab" data-a="addBook">${I.cam} Livro</button>`;
}
function shelfList() {
  const q = UI.q.trim().toLowerCase();
  let list = S.books.filter(b => (UI.shelfF === "all" || b.status === UI.shelfF) && (!q || (b.title + " " + b.author + " " + b.genre).toLowerCase().includes(q)));
  const order = { lendo: 0, pausado: 1, quero: 2, lido: 3 };
  list.sort((a, b) => (order[a.status] - order[b.status]) || (lastRead(b) - lastRead(a)));
  if (!S.books.length) return `<div class="empty"><h3>Sua estante está vazia</h3><p>Tire uma foto da capa ou busque o livro pelo nome. Em segundos ele está guardado.</p><button class="btn" data-a="addBook">${I.cam} Adicionar primeiro livro</button></div>`;
  if (!list.length) return `<div class="empty"><p>Nenhum livro com esse filtro.</p></div>`;
  if (UI.shelfMode === "spines") {
    const rows = []; for (let i = 0; i < list.length; i += 9) rows.push(list.slice(i, i + 9));
    return `<div class="shelves">${rows.map(r => `<div class="plank">${r.map(b => { const h = 118 + ((b.title.length * 7 + (b.pages || 0)) % 34); const w = Math.max(22, Math.min(40, Math.round((b.pages || 200) / 14))); return `<button class="spine" style="background:${esc(b.color)};height:${h}px;width:${w}px" data-a="openBook" data-id="${b.id}" title="${esc(b.title)}"><span>${esc(b.title)}</span></button>`; }).join("")}</div>`).join("")}</div>`;
  }
  return `<div class="grid">${list.map(b => `<button class="tile" data-a="openBook" data-id="${b.id}">${coverHTML(b)}${b.status === "lendo" ? `<div class="prog"><i style="width:${pct(b)}%"></i></div>` : ""}<div class="meta"><b>${esc(b.title)}</b><span class="status-pill st-${b.status}"><i></i>${statusLabel(b.status)}</span></div></button>`).join("")}</div>`;
}

function viewBook() {
  const b = bookById(UI.bookId); if (!b) { UI.view = "shelf"; return viewShelf(); }
  const st = bookStats(b);
  const notes = S.notes.filter(n => n.bookId === b.id).sort((a, c) => c.createdAt - a.createdAt);
  const cards = S.cards.filter(c => c.bookId === b.id);
  const tab = UI.bookTab;
  let body = "";
  if (tab === "notes") body = notes.length ? `<div class="masonry">${notes.map(noteHTML).join("")}</div>` : `<div class="empty"><p>Nenhuma nota ainda. Guarde ideias, citações e fotos de trechos.</p></div>`;
  if (tab === "cards") body = cards.length ? `<div class="list">${cards.map(c => `<button class="li" data-a="editCard" data-id="${c.id}" style="text-align:left"><div class="grow"><b>${esc(c.front)}</b><small>${esc(c.back.slice(0, 90))}</small></div>${c.due <= endToday() ? `<span class="pill hot">hoje</span>` : `<span class="pill num">${fmtDate(c.due)}</span>`}</button>`).join("")}</div>` : `<div class="empty"><p>Sem flashcards deste livro. Crie perguntas para fixar o que leu.</p></div>`;
  if (tab === "sessions") body = st.ss.length ? `<div class="list">${st.ss.slice().sort((a, c) => c.start - a.start).map(s => `<div class="li"><div class="ic">${I.clock}</div><div class="grow"><b class="num">${hmin(s.sec)} · ${plural(s.pages, "página", "páginas")}</b><small>${fmtDate(s.start)}, ${pad(new Date(s.start).getHours())}:${pad(new Date(s.start).getMinutes())}</small></div><button class="ib" data-a="delSession" data-id="${s.id}" aria-label="Apagar sessão">${I.trash}</button></div>`).join("")}</div>` : `<div class="empty"><p>Nenhuma sessão registrada.</p></div>`;
  if (tab === "review") body = `<div class="form"><div class="field"><label for="fReview">Sua resenha</label><textarea id="fReview" placeholder="O que ficou desse livro pra você?">${esc(b.review)}</textarea></div><button class="btn" data-a="saveReview">Salvar resenha</button></div>`;
  const stars = [1, 2, 3, 4, 5].map(i => `<button class="${i <= b.rating ? "on" : ""}" data-a="rate" data-r="${i}" aria-label="${i} estrelas">${i <= b.rating ? I.starF : I.star}</button>`).join("");
  return `${topbar("", { back: UI.back, right: `<button class="ib" data-a="editBook" data-id="${b.id}" aria-label="Editar livro">${I.edit}</button>` })}
  <section class="bhead">
    ${coverHTML(b, "lg")}
    <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
      <span class="status-pill st-${b.status}"><i></i>${statusLabel(b.status)}</span>
      <h2>${esc(b.title)}</h2>
      <div class="muted">${esc(b.author || "Autor desconhecido")}${b.genre ? " · " + esc(b.genre) : ""}</div>
      <div class="stars">${stars}</div>
    </div>
  </section>
  <section class="card" style="display:flex;flex-direction:column;gap:10px">
    <div class="row"><b class="grow num">Página ${b.currentPage || 0} de ${b.pages || "?"}</b><span class="num muted">${pct(b)}%</span></div>
    <div class="prog" style="height:6px"><i style="width:${pct(b)}%"></i></div>
    ${st.eta ? `<small class="muted">No seu ritmo atual, termina por volta de ${fmtDate(st.eta)}.</small>` : st.left && b.status === "lendo" ? `<small class="muted">Faltam ${st.left} páginas.</small>` : ""}
    <div class="row" style="margin-top:4px">
      ${b.status === "lido" ? `<button class="btn ghost sm grow" data-a="setStatus" data-s="lendo">Reler</button>` : `<button class="btn acc grow" data-a="startSession" data-id="${b.id}">${I.play} Ler agora</button>`}
      <button class="btn ghost sm" data-a="manualLog" data-id="${b.id}">Registro manual</button>
    </div>
  </section>
  <section class="facts">
    <div><b class="num">${hmin(st.sec)}</b><small>tempo lido</small></div>
    <div><b class="num">${st.ss.length}</b><small>sessões</small></div>
    <div><b class="num">${st.pph ? Math.round(st.pph) : "–"}</b><small>páginas/hora</small></div>
  </section>
  <section style="display:flex;flex-direction:column;gap:14px">
    <div class="seg">${[["notes", "Notas " + notes.length], ["cards", "Cards " + cards.length], ["sessions", "Sessões"], ["review", "Resenha"]].map(([k, l]) => `<button aria-pressed="${tab === k}" data-a="bookTab" data-t="${k}">${l}</button>`).join("")}</div>
    <div class="row">
      <button class="btn alt sm grow" data-a="addNote" data-book="${b.id}">${I.bulb} Nova nota</button>
      <button class="btn alt sm grow" data-a="addCard" data-book="${b.id}">${I.cards} Novo flashcard</button>
    </div>
    ${body}
  </section>`;
}

function noteHTML(n) {
  const b = bookById(n.bookId);
  return `<div class="note c${n.color || 1} ${n.kind === "quote" ? "quote" : ""}" role="button" tabindex="0" data-a="editNote" data-id="${n.id}">
    <button class="star ${n.fav ? "on" : ""}" data-a="favNote" data-id="${n.id}" aria-label="Favoritar">${n.fav ? I.starF : I.star}</button>
    ${n.title ? `<h4>${esc(n.title)}</h4>` : `<h4>${n.kind === "quote" ? "Citação" : "Insight"}</h4>`}
    ${n.imgId && IMG[n.imgId] ? `<img src="${IMG[n.imgId]}" alt="Foto do trecho">` : ""}
    <p>${n.kind === "quote" ? "“" + esc(n.text) + "”" : esc(n.text)}</p>
    <div class="ft"><span>${esc(b ? b.title : "Sem livro")}${n.page ? ", p. " + n.page : ""}</span><span>${fmtDate(n.createdAt)}</span></div>
  </div>`;
}
function viewNotes() {
  const chips = [["all", "Todas " + S.notes.length], ["fav", "Favoritas"], ["quote", "Citações"], ["insight", "Insights"], ...S.folders.map(f => ["f:" + f, f])]
    .map(([k, l]) => `<button class="chip" aria-pressed="${UI.nf === k}" data-a="nf" data-f="${esc(k)}">${esc(l)}</button>`).join("");
  return `${topbar("Notas")}
  <div class="search">${I.search}<input id="noteQ" placeholder="Buscar nas suas notas" value="${esc(UI.nq)}" data-in="noteQ" autocomplete="off"></div>
  <div class="chips">${chips}<button class="chip" data-a="newFolder">${I.plus} Pasta</button></div>
  <div id="noteList">${noteList()}</div>
  <button class="fab" data-a="addNote">${I.plus} Nota</button>`;
}
function noteList() {
  const q = UI.nq.trim().toLowerCase(), f = UI.nf;
  const list = S.notes.filter(n => {
    if (f === "fav" && !n.fav) return false;
    if (f === "quote" && n.kind !== "quote") return false;
    if (f === "insight" && n.kind !== "insight") return false;
    if (f.startsWith("f:") && n.folder !== f.slice(2)) return false;
    if (q && !((n.title || "") + " " + n.text + " " + (bookById(n.bookId)?.title || "")).toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => b.createdAt - a.createdAt);
  if (!S.notes.length) return `<div class="empty"><h3>As ideias não somem</h3><p>Escreva ou dite enquanto lê. Tudo fica aqui, pesquisável, por livro e por pasta.</p><button class="btn" data-a="addNote">${I.mic} Primeira nota</button></div>`;
  if (!list.length) return `<div class="empty"><p>Nada encontrado.</p></div>`;
  return `<div class="masonry">${list.map(noteHTML).join("")}</div>`;
}

function viewCards() {
  const due = dueCards();
  const groups = {};
  S.cards.forEach(c => { const k = c.bookId || ""; (groups[k] || (groups[k] = [])).push(c); });
  const decks = Object.entries(groups).map(([k, cs]) => ({ k, b: bookById(k), cs, due: cs.filter(c => c.due <= endToday()).length })).sort((a, b) => b.due - a.due);
  const reviewedToday = S.reviews.filter(r => r.t >= sod(Date.now())).length;
  return `${topbar("Flashcards")}
  <section class="due">
    <div class="grow"><div class="k num">${due.length}</div><div>${due.length === 1 ? "cartão para hoje" : "cartões para hoje"}</div><small style="opacity:.7">${reviewedToday} revisados hoje</small></div>
    <button class="btn" data-a="review" ${due.length ? "" : "disabled"}>Revisar</button>
  </section>
  <section>
    <div class="sh"><h2>Por livro</h2><span class="muted num" style="font-size:13px">${plural(S.cards.length, "cartão", "cartões")}</span></div>
    ${decks.length ? `<div class="list">${decks.map(d => `<button class="deck" data-a="openDeck" data-k="${d.k}"><div class="cv">${d.b ? coverHTML(d.b) : `<div class="cover"></div>`}</div><div class="grow"><b>${esc(d.b ? d.b.title : "Sem livro")}</b><small class="muted num">${plural(d.cs.length, "cartão", "cartões")}</small></div>${d.due ? `<span class="pill hot num">${d.due} hoje</span>` : `<span class="pill">em dia</span>`}</button>`).join("")}</div>`
      : `<div class="empty"><h3>Fixe o que você leu</h3><p>Crie perguntas sobre o livro. O app agenda a revisão no momento certo, antes de você esquecer.</p><button class="btn" data-a="addCard">${I.plus} Criar flashcard</button></div>`}
  </section>
  <p class="hint">Dica: em qualquer nota, toque em “Virar flashcard” para transformar o trecho em pergunta.</p>
  <button class="fab" data-a="addCard">${I.plus} Cartão</button>`;
}

function viewStats() {
  const m = dayMap(), cm = new Date(UI.calM), y = cm.getFullYear(), mo = cm.getMonth();
  const first = new Date(y, mo, 1), nd = new Date(y, mo + 1, 0).getDate(), off = (first.getDay() + 6) % 7, today = dkey(Date.now());
  let cells = DSEM.map(d => `<span class="h">${d[0]}</span>`).join("");
  for (let i = 0; i < off; i++) cells += "<span></span>";
  let mDays = 0, mSec = 0, mPages = 0;
  for (let d = 1; d <= nd; d++) { const k = dkey(new Date(y, mo, d)); const e = m[k]; if (e) { mDays++; mSec += e.sec; mPages += e.pages; } cells += `<span class="c num ${e ? "on" : ""} ${k === today ? "today" : ""}" title="${e ? hmin(e.sec) + " · " + e.pages + " p." : ""}">${d}</span>`; }
  const lv = xpInfo(), ctx = achCtx();
  const yr = new Date().getFullYear(), doneYr = S.books.filter(b => b.status === "lido" && b.finishedAt && new Date(b.finishedAt).getFullYear() === yr).length, goal = S.settings.yearGoal || 12;
  const bestDay = Object.values(m).reduce((a, e) => Math.max(a, e.pages), 0);
  return `${topbar("Números", { back: "home" })}
  <section class="card">
    <div class="calhead"><button class="ib" data-a="calM" data-d="-1" aria-label="Mês anterior">${I.left}</button><h3>${MES[mo][0].toUpperCase() + MES[mo].slice(1)} ${y}</h3><button class="ib" data-a="calM" data-d="1" aria-label="Próximo mês">${I.right}</button></div>
    <div class="totals"><div><b class="num">${mDays}</b><small>dias ativos</small></div><div><b class="num">${hmin(mSec)}</b><small>tempo de leitura</small></div><div><b class="num">${mPages}</b><small>páginas lidas</small></div></div>
    <div class="cal">${cells}</div>
  </section>
  <section class="card">
    <div class="sh"><h2>Minutos lidos</h2></div>
    <div class="seg" style="margin-bottom:14px">${[["week", "Semana"], ["month", "Mês"], ["year", "Ano"]].map(([k, l]) => `<button aria-pressed="${UI.period === k}" data-a="period" data-p="${k}">${l}</button>`).join("")}</div>
    ${chartSVG(m)}
  </section>
  <section class="card yeargoal">${ringSVG(doneYr / goal)}<div><h3><span class="num">${doneYr}</span> de ${goal} livros</h3><small class="muted">Meta de ${yr}. ${doneYr >= goal ? "Meta batida." : "Faltam " + (goal - doneYr) + "."}</small></div></section>
  <section>
    <div class="sh"><h2>Recordes</h2></div>
    <div class="recs">
      <div><b class="num">${bestStreak(m)}</b><small>maior sequência de dias</small></div>
      <div><b class="num">${ctx.longest ? hmin(ctx.longest) : "–"}</b><small>sessão mais longa</small></div>
      <div><b class="num">${bestDay}</b><small>páginas num só dia</small></div>
      <div><b class="num">${hmin(ctx.sec)}</b><small>tempo total lido</small></div>
    </div>
  </section>
  <section>
    <div class="sh"><h2>Conquistas</h2><span class="muted num" style="font-size:13px">Nível ${lv.lvl} · ${lv.xp.toLocaleString("pt-BR")} XP</span></div>
    <div class="ach">${ACH.map(([t, d, f]) => `<div class="${f(ctx) ? "" : "off"}"><span class="medal">${I.medal}</span><b>${t}</b><small>${d}</small></div>`).join("")}</div>
  </section>
  <p class="hint">XP: 10 por página, 1 por minuto, 200 por livro terminado, 5 por nota e 2 por flashcard revisado.</p>`;
}
function chartSVG(m) {
  let data = [];
  if (UI.period === "week") { const ws = weekStart(); data = DSEM.map((d, i) => [d[0], ((m[dkey(addDays(ws, i))] || {}).sec || 0) / 60]); }
  else if (UI.period === "month") { const cm = new Date(UI.calM), nd = new Date(cm.getFullYear(), cm.getMonth() + 1, 0).getDate(); for (let d = 1; d <= nd; d++) data.push([d % 5 === 1 ? String(d) : "", ((m[dkey(new Date(cm.getFullYear(), cm.getMonth(), d))] || {}).sec || 0) / 60]); }
  else { const y = new Date().getFullYear(); data = MES3.map((l, i) => [l[0].toUpperCase(), 0]); for (const s of S.sessions) { const d = new Date(s.start); if (d.getFullYear() === y) data[d.getMonth()][1] += s.sec / 60; } }
  const W = 320, H = 150, L = 30, B = 20, T = 12, n = data.length;
  const max = Math.max(...data.map(d => d[1]));
  const step = max <= 30 ? 10 : max <= 60 ? 20 : max <= 150 ? 50 : max <= 300 ? 100 : max <= 1200 ? 300 : 1000;
  const top = Math.max(step, Math.ceil(max / step) * step);
  const bw = (W - L) / n, gap = Math.max(1.5, bw * 0.28);
  let g = "";
  for (let v = 0; v <= top; v += step) { const yy = T + (H - T - B) * (1 - v / top); g += `<line class="grid-l" x1="${L}" x2="${W}" y1="${yy}" y2="${yy}"/><text x="${L - 6}" y="${yy + 3}" text-anchor="end">${v}</text>`; }
  data.forEach(([lab, v], i) => {
    const x = L + i * bw + gap / 2, w = bw - gap, h = (H - T - B) * (v / top), yy = H - B - h;
    g += v > 0 ? `<rect class="bar-r" x="${x}" y="${yy}" width="${w}" height="${Math.max(1, h)}" rx="${Math.min(3, w / 2)}"><title>${Math.round(v)} min</title></rect>` : `<rect class="bar-z" x="${x}" y="${H - B - 2}" width="${w}" height="2" rx="1"/>`;
    if (lab) g += `<text x="${x + w / 2}" y="${H - 5}" text-anchor="middle">${lab}</text>`;
  });
  return `<div style="overflow-x:auto"><svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Minutos lidos por período">${g}</svg></div>`;
}

function viewSettings() {
  const s = S.settings;
  return `${topbar("Ajustes", { back: "home", right: "" })}
  <section class="form card">
    <div class="field"><label for="sName">Seu nome</label><input id="sName" value="${esc(s.name)}" placeholder="Como quer ser chamado"></div>
    <div class="two">
      <div class="field"><label for="sWeek">Meta semanal (min)</label><input id="sWeek" type="number" min="10" step="10" inputmode="numeric" value="${s.weekGoal}"></div>
      <div class="field"><label for="sYear">Livros no ano</label><input id="sYear" type="number" min="1" inputmode="numeric" value="${s.yearGoal}"></div>
    </div>
    <div class="field"><label for="sTheme">Tema</label><select id="sTheme"><option value="system" ${s.theme === "system" ? "selected" : ""}>Seguir o sistema</option><option value="light" ${s.theme === "light" ? "selected" : ""}>Claro</option><option value="dark" ${s.theme === "dark" ? "selected" : ""}>Escuro</option></select></div>
    <button class="btn" data-a="saveSettings">Salvar ajustes</button>
  </section>
  <section class="card">
    <div class="sh"><h2>Seus dados</h2></div>
    <p class="hint" style="margin-bottom:14px">Tudo fica guardado só neste aparelho, sem conta e sem servidor. Faça um backup de vez em quando, principalmente antes de trocar de celular.</p>
    <div class="list">
      <button class="li" data-a="exportData" style="text-align:left"><div class="ic">${I.download}</div><div class="grow"><b>Exportar backup</b><small>Arquivo .json com livros, notas, cards, sessões e fotos</small></div></button>
      <button class="li" data-a="importData" style="text-align:left"><div class="ic">${I.upload}</div><div class="grow"><b>Importar backup</b><small>Substitui os dados atuais pelos do arquivo</small></div></button>
      ${S.seeded && !hasSamples() ? `<button class="li" data-a="loadSamples" style="text-align:left"><div class="ic">${I.book}</div><div class="grow"><b>Carregar exemplos</b><small>Livros, notas e cards de demonstração</small></div></button>` : ""}
      <button class="li" data-a="wipe" style="text-align:left"><div class="ic" style="color:var(--danger)">${I.trash}</div><div class="grow"><b style="color:var(--danger)">Apagar tudo</b><small>Remove todos os dados deste aparelho</small></div></button>
    </div>
  </section>
  <section class="card">
    <div class="sh"><h2>Sobre</h2></div>
    <p class="hint">Margem é um app de leitura livre e de código aberto (licença MIT). Funciona offline e pode ser instalado na tela inicial pelo menu do navegador, em “Adicionar à tela inicial”.</p>
    <p class="hint" style="margin-top:8px">Capas e dados da busca online vêm da Open Library.</p>
  </section>`;
}

/* ---------------- tabbar ---------------- */
function renderTabs() {
  const v = UI.view === "book" ? (UI.back === "home" ? "home" : UI.back) : UI.view;
  const due = dueCards().length;
  const t = (key, label, icon, extra = "") => `<button class="tab" data-a="go" data-v="${key}" ${v === key ? 'aria-current="page"' : ""}>${icon}${extra}<span>${label}</span><i class="dot"></i></button>`;
  $("#tabs").innerHTML = t("home", "Início", I.home) + t("shelf", "Estante", I.shelf) +
    `<button class="tab-go ${S.active ? "live" : ""}" data-a="startSession" aria-label="${S.active ? "Voltar à sessão" : "Iniciar sessão de leitura"}">${S.active ? I.clock : MARK_NIGHT}</button>` +
    t("notes", "Notas", I.notes) + t("cards", "Cards", I.cards, due ? `<span class="badge num">${due}</span>` : "");
}

function render() {
  const views = { home: viewHome, shelf: viewShelf, book: viewBook, notes: viewNotes, cards: viewCards, stats: viewStats, settings: viewSettings };
  $("#main").innerHTML = (views[UI.view] || viewHome)();
  renderTabs();
}
function go(v) { UI.view = v; render(); window.scrollTo(0, 0); const m = $("#main"); m.classList.remove("enter"); void m.offsetWidth; m.classList.add("enter"); clearTimeout(go.t); go.t = setTimeout(() => m.classList.remove("enter"), 900); }

/* ============================================================
   FOLHAS (formulários)
   ============================================================ */
function openSheet(html, onMount) {
  const sh = $("#sheet"); sh.innerHTML = `<div class="panel" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`; sh.hidden = false;
  document.body.style.overflow = "hidden";
  if (onMount) onMount(sh.firstElementChild);
}
function closeSheet() { stopDictation(); const sh = $("#sheet"); sh.hidden = true; sh.innerHTML = ""; document.body.style.overflow = ""; }
$("#sheet").addEventListener("click", e => { if (e.target.id === "sheet") closeSheet(); });

function confirmSheet(title, text, okLabel, fn, danger = true) {
  openSheet(`<h2>${title}</h2><p class="muted" style="margin:0 0 18px">${text}</p><div class="row"><button class="btn ghost grow" data-a="closeSheet">Cancelar</button><button class="btn ${danger ? "danger" : ""} grow" id="okBtn">${okLabel}</button></div>`, sh => { $("#okBtn", sh).onclick = () => { closeSheet(); fn(); }; });
}

/* ---- foto ---- */
let pickCb = null;
function pickImage(cam, cb) { pickCb = cb; const el = $(cam ? "#pickCam" : "#pickGal"); el.value = ""; el.click(); }
["#pickCam", "#pickGal"].forEach(id => $(id).addEventListener("change", e => { const f = e.target.files[0]; if (f && pickCb) pickCb(f); }));
function fileToDataURL(file, max = 700, q = 0.8) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      res({ data: c.toDataURL("image/jpeg", q), canvas: c, img });
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("img")); };
    img.src = url;
  });
}
function dominant(canvas) {
  try {
    const c = document.createElement("canvas"); c.width = 12; c.height = 12; const x = c.getContext("2d"); x.drawImage(canvas, 0, 0, 12, 12);
    const d = x.getImageData(0, 0, 12, 12).data; let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    r /= n; g /= n; b /= n; const k = Math.min(1, 105 / Math.max(r, g, b, 1)); // escurece pra lombada ficar legível
    return "#" + [r, g, b].map(v => Math.round(v * k).toString(16).padStart(2, "0")).join("");
  } catch (e) { return null; }
}

/* ---- ditado por voz ---- */
let REC = null;
function stopDictation() { if (REC) { try { REC.stop(); } catch (e) { } REC = null; } document.querySelectorAll(".mic.rec").forEach(b => b.classList.remove("rec")); }
function dictate(btn, ta) {
  if (REC) { stopDictation(); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast("Ditado por voz não funciona neste navegador. No Android, use o Chrome."); return; }
  const r = new SR(); r.lang = "pt-BR"; r.interimResults = true; r.continuous = true;
  const base = ta.value.trim();
  r.onresult = e => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; ta.value = (base ? base + " " : "") + t.trim(); };
  r.onerror = e => { toast(e.error === "not-allowed" ? "Libere o microfone para ditar." : "O ditado parou."); stopDictation(); };
  r.onend = () => { btn.classList.remove("rec"); REC = null; };
  try { r.start(); REC = r; btn.classList.add("rec"); } catch (e) { toast("Não consegui abrir o microfone."); }
}

/* ---- livro: adicionar / editar ---- */
function bookForm(b) {
  const isNew = !b; b = b || { title: "", author: "", pages: "", currentPage: 0, status: "lendo", genre: "", color: SPINES[S.books.length % SPINES.length], coverId: null, coverUrl: null };
  const draft = { coverData: null, coverUrl: b.coverUrl, color: b.color, removeCover: false };
  const preview = () => { const fake = Object.assign({}, b, { title: $("#fTitle")?.value || b.title || "Título", author: $("#fAuthor")?.value || b.author, color: draft.color, coverUrl: draft.coverUrl, coverId: draft.coverData || draft.removeCover ? null : b.coverId }); let h = coverHTML(fake); if (draft.coverData) h = `<div class="cover"><img src="${draft.coverData}" alt="Capa"></div>`; $("#cvPrev").innerHTML = h; };
  openSheet(`<h2>${isNew ? "Novo livro" : "Editar livro"}</h2>
  <div class="form">
    <div class="photo"><div id="cvPrev"></div><div class="btns">
      <button class="btn sm" data-x="cam">${I.cam} Fotografar capa</button>
      <button class="btn sm alt" data-x="gal">${I.img} Escolher da galeria</button>
      <button class="btn sm alt" data-x="isbn">${I.barcode} Ler código de barras</button>
    </div></div>
    <div class="field"><label for="olQ">Buscar online (título ou ISBN)</label><div class="row"><input id="olQ" class="grow" placeholder="Ex.: Dom Casmurro" style="border:1.5px solid var(--line);background:var(--card);border-radius:12px;padding:11px 12px;min-width:0"><button class="btn sm alt" data-x="ol" aria-label="Buscar">${I.search}</button></div></div>
    <div class="results" id="olRes"></div>
    <div class="field"><label for="fTitle">Título</label><input id="fTitle" value="${esc(b.title)}" required></div>
    <div class="field"><label for="fAuthor">Autor</label><input id="fAuthor" value="${esc(b.author)}"></div>
    <div class="two">
      <div class="field"><label for="fPages">Páginas</label><input id="fPages" type="number" inputmode="numeric" min="1" value="${esc(b.pages)}"></div>
      <div class="field"><label for="fCur">Página atual</label><input id="fCur" type="number" inputmode="numeric" min="0" value="${esc(b.currentPage || 0)}"></div>
    </div>
    <div class="two">
      <div class="field"><label for="fStatus">Situação</label><select id="fStatus">${["lendo", "quero", "lido", "pausado"].map(s => `<option value="${s}" ${b.status === s ? "selected" : ""}>${statusLabel(s)}</option>`).join("")}</select></div>
      <div class="field"><label for="fGenre">Gênero</label><input id="fGenre" value="${esc(b.genre)}" list="genres"></div>
    </div>
    <datalist id="genres">${["Romance", "Ficção científica", "Fantasia", "Filosofia", "Programação", "Negócios", "Autoajuda", "História", "Biografia", "Poesia", "Clássico", "Tecnologia"].map(g => `<option value="${g}">`).join("")}</datalist>
    <div class="field"><label>Cor da lombada</label><div class="swatches">${SPINES.map(c => `<button class="sw" style="background:${c}" data-x="sw" data-c="${c}" aria-pressed="${c === draft.color}" aria-label="Cor ${c}"></button>`).join("")}</div></div>
    <div class="row"><button class="btn ghost grow" data-a="closeSheet">Cancelar</button><button class="btn grow" data-x="save">${isNew ? "Guardar na estante" : "Salvar"}</button></div>
    ${!isNew ? `<button class="btn danger block" data-x="del">${I.trash} Excluir livro</button>` : ""}
  </div>`, sh => {
    preview();
    $("#fTitle", sh).addEventListener("input", preview); $("#fAuthor", sh).addEventListener("input", preview);
    $("#olQ", sh).addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); olSearch(); } });
    const takePhoto = async (f) => { try { const r = await fileToDataURL(f); draft.coverData = r.data; draft.coverUrl = null; const c = dominant(r.canvas); if (c) draft.color = c; preview(); } catch (e) { toast("Não consegui ler essa imagem."); } };
    const olSearch = async (isbn) => {
      const q = isbn || $("#olQ").value.trim(); if (!q) return;
      const box = $("#olRes"); box.innerHTML = `<p class="hint">Buscando…</p>`;
      try {
        const url = /^\d{10,13}$/.test(q.replace(/-/g, "")) ? `https://openlibrary.org/search.json?isbn=${q.replace(/-/g, "")}&limit=6` : `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=key,title,author_name,number_of_pages_median,cover_i,first_publish_year,subject`;
        const r = await fetch(url); const j = await r.json();
        const docs = (j.docs || []).slice(0, 8);
        if (!docs.length) { box.innerHTML = `<p class="hint">Nada encontrado. Preencha à mão ou tente outro termo.</p>`; return; }
        box.innerHTML = docs.map((d, i) => `<button class="res" data-i="${i}">${d.cover_i ? `<img src="https://covers.openlibrary.org/b/id/${d.cover_i}-S.jpg" alt="">` : `<span class="ph"></span>`}<div><b>${esc(d.title)}</b><small>${esc((d.author_name || []).slice(0, 2).join(", "))}${d.first_publish_year ? " · " + d.first_publish_year : ""}${d.number_of_pages_median ? " · " + d.number_of_pages_median + " p." : ""}</small></div></button>`).join("");
        box.querySelectorAll(".res").forEach(el => el.onclick = () => {
          const d = docs[+el.dataset.i];
          $("#fTitle").value = d.title || ""; $("#fAuthor").value = (d.author_name || [])[0] || "";
          if (d.number_of_pages_median) $("#fPages").value = d.number_of_pages_median;
          if (d.cover_i && !draft.coverData) draft.coverUrl = `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`;
          box.innerHTML = ""; preview();
        });
      } catch (e) { box.innerHTML = `<p class="hint">A busca online não respondeu. Confira a internet ou preencha à mão.</p>`; }
    };
    sh.addEventListener("click", async e => {
      const x = e.target.closest("[data-x]"); if (!x) return; const k = x.dataset.x;
      if (k === "cam") pickImage(true, takePhoto);
      if (k === "gal") pickImage(false, takePhoto);
      if (k === "ol") olSearch();
      if (k === "sw") { draft.color = x.dataset.c; sh.querySelectorAll(".sw").forEach(s => s.setAttribute("aria-pressed", s === x)); preview(); }
      if (k === "isbn") {
        if (!("BarcodeDetector" in window)) { toast("Leitura de código de barras não é suportada aqui. Digite o ISBN na busca."); return; }
        pickImage(true, async f => {
          try { const det = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a"] }); const bmp = await createImageBitmap(f); const codes = await det.detect(bmp);
            const code = codes.map(c => c.rawValue).find(v => /^97[89]/.test(v)) || codes[0]?.rawValue;
            if (!code) { toast("Não achei o código. Tente com mais luz e mais perto."); return; }
            $("#olQ").value = code; olSearch(code);
          } catch (err) { toast("Não consegui ler o código de barras."); }
        });
      }
      if (k === "del") { confirmSheet("Excluir livro?", "As notas, flashcards e sessões deste livro também serão apagados.", "Excluir", () => delBook(b.id)); }
      if (k === "save") {
        const title = $("#fTitle").value.trim(); if (!title) { $("#fTitle").focus(); toast("Dê um título ao livro."); return; }
        const status = $("#fStatus").value, pages = parseInt($("#fPages").value) || 0, cur = Math.max(0, parseInt($("#fCur").value) || 0);
        let target = isNew ? { id: uid(), addedAt: Date.now(), rating: 0, review: "", startedAt: null, finishedAt: null, coverId: null } : bookById(b.id);
        if (draft.coverData) { if (target.coverId) await dropImg(target.coverId); target.coverId = await putImg(draft.coverData); target.coverUrl = null; }
        else if (draft.coverUrl !== undefined) target.coverUrl = draft.coverUrl;
        Object.assign(target, { title, author: $("#fAuthor").value.trim(), pages, currentPage: status === "lido" && pages ? pages : Math.min(cur, pages || cur), status, genre: $("#fGenre").value.trim(), color: draft.color });
        if (status === "lendo" && !target.startedAt) target.startedAt = Date.now();
        if (status === "lido" && !target.finishedAt) target.finishedAt = Date.now();
        if (status !== "lido") target.finishedAt = null;
        if (isNew) S.books.push(target);
        save(); closeSheet(); toast(isNew ? "Guardado na estante." : "Livro atualizado.");
        if (isNew) { UI.bookId = target.id; UI.back = UI.view === "book" ? UI.back : (UI.view === "home" ? "home" : "shelf"); UI.bookTab = "notes"; UI.view = "book"; }
        render();
      }
    });
  });
}
async function delBook(id) {
  const b = bookById(id); if (!b) return;
  if (b.coverId) await dropImg(b.coverId);
  for (const n of S.notes.filter(n => n.bookId === id)) if (n.imgId) await dropImg(n.imgId);
  S.books = S.books.filter(x => x.id !== id); S.notes = S.notes.filter(x => x.bookId !== id); S.cards = S.cards.filter(x => x.bookId !== id); S.sessions = S.sessions.filter(x => x.bookId !== id);
  if (S.active && S.active.bookId === id) S.active = null;
  save(); toast("Livro excluído."); go("shelf");
}

/* ---- nota ---- */
function noteForm(n, preset = {}) {
  const isNew = !n; n = n || Object.assign({ text: "", title: "", bookId: (S.active && S.active.bookId) || (UI.view === "book" ? UI.bookId : ""), page: "", folder: UI.nf.startsWith("f:") ? UI.nf.slice(2) : "Geral", kind: "insight", color: 1, imgId: null, fav: false }, preset);
  const draft = { img: undefined, kind: n.kind, color: n.color };
  const books = S.books.slice().sort((a, b) => (a.status === "lendo" ? -1 : 1) - (b.status === "lendo" ? -1 : 1));
  openSheet(`<h2>${isNew ? "Nova nota" : "Editar nota"}</h2>
  <div class="form">
    <div class="seg"><button aria-pressed="${draft.kind === "insight"}" data-x="kind" data-k="insight">Insight</button><button aria-pressed="${draft.kind === "quote"}" data-x="kind" data-k="quote">Citação</button></div>
    <div class="field"><label for="nTitle">Título (opcional)</label><input id="nTitle" value="${esc(n.title)}" placeholder="Uma palavra-chave pra achar depois"></div>
    <div class="field"><label for="nText">Texto</label><div class="row" style="align-items:flex-start"><textarea id="nText" class="grow" placeholder="Escreva ou toque no microfone para ditar">${esc(n.text)}</textarea><button class="mic" data-x="mic" aria-label="Ditar por voz">${I.mic}</button></div></div>
    <div class="row"><button class="btn sm alt" data-x="photo">${I.cam} Foto do trecho</button><span id="nImg" class="hint">${n.imgId ? "Foto anexada" : ""}</span></div>
    <div class="two">
      <div class="field"><label for="nBook">Livro</label><select id="nBook"><option value="">Sem livro</option>${books.map(b => `<option value="${b.id}" ${b.id === n.bookId ? "selected" : ""}>${esc(b.title)}</option>`).join("")}</select></div>
      <div class="field"><label for="nPage">Página</label><input id="nPage" type="number" inputmode="numeric" value="${esc(n.page ?? "")}"></div>
    </div>
    <div class="field"><label for="nFolder">Pasta</label><select id="nFolder">${S.folders.map(f => `<option ${f === n.folder ? "selected" : ""}>${esc(f)}</option>`).join("")}</select></div>
    <div class="field"><label>Cor</label><div class="swatches">${[1, 2, 3, 4, 5].map(c => `<button class="sw" style="background:var(--n${c})" data-x="col" data-c="${c}" aria-pressed="${c === draft.color}" aria-label="Cor ${c}"></button>`).join("")}</div></div>
    <div class="row"><button class="btn ghost grow" data-a="closeSheet">Cancelar</button><button class="btn grow" data-x="save">Salvar nota</button></div>
    ${!isNew ? `<div class="row"><button class="btn alt sm grow" data-x="toCard">${I.cards} Virar flashcard</button><button class="btn danger sm grow" data-x="del">${I.trash} Apagar</button></div>` : ""}
  </div>`, sh => {
    sh.addEventListener("click", async e => {
      const x = e.target.closest("[data-x]"); if (!x) return; const k = x.dataset.x;
      if (k === "kind") { draft.kind = x.dataset.k; sh.querySelectorAll('[data-x="kind"]').forEach(b => b.setAttribute("aria-pressed", b === x)); }
      if (k === "col") { draft.color = +x.dataset.c; sh.querySelectorAll('[data-x="col"]').forEach(b => b.setAttribute("aria-pressed", b === x)); }
      if (k === "mic") dictate(x, $("#nText"));
      if (k === "photo") pickImage(true, async f => { try { const r = await fileToDataURL(f, 1000, 0.78); draft.img = r.data; $("#nImg").textContent = "Foto anexada"; } catch (err) { toast("Não consegui ler a imagem."); } });
      if (k === "del") confirmSheet("Apagar nota?", "Essa ação não pode ser desfeita.", "Apagar", async () => { if (n.imgId) await dropImg(n.imgId); S.notes = S.notes.filter(x => x.id !== n.id); save(); render(); toast("Nota apagada."); });
      if (k === "toCard") { closeSheet(); cardForm(null, { bookId: n.bookId, front: n.kind === "quote" ? "Complete a citação: “" + n.text.split(" ").slice(0, 4).join(" ") + "…”" : (n.title ? n.title + "?" : ""), back: n.text }); }
      if (k === "save") {
        stopDictation();
        const text = $("#nText").value.trim(); if (!text && !draft.img && !n.imgId) { toast("Escreva algo ou anexe uma foto."); return; }
        const t = isNew ? { id: uid(), createdAt: Date.now(), fav: false, imgId: null } : S.notes.find(x => x.id === n.id);
        if (draft.img) { if (t.imgId) await dropImg(t.imgId); t.imgId = await putImg(draft.img); }
        Object.assign(t, { text, title: $("#nTitle").value.trim(), bookId: $("#nBook").value, page: parseInt($("#nPage").value) || null, folder: $("#nFolder").value, kind: draft.kind, color: draft.color });
        if (isNew) S.notes.push(t);
        save(); closeSheet(); toast(isNew ? "Nota guardada. +5 XP" : "Nota atualizada.");
        if (!$("#full").hidden) renderSession(); render();
      }
    });
  });
}

/* ---- flashcard ---- */
function cardForm(c, preset = {}) {
  const isNew = !c; c = c || Object.assign({ front: "", back: "", bookId: UI.view === "book" ? UI.bookId : "" }, preset);
  openSheet(`<h2>${isNew ? "Novo flashcard" : "Editar flashcard"}</h2>
  <div class="form">
    <div class="field"><label for="cFront">Frente (pergunta)</label><div class="row" style="align-items:flex-start"><textarea id="cFront" class="grow" style="min-height:80px" placeholder="Ex.: Qual a ideia central do capítulo 3?">${esc(c.front)}</textarea><button class="mic" data-x="mic" data-t="cFront" aria-label="Ditar pergunta">${I.mic}</button></div></div>
    <div class="field"><label for="cBack">Verso (resposta)</label><div class="row" style="align-items:flex-start"><textarea id="cBack" class="grow" style="min-height:80px">${esc(c.back)}</textarea><button class="mic" data-x="mic" data-t="cBack" aria-label="Ditar resposta">${I.mic}</button></div></div>
    <div class="field"><label for="cBook">Livro</label><select id="cBook"><option value="">Sem livro</option>${S.books.map(b => `<option value="${b.id}" ${b.id === c.bookId ? "selected" : ""}>${esc(b.title)}</option>`).join("")}</select></div>
    ${!isNew ? `<p class="hint num">Revisado ${plural(c.reps || 0, "vez", "vezes")} seguidas · próxima revisão ${fmtDate(c.due)}${c.lapses ? " · errou " + plural(c.lapses, "vez", "vezes") : ""}</p>` : ""}
    <div class="row"><button class="btn ghost grow" data-a="closeSheet">Cancelar</button><button class="btn grow" data-x="save">${isNew ? "Criar" : "Salvar"}</button></div>
    ${isNew ? `<button class="btn alt block" data-x="saveMore">Criar e fazer outro</button>` : `<button class="btn danger block" data-x="del">${I.trash} Apagar flashcard</button>`}
  </div>`, sh => {
    sh.addEventListener("click", e => {
      const x = e.target.closest("[data-x]"); if (!x) return; const k = x.dataset.x;
      if (k === "mic") dictate(x, $("#" + x.dataset.t));
      if (k === "del") confirmSheet("Apagar flashcard?", "Ele sai da sua fila de revisão.", "Apagar", () => { S.cards = S.cards.filter(y => y.id !== c.id); save(); render(); });
      if (k === "save" || k === "saveMore") {
        stopDictation();
        const front = $("#cFront").value.trim(), back = $("#cBack").value.trim();
        if (!front || !back) { toast("Preencha frente e verso."); return; }
        if (isNew) S.cards.push({ id: uid(), front, back, bookId: $("#cBook").value, ease: 2.5, interval: 0, reps: 0, lapses: 0, due: Date.now(), createdAt: Date.now() });
        else Object.assign(S.cards.find(y => y.id === c.id), { front, back, bookId: $("#cBook").value });
        save(); render();
        if (k === "saveMore") { const bk = $("#cBook").value; closeSheet(); cardForm(null, { bookId: bk }); toast("Criado. Próximo!"); }
        else { closeSheet(); toast(isNew ? "Flashcard criado. Ele aparece na revisão de hoje." : "Flashcard atualizado."); }
      }
    });
  });
}
function deckSheet(k) {
  const b = bookById(k), cs = S.cards.filter(c => (c.bookId || "") === k), due = cs.filter(c => c.due <= endToday()).length;
  openSheet(`<h2>${esc(b ? b.title : "Sem livro")}</h2>
  <div class="row" style="margin-bottom:14px"><button class="btn acc grow" data-x="rev" ${due ? "" : "disabled"}>Revisar ${due} de hoje</button><button class="btn alt grow" data-x="all">Revisar todos</button></div>
  <div class="list">${cs.map(c => `<button class="li" data-x="edit" data-id="${c.id}" style="text-align:left"><div class="grow"><b>${esc(c.front)}</b><small>${esc(c.back.slice(0, 80))}</small></div><span class="pill num">${c.due <= endToday() ? "hoje" : fmtDate(c.due)}</span></button>`).join("")}</div>`, sh => {
    sh.addEventListener("click", e => {
      const x = e.target.closest("[data-x]"); if (!x) return;
      if (x.dataset.x === "rev") { closeSheet(); startReview(dueCards(k)); }
      if (x.dataset.x === "all") { closeSheet(); startReview(cs.slice()); }
      if (x.dataset.x === "edit") { closeSheet(); cardForm(S.cards.find(c => c.id === x.dataset.id)); }
    });
  });
}

/* ============================================================
   SESSÃO DE LEITURA (tela cheia)
   ============================================================ */
let tick = null, wake = null;
const elapsed = a => ((a.pausedAt || Date.now()) - a.startedAt - (a.pausedTotal || 0)) / 1000;
async function keepAwake() { try { if ("wakeLock" in navigator && !wake) { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => wake = null); } } catch (e) { } }
function releaseWake() { try { wake && wake.release(); } catch (e) { } wake = null; }

function startSession(bookId) {
  if (S.active) { openSession(); return; }
  if (!bookId) {
    const reading = S.books.filter(b => b.status === "lendo");
    if (!S.books.length) { toast("Adicione um livro primeiro."); bookForm(); return; }
    if (reading.length === 1) bookId = reading[0].id;
    else {
      const list = (reading.length ? reading : S.books.filter(b => b.status !== "lido"));
      if (!list.length) { toast("Todos os livros estão lidos. Adicione um novo."); bookForm(); return; }
      openSheet(`<h2>O que vai ler agora?</h2><div class="list">${list.map(b => `<button class="deck" data-x="${b.id}"><div class="cv">${coverHTML(b)}</div><div class="grow"><b>${esc(b.title)}</b><small class="muted num">p. ${b.currentPage || 0} de ${b.pages || "?"}</small></div></button>`).join("")}</div>`, sh => sh.addEventListener("click", e => { const x = e.target.closest("[data-x]"); if (x) { closeSheet(); startSession(x.dataset.x); } }));
      return;
    }
  }
  const b = bookById(bookId);
  if (b.status !== "lendo") { b.status = "lendo"; if (!b.startedAt) b.startedAt = Date.now(); }
  S.active = { bookId, startedAt: Date.now(), pausedAt: null, pausedTotal: 0, pageFrom: b.currentPage || 0 };
  save(); openSession(); renderTabs();
}
function openSession() { $("#full").hidden = false; document.body.style.overflow = "hidden"; renderSession(); clearInterval(tick); tick = setInterval(updTimer, 1000); keepAwake(); }
function closeFull() { $("#full").hidden = true; $("#full").innerHTML = ""; document.body.style.overflow = ""; clearInterval(tick); releaseWake(); render(); }
function updTimer() { const a = S.active, el = $("#tm"); if (a && el) el.textContent = clock(elapsed(a)); }
function renderSession() {
  const a = S.active; if (!a) return closeFull();
  const b = bookById(a.bookId);
  const notes = S.notes.filter(n => n.bookId === a.bookId && n.createdAt >= a.startedAt);
  $("#full").innerHTML = `<div class="fs">
    <div class="top"><button class="ib" data-a="minSession" aria-label="Minimizar">${I.back}</button><span class="eyebrow">${a.pausedAt ? "Sessão pausada" : "Sessão em andamento"}</span><button class="ib" data-a="cancelSession" aria-label="Descartar sessão">${I.x}</button></div>
    <div id="tm" class="timer num ${a.pausedAt ? "paused" : ""}">${clock(elapsed(a))}</div>
    ${coverHTML(b)}
    <div><div class="bt">${esc(b.title)}</div><small class="eyebrow">começou na p. ${a.pageFrom}</small></div>
    <button class="bigz" data-a="sessNote" aria-label="Anotar insight">${I.mic}</button>
    <small style="color:var(--night-2ink);margin-top:-10px">Toque para anotar um insight por voz</small>
    ${notes.length ? `<div class="sessnotes">${notes.map(n => `<div>${esc(n.text.slice(0, 140))}</div>`).join("")}</div>` : ""}
    <div class="ctrl">
      <button class="btn alt" data-a="pauseSession">${a.pausedAt ? I.play + " Continuar" : I.pause + " Pausar"}</button>
      <button class="btn main" data-a="endSession">Encerrar sessão</button>
    </div>
  </div>`;
}
function endSessionSheet() {
  const a = S.active, b = bookById(a.bookId), sec = Math.round(elapsed(a));
  openSheet(`<h2>Fechar a sessão</h2>
  <p class="muted" style="margin:-6px 0 16px">Você leu <b class="num" style="color:var(--ink)">${clock(sec)}</b> de ${esc(b.title)}.</p>
  <div class="form">
    <div class="field"><label for="ePage">Em que página parou?</label><input id="ePage" type="number" inputmode="numeric" min="0" ${b.pages ? `max="${b.pages}"` : ""} value="${b.currentPage || 0}"></div>
    <p class="hint" id="eInfo"></p>
    <div class="row"><button class="btn ghost grow" data-a="closeSheet">Voltar</button><button class="btn grow" id="eSave">Validar sessão</button></div>
  </div>`, sh => {
    const inp = $("#ePage", sh), info = $("#eInfo", sh);
    const upd = () => { const p = Math.max(0, (parseInt(inp.value) || 0) - a.pageFrom); info.textContent = `${plural(p, "página lida", "páginas lidas")} · +${p * 10 + Math.floor(sec / 60)} XP${b.pages && parseInt(inp.value) >= b.pages ? " · livro terminado (+200 XP)" : ""}`; };
    inp.addEventListener("input", upd); upd(); setTimeout(() => { inp.focus(); inp.select(); }, 80);
    $("#eSave", sh).onclick = () => {
      let page = parseInt(inp.value); if (isNaN(page)) page = b.currentPage || 0; if (b.pages) page = Math.min(page, b.pages);
      const pages = Math.max(0, page - a.pageFrom);
      if (sec < 60 && pages === 0) { closeSheet(); toast("Sessão com menos de 1 minuto e sem páginas. Não foi salva."); S.active = null; save(); closeFull(); return; }
      logSession(b, a.startedAt, sec, pages, page);
      S.active = null; save(); closeSheet(); closeFull();
    };
  });
}
function logSession(b, start, sec, pages, page) {
  S.sessions.push({ id: uid(), bookId: b.id, start, end: start + sec * 1000, sec, pages, pageTo: page });
  b.currentPage = page;
  if (b.pages && page >= b.pages) { b.status = "lido"; b.finishedAt = Date.now(); toast(`Livro terminado: ${b.title}. Que tal dar uma nota e escrever a resenha?`, 4200); UI.bookId = b.id; UI.bookTab = "review"; UI.view = "book"; }
  else toast(`Sessão validada: ${hmin(sec)}, ${plural(pages, "página", "páginas")}. +${pages * 10 + Math.floor(sec / 60)} XP`);
  save();
}
function manualLog(id) {
  const b = bookById(id);
  openSheet(`<h2>Registrar leitura</h2><p class="muted" style="margin:-6px 0 16px">Para quando você leu sem ligar o cronômetro.</p>
  <div class="form">
    <div class="two"><div class="field"><label for="mMin">Minutos</label><input id="mMin" type="number" inputmode="numeric" min="1" value="30"></div><div class="field"><label for="mPage">Parou na página</label><input id="mPage" type="number" inputmode="numeric" value="${b.currentPage || 0}"></div></div>
    <div class="field"><label for="mDate">Quando</label><input id="mDate" type="date" value="${dkey(Date.now())}" max="${dkey(Date.now())}"></div>
    <div class="row"><button class="btn ghost grow" data-a="closeSheet">Cancelar</button><button class="btn grow" id="mSave">Registrar</button></div>
  </div>`, sh => {
    $("#mSave", sh).onclick = () => {
      const min = parseInt($("#mMin").value) || 0; let page = parseInt($("#mPage").value); if (isNaN(page)) page = b.currentPage || 0; if (b.pages) page = Math.min(page, b.pages);
      if (min <= 0) { toast("Informe os minutos."); return; }
      const d = $("#mDate").value ? new Date($("#mDate").value + "T20:00:00").getTime() : Date.now();
      const start = Math.min(Date.now() - min * 60000, d);
      if (b.status !== "lendo" && b.status !== "lido") { b.status = "lendo"; b.startedAt = b.startedAt || start; }
      logSession(b, start, min * 60, Math.max(0, page - (b.currentPage || 0)), page);
      closeSheet(); render();
    };
  });
}

/* ============================================================
   REVISÃO DE FLASHCARDS (tela cheia)
   ============================================================ */
let RV = null;
function startReview(cards) {
  if (!cards || !cards.length) { toast("Nada para revisar agora."); return; }
  S.cards.forEach(c => delete c._missed);
  RV = { queue: cards.slice().sort(() => Math.random() - .5), done: 0, total: cards.length, right: 0, flipped: false };
  $("#full").hidden = false; document.body.style.overflow = "hidden"; renderReview();
}
function renderReview() {
  if (!RV.queue.length) {
    $("#full").innerHTML = `<div class="fs" style="justify-content:center"><div class="bigz">${I.check}</div><h2 style="font-size:34px">Revisão feita</h2><p style="color:var(--night-2ink);margin:0">${plural(RV.done, "resposta", "respostas")}, ${RV.right} de primeira. Volte amanhã para os próximos.</p><button class="btn main" data-a="closeReview" style="margin-top:12px">Concluir</button></div>`;
    return;
  }
  const c = RV.queue[0], b = bookById(c.bookId);
  $("#full").innerHTML = `<div class="fs">
    <div class="top"><button class="ib" data-a="closeReview" aria-label="Sair">${I.x}</button><span class="eyebrow num">${RV.queue.length} restantes</span><span style="width:40px"></span></div>
    <div class="pbar"><i style="width:${Math.round(RV.done / (RV.done + RV.queue.length) * 100)}%"></i></div>
    <div class="flash ${RV.flipped ? "flip" : ""}" data-a="flip"><div class="inner">
      <div class="face"><small>${esc(b ? b.title : "Sem livro")}</small><p>${esc(c.front)}</p><small class="tap">toque para virar</small></div>
      <div class="face back"><small>Resposta</small><p>${esc(c.back)}</p><span class="stamp">Verso</span></div>
    </div></div>
    ${RV.flipped ? `<div class="grades">${[["Errei", 0], ["Difícil", 1], ["Bom", 2], ["Fácil", 3]].map(([l, g]) => `<button class="g${g}" data-a="grade" data-g="${g}">${l}<small>${ivLabel(c, g)}</small></button>`).join("")}</div>` : `<button class="btn main block" data-a="flip">Mostrar resposta</button>`}
  </div>`;
}
function grade(g) {
  const c = RV.queue.shift(); Object.assign(S.cards.find(x => x.id === c.id) || c, nextState(c, g));
  S.reviews.push({ t: Date.now(), g, id: c.id });
  RV.done++; if (g >= 2 && !c._missed) RV.right++;
  if (g === 0) { c._missed = true; Object.assign(c, nextState(c, 0)); RV.queue.splice(Math.min(RV.queue.length, 3), 0, c); }
  RV.flipped = false; save(); renderReview();
}

/* ============================================================
   AÇÕES (delegação de cliques)
   ============================================================ */
const ACT = {
  go: d => go(d.v),
  closeSheet: () => closeSheet(),
  clearSamples: () => confirmSheet("Apagar exemplos?", "Os livros, notas, cards e sessões de demonstração saem. O que você criou fica.", "Apagar exemplos", clearSamples),
  loadSamples: () => { seed(); save(); render(); toast("Exemplos carregados."); },
  addBook: () => bookForm(),
  editBook: d => bookForm(bookById(d.id)),
  openBook: d => { UI.back = ["home", "shelf", "cards", "notes"].includes(UI.view) ? UI.view : "shelf"; UI.bookId = d.id; UI.bookTab = "notes"; go("book"); },
  shelfF: d => { UI.shelfF = d.f; render(); },
  shelfMode: () => { UI.shelfMode = UI.shelfMode === "covers" ? "spines" : "covers"; try { localStorage.setItem("margem.shelfMode", UI.shelfMode); } catch (e) { } render(); },
  bookTab: d => { UI.bookTab = d.t; render(); },
  rate: d => { const b = bookById(UI.bookId); b.rating = b.rating === +d.r ? 0 : +d.r; save(); render(); },
  setStatus: d => { const b = bookById(UI.bookId); b.status = d.s; if (d.s === "lendo") { b.currentPage = 0; b.finishedAt = null; b.startedAt = Date.now(); } save(); render(); },
  saveReview: () => { const b = bookById(UI.bookId); b.review = $("#fReview").value.trim(); save(); toast("Resenha salva."); },
  delSession: d => confirmSheet("Apagar sessão?", "O tempo e as páginas dela saem das suas estatísticas.", "Apagar", () => { S.sessions = S.sessions.filter(s => s.id !== d.id); save(); render(); }),
  manualLog: d => manualLog(d.id),
  addNote: d => noteForm(null, d.book ? { bookId: d.book } : {}),
  editNote: d => noteForm(S.notes.find(n => n.id === d.id)),
  favNote: (d, el, e) => { e.stopPropagation(); const n = S.notes.find(x => x.id === d.id); n.fav = !n.fav; save(); if (UI.view === "notes") $("#noteList").innerHTML = noteList(); else render(); },
  nf: d => { UI.nf = d.f; render(); },
  newFolder: () => openSheet(`<h2>Nova pasta</h2><div class="form"><div class="field"><label for="fdName">Nome</label><input id="fdName" placeholder="Ex.: Estoicismo"></div><div class="row"><button class="btn ghost grow" data-a="closeSheet">Cancelar</button><button class="btn grow" id="fdOk">Criar</button></div></div>`, sh => { setTimeout(() => $("#fdName").focus(), 60); $("#fdOk", sh).onclick = () => { const v = $("#fdName").value.trim(); if (!v) return; if (!S.folders.includes(v)) S.folders.push(v); save(); UI.nf = "f:" + v; closeSheet(); render(); }; }),
  addCard: d => cardForm(null, d.book ? { bookId: d.book } : {}),
  editCard: d => cardForm(S.cards.find(c => c.id === d.id)),
  openDeck: d => deckSheet(d.k),
  review: () => startReview(dueCards()),
  flip: () => { if (!RV) return; RV.flipped = !RV.flipped; renderReview(); },
  grade: (d, el, e) => { e.stopPropagation(); grade(+d.g); },
  closeReview: () => { RV = null; closeFull(); },
  startSession: d => startSession(d.id),
  minSession: () => { closeFull(); toast("A sessão continua contando. Toque no relógio para voltar."); },
  pauseSession: () => { const a = S.active; if (a.pausedAt) { a.pausedTotal += Date.now() - a.pausedAt; a.pausedAt = null; } else a.pausedAt = Date.now(); save(); renderSession(); },
  cancelSession: () => confirmSheet("Descartar sessão?", "O tempo desta sessão não será registrado.", "Descartar", () => { S.active = null; save(); closeFull(); toast("Sessão descartada."); }),
  endSession: () => endSessionSheet(),
  sessNote: () => { noteForm(null, { bookId: S.active.bookId }); setTimeout(() => { const m = $('#sheet [data-x="mic"]'); if (m) dictate(m, $("#nText")); }, 150); },
  calM: d => { const c = new Date(UI.calM); c.setMonth(c.getMonth() + +d.d); UI.calM = c.getTime(); render(); },
  period: d => { UI.period = d.p; render(); },
  saveSettings: () => { const s = S.settings; s.name = $("#sName").value.trim(); s.weekGoal = Math.max(10, parseInt($("#sWeek").value) || 210); s.yearGoal = Math.max(1, parseInt($("#sYear").value) || 12); s.theme = $("#sTheme").value; applyTheme(); save(); toast("Ajustes salvos."); },
  exportData: async () => {
    const imgs = {}; for (const [k, v] of await DB.entries("img")) imgs[k] = v; Object.assign(imgs, IMG);
    const blob = new Blob([JSON.stringify({ app: "margem", exportedAt: new Date().toISOString(), state: S, images: imgs })], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `margem-backup-${dkey(Date.now())}.json`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast("Backup gerado.");
  },
  importData: () => { const el = $("#pickJson"); el.value = ""; el.click(); },
  wipe: () => confirmSheet("Apagar tudo?", "Todos os livros, fotos, notas, cards e sessões deste aparelho serão removidos. Faça um backup antes se quiser guardar.", "Apagar tudo", async () => { await DB.clear("img"); for (const k in IMG) delete IMG[k]; S = DEFAULT(); S.seeded = true; save(); go("home"); toast("Tudo apagado."); }),
};
$("#pickJson").addEventListener("change", async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text()); if (!j.state || !Array.isArray(j.state.books)) throw new Error("formato");
    confirmSheet("Importar backup?", `O arquivo tem ${plural(j.state.books.length, "livro", "livros")} e ${plural((j.state.notes || []).length, "nota", "notas")}. Os dados atuais serão substituídos.`, "Importar", async () => {
      await DB.clear("img"); for (const k in IMG) delete IMG[k];
      for (const [k, v] of Object.entries(j.images || {})) { IMG[k] = v; await DB.set("img", k, v); }
      S = Object.assign(DEFAULT(), j.state); S.seeded = true; save(); applyTheme(); go("home"); toast("Backup importado.");
    }, false);
  } catch (err) { toast("Esse arquivo não parece um backup do Margem."); }
});

document.addEventListener("click", e => {
  const el = e.target.closest("[data-a]"); if (!el) return;
  const fn = ACT[el.dataset.a]; if (fn) fn(el.dataset, el, e);
});
document.addEventListener("keydown", e => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches('[role="button"][data-a]')) { e.preventDefault(); e.target.click(); }
  if (e.key === "Escape" && !$("#sheet").hidden) closeSheet();
  if (RV && !$("#full").hidden && $("#sheet").hidden) {
    if (e.key === " " && !e.target.matches("input,textarea,button")) { e.preventDefault(); ACT.flip(); }
    if (RV.flipped && ["1", "2", "3", "4"].includes(e.key)) grade(+e.key - 1);
  }
});
document.addEventListener("input", e => {
  const k = e.target.dataset.in; if (!k) return;
  if (k === "shelfQ") { UI.q = e.target.value; $("#shelfList").innerHTML = shelfList(); }
  if (k === "noteQ") { UI.nq = e.target.value; $("#noteList").innerHTML = noteList(); }
});
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && S.active && !$("#full").hidden) { updTimer(); keepAwake(); } });

function applyTheme() { const t = S.settings.theme; if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme"); }

/* ---------------- início ---------------- */
(async function boot() {
  try { UI.shelfMode = localStorage.getItem("margem.shelfMode") || "covers"; } catch (e) { }
  const ok = await DB.open();
  if (ok) {
    const st = await DB.get("kv", "state");
    if (st && Array.isArray(st.books)) S = Object.assign(DEFAULT(), st);
    for (const [k, v] of await DB.entries("img")) IMG[k] = v;
  }
  if (!S.seeded) { seed(); save(); }
  applyTheme(); render();
  if (S.active) openSession();
})();
