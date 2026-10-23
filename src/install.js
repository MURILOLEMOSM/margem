"use strict";
/* ============================================================
   Margem · instalação (PWA)
   1. Registra o service worker e recarrega quando sai versão nova
   2. Mostra "Instalar" quando o app ainda não está instalado
   3. Usa a instalação do navegador quando existe; se não, mostra
      o passo a passo certo para o aparelho (iPhone, Samsung etc.)
   ============================================================ */
const Install = (() => {
  const root = document.documentElement;
  const ua = navigator.userAgent;
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(ua);
  const inApp = /instagram|fban|fbav|fb_iab|line\/|tiktok|musical_ly|snapchat|twitter|linkedinapp|; wv\)/i.test(ua);
  const isSamsung = /samsungbrowser/i.test(ua);
  const isFirefox = /firefox|fxios/i.test(ua);
  const iosSafari = isIOS && !/crios|fxios|edgios|opios/i.test(ua);
  let deferred = null;

  /* ---------- service worker ---------- */
  if ("serviceWorker" in navigator && window.isSecureContext) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(err => console.warn("[Margem] service worker:", err)));
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController || reloaded) return;
      if (S && S.active) return; // não interrompe uma sessão de leitura; atualiza na próxima abertura
      reloaded = true; location.reload();
    });
  }

  if (!standalone && (isIOS || isAndroid)) root.classList.add("can-install");
  const refresh = () => { if (typeof render === "function" && window.__margemBooted && $("#full").hidden && $("#sheet").hidden) render(); };

  addEventListener("beforeinstallprompt", e => {
    e.preventDefault(); deferred = e;
    if (!standalone) { root.classList.add("can-install"); refresh(); }
  });
  addEventListener("appinstalled", () => {
    deferred = null; root.classList.remove("can-install");
    toast("Margem instalado. Ele já está na sua tela inicial."); refresh();
  });

  function steps() {
    if (inApp) return { title: "Abra no navegador", items: [
      "Este link abriu dentro de outro app, e por aqui não dá para instalar.",
      `Toque nos três pontinhos (ou em compartilhar) e escolha "Abrir no ${isIOS ? "Safari" : "Chrome"}".`,
      "Lá, toque em Instalar de novo."] };
    if (isIOS) return { title: "Instalar no iPhone", items: iosSafari ? [
      "Toque em Compartilhar, o quadrado com a seta para cima, na barra do Safari.",
      "Role e escolha \"Adicionar à Tela de Início\".",
      "Toque em Adicionar. O Margem aparece com ícone próprio."] : [
      "Toque em Compartilhar, perto da barra de endereço.",
      "Escolha \"Adicionar à Tela de Início\". Se não aparecer, abra esta página no Safari e faça por lá.",
      "Toque em Adicionar. O Margem aparece com ícone próprio."] };
    if (isSamsung) return { title: "Instalar no Android", items: [
      "Toque no menu, as três linhas embaixo.", "Escolha \"Adicionar página a\" e depois \"Tela inicial\".", "Confirme. O Margem aparece com ícone próprio."] };
    if (isFirefox) return { title: "Instalar no Android", items: [
      "Toque nos três pontinhos.", "Escolha \"Instalar\" ou \"Adicionar à tela inicial\".", "Confirme. O Margem aparece com ícone próprio."] };
    if (isAndroid) return { title: "Instalar no Android", items: [
      "Se tiver um X no canto de cima (a página abriu por outro app), toque nos três pontinhos e em \"Abrir no Chrome\" primeiro.",
      "No Chrome, toque nos três pontinhos, no canto de cima.",
      "Escolha \"Instalar app\" (ou \"Adicionar à tela inicial\" e depois \"Instalar\"). O Margem aparece com ícone próprio."] };
    return { title: "Instalar no computador", items: [
      "No Chrome ou no Edge, clique no ícone de instalar no fim da barra de endereço.",
      "Ou abra o menu do navegador e escolha \"Instalar Margem\"."] };
  }

  async function start() {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;
      if (outcome === "accepted") root.classList.remove("can-install");
      refresh(); return;
    }
    const s = steps();
    openSheet(`<h2>${s.title}</h2><ol class="steps">${s.items.map(t => `<li>${esc(t)}</li>`).join("")}</ol><button class="btn block" data-a="closeSheet">Entendi</button>`);
  }

  const can = () => !standalone && root.classList.contains("can-install");
  const dismissedAt = () => { try { return +localStorage.getItem("margem.installLater") || 0; } catch (e) { return 0; } };

  /* cartão que aparece no início para quem abriu pelo link */
  function cardHTML() {
    if (!can() || Date.now() - dismissedAt() < 5 * DAY) return "";
    return `<section class="installcard">
      <div class="ic">${MARK}</div>
      <div class="grow"><b>Instale o Margem</b><small>Fica com ícone na tela inicial, abre em tela cheia e funciona sem internet.</small></div>
      <div class="row"><button class="btn acc sm" data-a="install">${I.download} Instalar</button><button class="btn ghost sm" data-a="installLater">Agora não</button></div>
    </section>`;
  }
  const buttonHTML = () => `<button class="install-btn" data-a="install">${I.download}<span>Instalar</span></button>`;

  Object.assign(ACT, {
    install: () => start(),
    installLater: () => { try { localStorage.setItem("margem.installLater", String(Date.now())); } catch (e) { } render(); },
  });

  refresh();
  return { can, start, cardHTML, buttonHTML, standalone };
})();
window.Install = Install;
