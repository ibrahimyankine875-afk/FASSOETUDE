// YANKINÉ — script commun : bouton d'installation et recherche
(function () {
  'use strict';

  // Bouton "Installer l'application" (apparaît seulement si le navigateur le propose)
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

  // Recherche dans une liste de cartes (input#search + [data-search])
  var search = document.getElementById('search');
  if (search) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search]'));
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
