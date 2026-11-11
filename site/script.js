/* theolegrain.fr — animations communes à toutes les pages.
   Aucune dépendance. Tout est coupé si l'utilisateur
   a demandé moins de mouvement dans son système. */
(function () {
  'use strict';

  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var large = window.matchMedia('(min-width: 861px) and (hover: hover)');
  var tous = function (sel, racine) { return Array.prototype.slice.call((racine || document).querySelectorAll(sel)); };

  /* ── 1. Grands titres : découpe en lettres ── */
  if (!calme) {
    tous('[data-lettres]').forEach(function (titre) {
      var texte = titre.textContent.replace(/[ \t\n\r]+/g, ' ').trim();
      var i = 0;
      var noeuds = Array.prototype.slice.call(titre.childNodes);
      titre.setAttribute('aria-label', texte);
      titre.textContent = '';
      noeuds.forEach(function (noeud) {
        if (noeud.nodeType !== 3) {            // <br> conservé tel quel
          titre.appendChild(noeud);
          return;
        }
        noeud.textContent.split(/([ \t\n\r]+)/).forEach(function (bout) {
          if (!bout) return;
          if (/^[ \t\n\r]+$/.test(bout)) { titre.appendChild(document.createTextNode(' ')); return; }
          var mot = document.createElement('span');
          mot.className = 'mot';
          mot.setAttribute('aria-hidden', 'true');
          bout.split('').forEach(function (c) {
            var lettre = document.createElement('span');
            lettre.className = 'lettre';
            lettre.style.setProperty('--i', i++);
            lettre.textContent = c;
            mot.appendChild(lettre);
          });
          titre.appendChild(mot);
        });
      });
    });
  }

  /* ── 2. Révélations au défilement ── */
  var cibles = tous('[data-rev]');
  if (calme || !('IntersectionObserver' in window)) {
    cibles.forEach(function (el) { el.classList.add('vu'); });
  } else {
    // Léger décalage entre voisins d'une même grille
    cibles.forEach(function (el) {
      var freres = tous(':scope > [data-rev]', el.parentNode);
      var rang = freres.indexOf(el);
      if (rang > 0) el.style.setProperty('--d', (rang % 4) * 0.09 + 's');
    });
    var veilleur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('vu');
        veilleur.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    cibles.forEach(function (el) { veilleur.observe(el); });
  }

  /* ── 3. Barre de navigation : se cache en descendant, revient en remontant ── */
  var barres = tous('.barre-fixe');
  var dernierY = window.scrollY;
  function majBarre() {
    var y = window.scrollY;
    barres.forEach(function (b) {
      b.classList.toggle('est-fond', y > 40);
      b.classList.toggle('est-cachee', y > 320 && y > dernierY);
    });
    dernierY = y;
  }

  /* ── 4. Piste horizontale des designs en vrac ── */
  var defiles = tous('.defile').map(function (section) {
    return {
      section: section,
      piste: section.querySelector('.defile-piste'),
      jauge: section.querySelector('.defile-jauge span'),
      distance: 0
    };
  });
  function mesurerDefiles() {
    defiles.forEach(function (d) {
      var actif = !calme && large.matches;
      d.section.classList.toggle('est-epingle', actif);
      d.piste.style.transform = '';
      d.section.style.height = '';
      d.distance = 0;
      if (!actif) return;
      d.distance = Math.max(0, d.piste.scrollWidth - window.innerWidth);
      d.section.style.height = 'calc(100vh + ' + d.distance + 'px)';
    });
  }
  function majDefiles() {
    defiles.forEach(function (d) {
      if (!d.distance) return;
      var r = d.section.getBoundingClientRect();
      var course = r.height - window.innerHeight;
      var p = course > 0 ? Math.min(1, Math.max(0, -r.top / course)) : 0;
      d.piste.style.transform = 'translate3d(' + (-p * d.distance).toFixed(1) + 'px,0,0)';
      if (d.jauge) d.jauge.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    });
  }

  /* ── 5. Parallaxe douce sur quelques visuels ── */
  var flottants = tous('[data-px]').map(function (el) {
    return { el: el, force: parseFloat(el.getAttribute('data-px')) || 0, y: 0 };
  });
  function majParallaxe() {
    var actif = !calme && large.matches;
    var milieu = window.innerHeight / 2;
    flottants.forEach(function (f) {
      if (!actif) { if (f.y) { f.el.style.transform = ''; f.y = 0; } return; }
      var r = f.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      var centre = r.top - f.y + r.height / 2;
      f.y = (centre - milieu) * -f.force;
      f.el.style.transform = 'translate3d(0,' + f.y.toFixed(1) + 'px,0)';
    });
  }

  /* ── 6. La pile d'affiches de l'accueil suit le pointeur ── */
  if (!calme) {
    tous('.accueil-tete').forEach(function (tete) {
      var pile = tete.querySelector('.pile');
      if (!pile) return;
      tete.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = tete.getBoundingClientRect();
        pile.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
        pile.style.setProperty('--my', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
      });
      tete.addEventListener('pointerleave', function () {
        pile.style.setProperty('--mx', 0);
        pile.style.setProperty('--my', 0);
      });
    });
  }

  /* ── Boucle : une seule mise à jour par image affichée ── */
  var prevu = false;
  function image() {
    prevu = false;
    majBarre();
    majDefiles();
    majParallaxe();
  }
  function demander() {
    if (prevu) return;
    prevu = true;
    window.requestAnimationFrame(image);
  }
  function toutRecalculer() { mesurerDefiles(); demander(); }

  window.addEventListener('scroll', demander, { passive: true });
  window.addEventListener('resize', toutRecalculer);
  window.addEventListener('load', toutRecalculer);
  if (large.addEventListener) large.addEventListener('change', toutRecalculer);
  toutRecalculer();
})();
