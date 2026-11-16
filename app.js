// FASSOETUDE — script commun : onglets, QCM interactif, vidéo YouTube légère, recherche, installation
(function () {
  'use strict';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // 1) Bouton "Installer l'application" (apparaît seulement si le navigateur le propose)
  var deferredPrompt = null;
  var installBtn = document.getElementById('install-btn');
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.classList.add('show');
  });
  if (installBtn) {
    installBtn.addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () {
        deferredPrompt = null;
        installBtn.classList.remove('show');
      });
    });
  }

  // 2) Onglets d'un chapitre : Cours / Résumé / QCM / Vidéo / Podcast
  var tabs = $$('.tabs [role="tab"]');
  if (tabs.length) {
    var ids = tabs.map(function (t) { return t.getAttribute('aria-controls'); });
    var show = function (id, remember) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('aria-controls') === id;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (remember && window.history && history.replaceState) {
        history.replaceState(null, '', '#' + id);
      }
    };
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        show(t.getAttribute('aria-controls'), true);
        var bar = $('.tabs');
        if (bar && bar.scrollIntoView) bar.scrollIntoView({ block: 'start' });
      });
    });
    var wanted = location.hash.replace('#', '');
    show(ids.indexOf(wanted) > -1 ? wanted : ids[0], false);
  }

  // 3) QCM interactif : correction immédiate, explication et score final
  $$('.qcm').forEach(function (box) {
    var dataEl = $('script.qcm-data', box);
    if (!dataEl) return;
    var qs;
    try { qs = JSON.parse(dataEl.textContent); } catch (e) { return; }
    if (!qs || !qs.length) return;

    var i = 0, score = 0;
    var area = el('div', 'qcm-box');
    box.appendChild(area);

    function render() {
      area.innerHTML = '';
      if (i >= qs.length) { result(); return; }
      var q = qs[i];
      area.appendChild(el('p', 'qcm-count', 'Question ' + (i + 1) + ' sur ' + qs.length));
      area.appendChild(el('p', 'qcm-q', q.q));

      var why = el('div', 'qcm-why');
      why.hidden = true;
      var next = el('button', 'btn small', i + 1 < qs.length ? 'Question suivante' : 'Voir mon score');
      next.type = 'button';
      next.hidden = true;

      var opts = [];
      q.options.forEach(function (text, k) {
        var b = el('button', 'qcm-opt', text);
        b.type = 'button';
        b.addEventListener('click', function () {
          opts.forEach(function (x, j) {
            x.disabled = true;
            if (j === q.answer) x.classList.add('right');
          });
          if (k === q.answer) { score++; } else { b.classList.add('wrong'); }
          why.textContent = (k === q.answer ? 'Bonne réponse ! ' : 'Pas tout à fait. ') + (q.why || '');
          why.hidden = false;
          next.hidden = false;
        });
        opts.push(b);
        area.appendChild(b);
      });
      area.appendChild(why);
      area.appendChild(next);
      next.addEventListener('click', function () { i++; render(); });
    }

    function result() {
      var pct = Math.round((score / qs.length) * 100);
      var msg = pct >= 80 ? 'Très bien ! Tu maîtrises ce chapitre.'
        : pct >= 50 ? 'Pas mal. Relis le résumé, puis recommence.'
        : 'Reprends le cours et le résumé, puis réessaie : tu vas progresser.';
      area.appendChild(el('p', 'qcm-score', 'Ton score : ' + score + ' / ' + qs.length));
      area.appendChild(el('p', 'qcm-msg', msg));
      var again = el('button', 'btn small', 'Recommencer');
      again.type = 'button';
      again.addEventListener('click', function () { i = 0; score = 0; render(); });
      area.appendChild(again);
    }

    render();
  });

  // 4) Vidéo YouTube : rien n'est chargé tant que l'étudiant n'appuie pas sur Lire
  $$('.yt').forEach(function (box) {
    var id = (box.getAttribute('data-id') || '').trim();
    var wrap = box.closest ? box.closest('.yt-wrap') : null;
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) {
      if (wrap) wrap.hidden = true; else box.hidden = true;
      return;
    }
    var title = box.getAttribute('data-title') || 'Vidéo';
    var btn = el('button', 'yt-play', '▶  Lire la vidéo');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Lire la vidéo : ' + title);
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      f.title = title;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(f);
    });
    box.appendChild(btn);
    var link = el('a', 'yt-link', 'Ouvrir sur YouTube');
    link.href = 'https://www.youtube.com/watch?v=' + id;
    link.target = '_blank';
    link.rel = 'noopener';
    if (box.parentNode) box.parentNode.insertBefore(link, box.nextSibling);
  });

  // 5) Recherche dans une liste de cartes (input#search + [data-search])
  var search = document.getElementById('search');
  if (search) {
    var cards = $$('[data-search]');
    var empty = document.getElementById('no-result');
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var hit = !q || c.getAttribute('data-search').toLowerCase().indexOf(q) !== -1;
        c.style.display = hit ? '' : 'none';
        if (hit) shown++;
      });
      if (empty) empty.style.display = shown ? 'none' : 'block';
    });
  }
})();
