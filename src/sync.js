"use strict";
/* ============================================================
   Margem · sincronização com Supabase
   - Login por e-mail e senha
   - Estado inteiro numa linha da tabela margem_state (jsonb)
   - Fotos no bucket privado margem-imagens/<user_id>/<id>.jpg
   - Mescla por id com registro de exclusões, então dá pra usar
     offline em dois aparelhos sem perder o que foi criado em cada um
   ============================================================ */
const Sync = (() => {
  const cfg = window.MARGEM_CONFIG || {};
  const BUCKET = "margem-imagens";
  const TABLE = "margem_state";
  const enabled = !!(cfg.supabaseUrl && cfg.supabaseKey && window.supabase);
  const LOCAL_ONLY = ["active", "syncedOnce", "syncedImgs", "seeded"];
  let sb = null, user = null, timer = null, busy = false, again = false, status = "off", errMsg = "", lastSync = 0, started = false;

  try { lastSync = +localStorage.getItem("margem.lastSync") || 0; } catch (e) { }
  let pendingDel = [];
  try { pendingDel = JSON.parse(localStorage.getItem("margem.pendingDel") || "[]"); } catch (e) { }
  const savePending = () => { try { localStorage.setItem("margem.pendingDel", JSON.stringify(pendingDel)); } catch (e) { } };

  if (enabled) {
    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "margem.auth" }
    });
  }

  function setStatus(s, msg = "") {
    status = s; errMsg = msg;
    const el = document.getElementById("syncStatus");
    if (el) el.outerHTML = statusHTML();
  }
  function statusHTML() {
    const map = {
      off: ["Desligada", ""], sync: ["Sincronizando…", "pill"], ok: ["Em dia", "pill"],
      offline: ["Sem internet, sincroniza quando voltar", "pill"], erro: ["Erro: " + errMsg, "pill hot"]
    };
    const [t, c] = map[status] || map.off;
    return `<span id="syncStatus" class="${c}" style="display:inline-block;margin-top:6px">${esc(t)}</span>`;
  }

  /* ---------- mescla ---------- */
  const strip = st => { const o = Object.assign({}, st); LOCAL_ONLY.forEach(k => delete o[k]); return o; };
  const sameData = (a, b) => JSON.stringify(strip(a)) === JSON.stringify(strip(b));
  function merge(a, b) {
    const newer = (b.updatedAt || 0) > (a.updatedAt || 0) ? b : a, older = newer === a ? b : a;
    const del = Object.assign({}, older.deleted || {}, newer.deleted || {});
    const cutoff = Date.now() - 120 * DAY;
    for (const k in del) if (del[k] < cutoff) delete del[k];
    const out = Object.assign(DEFAULT(), strip(older), strip(newer));
    for (const k of ["books", "sessions", "notes", "cards"]) {
      const m = new Map();
      for (const x of older[k] || []) m.set(x.id, x);
      for (const x of newer[k] || []) m.set(x.id, x);
      out[k] = [...m.values()].filter(x => !del[x.id]);
    }
    const rv = new Map();
    for (const r of [...(older.reviews || []), ...(newer.reviews || [])]) rv.set(r.t + ":" + (r.id || ""), r);
    out.reviews = [...rv.values()].filter(r => !(r.sample && del.__samples)).sort((x, y) => x.t - y.t);
    out.folders = [...new Set([...(newer.folders || []), ...(older.folders || [])])];
    out.settings = Object.assign({}, older.settings, newer.settings);
    out.deleted = del;
    out.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
    return out;
  }
  const onlySamples = st => st.books.every(x => x.sample) && st.notes.every(x => x.sample) && st.cards.every(x => x.sample) && st.sessions.every(x => x.sample);
  function dropSamplesLocal() {
    S.books = S.books.filter(x => !x.sample); S.notes = S.notes.filter(x => !x.sample);
    S.cards = S.cards.filter(x => !x.sample); S.sessions = S.sessions.filter(x => !x.sample); S.reviews = S.reviews.filter(x => !x.sample);
  }

  /* ---------- fotos ---------- */
  const refImgs = st => new Set([...st.books.map(b => b.coverId), ...st.notes.map(n => n.imgId)].filter(Boolean));
  const path = id => `${user.id}/${id}.jpg`;
  const dataToBlob = d => fetch(d).then(r => r.blob());
  const blobToData = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
  async function pushImages(st) {
    const done = new Set(S.syncedImgs || []);
    for (const id of refImgs(st)) {
      if (done.has(id) || !IMG[id]) continue;
      const { error } = await sb.storage.from(BUCKET).upload(path(id), await dataToBlob(IMG[id]), { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      done.add(id);
    }
    S.syncedImgs = [...done];
  }
  async function pullImages(st) {
    const done = new Set(S.syncedImgs || []);
    for (const id of refImgs(st)) {
      if (IMG[id]) continue;
      const { data, error } = await sb.storage.from(BUCKET).download(path(id));
      if (error || !data) continue; // foto ainda não enviada pelo outro aparelho
      const url = await blobToData(data); IMG[id] = url; await DB.set("img", id, url); done.add(id);
    }
    S.syncedImgs = [...done];
  }
  async function flushDeletes() {
    if (!pendingDel.length) return;
    const { error } = await sb.storage.from(BUCKET).remove(pendingDel.map(path));
    if (!error) { pendingDel = []; savePending(); }
  }

  /* ---------- ciclo de sincronização ---------- */
  async function syncNow() {
    if (!enabled || !user) return;
    if (!navigator.onLine) { setStatus("offline"); return; }
    if (busy) { again = true; return; }
    busy = true; setStatus("sync");
    try {
      const { data: row, error } = await sb.from(TABLE).select("state").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      const remote = row && row.state && Array.isArray(row.state.books) ? row.state : null;
      if (remote && !S.syncedOnce && onlySamples(S)) dropSamplesLocal();
      let merged = remote ? merge(S, remote) : strip(S);
      await pullImages(merged);
      if (!sameData(merged, S)) {
        merged = merge(S, merged); // pega edições feitas enquanto baixava
        const keep = { active: S.active, syncedImgs: S.syncedImgs, seeded: true };
        S = Object.assign(merged, keep);
        await DB.set("kv", "state", S);
        if (S.active && !bookById(S.active.bookId)) S.active = null;
        render();
      }
      await pushImages(S);
      await flushDeletes();
      if (!remote || !sameData(remote, S)) {
        const { error: e2 } = await sb.from(TABLE).upsert({ user_id: user.id, state: strip(S), updated_at: new Date().toISOString() });
        if (e2) throw e2;
      }
      S.syncedOnce = true; await DB.set("kv", "state", S);
      lastSync = Date.now(); try { localStorage.setItem("margem.lastSync", String(lastSync)); } catch (e) { }
      setStatus("ok");
      const el = document.getElementById("syncWhen"); if (el) el.textContent = whenText();
    } catch (e) {
      console.warn("[Margem] sync", e);
      setStatus("erro", e.message || "falha ao sincronizar");
    } finally {
      busy = false;
      if (again) { again = false; schedule(800); }
    }
  }
  function schedule(ms = 2500) { if (!user) return; clearTimeout(timer); timer = setTimeout(syncNow, ms); }
  function queueImgDelete(id) { if (!user || !(S.syncedImgs || []).includes(id)) return; pendingDel.push(id); savePending(); S.syncedImgs = S.syncedImgs.filter(x => x !== id); }

  async function init() {
    if (started) return; started = true;
    if (!enabled) return;
    const { data } = await sb.auth.getSession();
    user = data.session ? data.session.user : null;
    sb.auth.onAuthStateChange((ev, session) => {
      const was = user && user.id; user = session ? session.user : null;
      if (user && user.id !== was) { toast("Conectado. Sincronizando sua estante…"); syncNow(); }
      if (!user) setStatus("off");
      if (ev === "PASSWORD_RECOVERY") openSheet(`<h2>Nova senha</h2><div class="form"><div class="field"><label for="npPass">Nova senha</label><input id="npPass" type="password" autocomplete="new-password" minlength="6"></div><button class="btn" id="npOk">Salvar senha</button></div>`, sh => {
        sh.querySelector("#npOk").onclick = async () => { const pw = sh.querySelector("#npPass").value; if (pw.length < 6) { toast("Mínimo 6 caracteres."); return; } const { error } = await sb.auth.updateUser({ password: pw }); if (error) toast("Não consegui salvar: " + error.message); else { closeSheet(); toast("Senha atualizada."); } };
      });
      if (UI.view === "settings") render();
    });
    if (user) syncNow();
    addEventListener("online", () => syncNow());
    addEventListener("offline", () => user && setStatus("offline"));
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") syncNow(); });
    setInterval(() => { if (document.visibilityState === "visible") syncNow(); }, 5 * 60000);
  }

  const whenText = () => lastSync ? "Última sincronização: " + fmtDate(lastSync) + ", " + pad(new Date(lastSync).getHours()) + ":" + pad(new Date(lastSync).getMinutes()) : "Ainda não sincronizado";

  /* ---------- tela de ajustes ---------- */
  function settingsHTML() {
    if (!enabled) return `<section class="card"><div class="sh"><h2>Nuvem</h2></div><p class="hint">A sincronização não está configurada nesta versão. Preencha src/config.js com a URL e a chave do Supabase.</p></section>`;
    if (user) return `<section class="card">
      <div class="sh"><h2>Nuvem</h2></div>
      <div class="list">
        <div class="li"><div class="grow"><b>${esc(user.email)}</b><small id="syncWhen">${whenText()}</small><br>${statusHTML()}</div></div>
      </div>
      <p class="hint" style="margin:12px 0">Livros, fotos, notas, flashcards e sessões ficam salvos na sua conta. Entre com o mesmo e-mail em outro aparelho e tudo aparece lá.</p>
      <div class="row"><button class="btn acc grow" data-a="syncNow">Sincronizar agora</button><button class="btn ghost grow" data-a="syncOut">Sair</button></div>
    </section>`;
    return `<section class="card">
      <div class="sh"><h2>Nuvem</h2></div>
      <p class="hint" style="margin-bottom:14px">Entre para salvar sua estante na nuvem e usar no celular e no computador. Sem conta, tudo continua só neste aparelho.</p>
      <div class="form">
        <div class="field"><label for="auEmail">E-mail</label><input id="auEmail" type="email" autocomplete="email" inputmode="email" placeholder="voce@email.com"></div>
        <div class="field"><label for="auPass">Senha</label><input id="auPass" type="password" autocomplete="current-password" minlength="6" placeholder="mínimo 6 caracteres"></div>
        <div class="row"><button class="btn grow" data-a="syncIn">Entrar</button><button class="btn alt grow" data-a="syncUp">Criar conta</button></div>
        <button class="link" data-a="syncReset" style="align-self:flex-start">Esqueci a senha</button>
      </div>
    </section>`;
  }
  const creds = () => ({ email: (document.getElementById("auEmail") || {}).value?.trim(), password: (document.getElementById("auPass") || {}).value || "" });

  Object.assign(ACT, {
    syncNow: () => syncNow(),
    syncIn: async () => {
      const c = creds(); if (!c.email || c.password.length < 6) { toast("Preencha e-mail e senha (mínimo 6 caracteres)."); return; }
      const { error } = await sb.auth.signInWithPassword(c);
      if (error) toast(/confirm/i.test(error.message) ? "Confirme seu e-mail pelo link que enviamos e tente de novo." : "Não consegui entrar: e-mail ou senha incorretos.");
    },
    syncUp: async () => {
      const c = creds(); if (!c.email || c.password.length < 6) { toast("Preencha e-mail e senha (mínimo 6 caracteres)."); return; }
      const { data, error } = await sb.auth.signUp({ ...c, options: { emailRedirectTo: location.origin + location.pathname } });
      if (error) { toast("Não consegui criar a conta: " + error.message); return; }
      if (!data.session) toast("Conta criada. Abra o link que enviamos para " + c.email + " e depois entre aqui.", 6000);
    },
    syncReset: async () => {
      const c = creds(); if (!c.email) { toast("Digite seu e-mail primeiro."); return; }
      const { error } = await sb.auth.resetPasswordForEmail(c.email, { redirectTo: location.origin + location.pathname });
      toast(error ? "Não consegui enviar: " + error.message : "Enviamos um link para redefinir a senha.");
    },
    syncOut: () => confirmSheet("Sair da conta?", "Seus dados continuam neste aparelho e na nuvem. Só para de sincronizar até você entrar de novo.", "Sair", async () => {
      await sb.auth.signOut(); S.syncedOnce = false; S.syncedImgs = []; save(); toast("Você saiu da conta.");
    }, false),
  });

  return { init, schedule, syncNow, queueImgDelete, settingsHTML, get user() { return user; }, enabled };
})();
window.Sync = Sync;
if (window.__margemBooted) Sync.init();
