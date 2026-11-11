/* theolegrain.fr — animations communes à toutes les pages.
   Aucune dépendance. Tout est coupé si l'utilisateur a demandé
   moins de mouvement dans son système (prefers-reduced-motion). */
(function () {
  'use strict';

  var racine = document.documentElement;
  window.__tl = {};

  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var large = window.matchMedia('(min-width: 861px) and (hover: hover)');
  var souris = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var tous = function (sel, base) { return Array.prototype.slice.call((base || document).querySelectorAll(sel)); };
  var borne = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var stock = {
    lire: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    ecrire: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } },
    oter: function (k) { try { window.sessionStorage.removeItem(k); } catch (e) { /* idem */ } }
  };
  var creer = function (classe, html) {
    var el = document.createElement('div');
    el.className = classe;
    el.setAttribute('aria-hidden', 'true');
    if (html) el.innerHTML = html;
    document.body.appendChild(el);
    return el;
  };

  /* ══ 1. Arrivée sur la page : écran de chargement ou rideau ══ */
  function pret() { racine.classList.add('pret'); }

  var rideau = null;
  if (calme) {
    racine.classList.remove('charge', 'arrive');
    pret();
  } else {
    rideau = creer('rideau');

    if (racine.classList.contains('charge')) {
      // Première visite de la session : compteur de 0 à 100
      var chargeur = creer('chargeur', '<span class="chargeur-nom">Théo Legrain</span><span class="chargeur-compte">0</span>');
      var compte = chargeur.lastChild;
      var debut = window.performance.now();
      var charge = document.readyState === 'complete';
      window.addEventListener('load', function () { charge = true; });
      racine.classList.remove('charge');
      (function tic() {
        var ecoule = window.performance.now() - debut;
        var e = borne(ecoule / 1500, 0, 1);
        var plafond = (charge || ecoule > 4000) ? 100 : 90;
        var n = Math.min(plafond, Math.round(100 * (1 - Math.pow(1 - e, 3))));
        compte.textContent = n;
        if (n < 100) { window.requestAnimationFrame(tic); return; }
        stock.ecrire('tl-vu', '1');
        window.setTimeout(function () {
          chargeur.classList.add('fini');
          pret();
          window.setTimeout(function () { chargeur.remove(); }, 1200);
        }, 250);
      })();
    } else if (racine.classList.contains('arrive')) {
      // On vient d'une autre page du site : le rideau se lève
      rideau.className = 'rideau pose';
      racine.classList.remove('arrive');
      stock.oter('tl-nav');
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          rideau.className = 'rideau decouvre';
          window.setTimeout(pret, 150);
        });
      });
    } else {
      pret();
    }

    // Joue le rideau autour d'une action (utilisé aussi par l'aperçu)
    window.__tl.rideau = function (action) {
      rideau.className = 'rideau';
      void rideau.offsetHeight;
      rideau.className = 'rideau couvre';
      window.setTimeout(function () {
        action();
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () { rideau.className = 'rideau decouvre'; });
        });
      }, 580);
    };

    // Départ vers une autre page du site : le rideau monte, puis on navigue
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      if (a.origin !== window.location.origin || !/^https?:$/.test(a.protocol)) return;
      if (a.pathname === window.location.pathname) return;       // simple ancre dans la page
      e.preventDefault();
      stock.ecrire('tl-nav', '1');
      rideau.className = 'rideau';
      void rideau.offsetHeight;
      rideau.className = 'rideau couvre';
      window.setTimeout(function () { window.location.href = a.href; }, 580);
    });
    // Retour arrière du navigateur : on ne laisse pas le rideau baissé
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) { rideau.className = 'rideau'; pret(); }
    });
  }

  /* ══ 2. Découpe des textes ══ */
  if (!calme) {
    // Grands titres : une lettre = un élément animé
    tous('[data-lettres]').forEach(function (titre) {
      var texte = titre.textContent.replace(/[ \t\n\r]+/g, ' ').trim();
      var i = 0;
      var noeuds = Array.prototype.slice.call(titre.childNodes);
      titre.setAttribute('aria-label', texte);
      titre.textContent = '';
      noeuds.forEach(function (noeud) {
        if (noeud.nodeType !== 3) { titre.appendChild(noeud); return; }   // <br> conservé
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
  // Phrase qui s'allume mot à mot au défilement
  var phrases = calme ? [] : tous('[data-mots]').map(function (p) {
    var mots = p.textContent.trim().split(/[ \t\n\r]+/);
    p.textContent = '';
    var spans = mots.map(function (m, i) {
      var s = document.createElement('span');
      s.className = 'm';
      s.textContent = m;
      p.appendChild(s);
      if (i < mots.length - 1) p.appendChild(document.createTextNode(' '));
      return s;
    });
    return { el: p, mots: spans, allumes: -1 };
  });

  /* ══ 3. Révélations au défilement ══ */
  var cibles = tous('[data-rev]');
  if (calme || !('IntersectionObserver' in window)) {
    cibles.forEach(function (el) { el.classList.add('vu'); });
  } else {
    cibles.forEach(function (el) {
      var freres = tous(':scope > [data-rev]', el.parentNode);
      var rang = freres.indexOf(el);
      if (rang > 0 && !el.style.getPropertyValue('--d')) el.style.setProperty('--d', (rang % 4) * 0.09 + 's');
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

  if (calme) return;   // rien de ce qui suit ne tourne en mode « moins de mouvement »

  /* ══ 4. Pointeur : curseur, lampe torche, inclinaison, aimants, vignette flottante ══ */
  var px = window.innerWidth / 2, py = window.innerHeight / 2;   // position réelle du pointeur
  var aBouge = false;

  var curseur = null, cx = px, cy = py;
  if (souris) {
    curseur = creer('curseur', '<span></span>');
    var etiquette = curseur.firstChild;
    document.addEventListener('pointerover', function (e) {
      var el = e.target.closest ? e.target.closest('[data-curseur], a, button') : null;
      var mot = el && el.getAttribute('data-curseur');
      curseur.classList.toggle('mot', !!mot);
      curseur.classList.toggle('lien', !!el && !mot);
      etiquette.textContent = mot || '';
    });
    racine.addEventListener('pointerleave', function () { curseur.classList.remove('visible'); });
  }
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    px = e.clientX; py = e.clientY;
    if (!aBouge) { aBouge = true; cx = px; cy = py; }
    if (curseur) curseur.classList.add('visible');
  }, { passive: true });

  // Lampe torche sur le mur d'affiches de l'accueil
  var torches = tous('.accueil-tete').map(function (tete) {
    var voile = tete.querySelector('.mur-voile');
    if (!voile) return null;
    var t = { tete: tete, voile: voile, x: 0, y: 0, dedans: false, init: false };
    tete.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') t.dedans = true; });
    tete.addEventListener('pointerleave', function () { t.dedans = false; });
    return t;
  }).filter(Boolean);

  // Inclinaison 3D des affiches de projet
  var inclines = tous('[data-incline]').map(function (el) {
    var o = { el: el, rx: 0, ry: 0, vx: 0, vy: 0 };
    el.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = el.getBoundingClientRect();
      o.vy = ((e.clientX - r.left) / r.width - 0.5) * 16;
      o.vx = ((e.clientY - r.top) / r.height - 0.5) * -12;
    });
    el.addEventListener('pointerleave', function () { o.vx = 0; o.vy = 0; });
    return o;
  });

  // Éléments aimantés
  var aimants = tous('[data-aimant]').map(function (el) {
    var o = { el: el, x: 0, y: 0, vx: 0, vy: 0 };
    el.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = el.getBoundingClientRect();
      o.vx = (e.clientX - (r.left - o.x + r.width / 2)) * 0.4;
      o.vy = (e.clientY - (r.top - o.y + r.height / 2)) * 0.4;
    });
    el.addEventListener('pointerleave', function () { o.vx = 0; o.vy = 0; });
    return o;
  });

  // Vignette qui suit le pointeur sur la liste des montages
  var flotteur = null, fx = px, fy = py;
  var lignes = tous('.ligne-video[data-vignette]');
  if (souris && lignes.length) {
    flotteur = creer('flotteur', '<img alt="">');
    var imageFlottante = flotteur.firstChild;
    lignes.forEach(function (ligne) {
      ligne.addEventListener('pointerenter', function () {
        var src = ligne.getAttribute('data-vignette');
        if (!src) return;
        if (imageFlottante.getAttribute('src') !== src) imageFlottante.src = src;
        fx = px; fy = py;
        flotteur.classList.add('actif');
      });
      ligne.addEventListener('pointerleave', function () { flotteur.classList.remove('actif'); });
    });
  }

  /* ══ 5. Éléments pilotés par le défilement ══ */
  var barres = tous('.barre-fixe');
  var dernierY = window.scrollY;
  var vitesse = 0;

  var piliers = tous('.pilier').map(function (pilier) {
    return {
      el: pilier,
      panneaux: tous('.panneau', pilier).map(function (p) {
        return { el: p, mot: p.querySelector('.panneau-mot'), interieur: p.querySelector('.panneau-int') };
      })
    };
  });

  var defiles = tous('.defile').map(function (section) {
    return { section: section, piste: section.querySelector('.defile-piste'), jauge: section.querySelector('.defile-jauge span'), distance: 0 };
  });
  function mesurer() {
    defiles.forEach(function (d) {
      var actif = large.matches;
      d.section.classList.toggle('est-epingle', actif);
      d.piste.style.transform = '';
      d.section.style.height = '';
      d.distance = 0;
      if (!actif) return;
      d.distance = Math.max(0, d.piste.scrollWidth - window.innerWidth);
      d.section.style.height = 'calc(100vh + ' + d.distance + 'px)';
    });
  }

  var flottants = tous('[data-px]').map(function (el) {
    return { el: el, force: parseFloat(el.getAttribute('data-px')) || 0, y: 0 };
  });

  /* ══ 6. Boucle d'animation ══ */
  function image(temps) {
    var y = window.scrollY;
    var vh = window.innerHeight;
    var vw = window.innerWidth;
    vitesse += ((y - dernierY) - vitesse) * 0.18;
    if (Math.abs(vitesse) < 0.01) vitesse = 0;

    // Barre de navigation
    barres.forEach(function (b) {
      b.classList.toggle('est-fond', y > 40);
      if (y !== dernierY) b.classList.toggle('est-cachee', y > 320 && y > dernierY);
    });
    dernierY = y;

    // Curseur
    if (curseur) {
      cx += (px - cx) * 0.22; cy += (py - cy) * 0.22;
      curseur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
    }
    if (flotteur) {
      fx += (px - fx) * 0.12; fy += (py - fy) * 0.12;
      flotteur.style.transform = 'translate3d(' + (fx + 28).toFixed(1) + 'px,' + (fy - flotteur.offsetHeight / 2).toFixed(1) + 'px,0)';
    }

    // Lampe torche : suit la souris, sinon se promène toute seule
    torches.forEach(function (t) {
      var r = t.tete.getBoundingClientRect();
      if (r.bottom < 0 || r.width === 0) return;
      var vx, vy;
      if (t.dedans && aBouge) {
        vx = px - r.left; vy = py - r.top;
      } else {
        vx = r.width * (0.56 + 0.3 * Math.cos(temps * 0.00042));
        vy = r.height * (0.4 + 0.2 * Math.sin(temps * 0.00067));
      }
      if (!t.init) { t.x = vx; t.y = vy; t.init = true; }
      t.x += (vx - t.x) * 0.09; t.y += (vy - t.y) * 0.09;
      t.voile.style.setProperty('--x', t.x.toFixed(1) + 'px');
      t.voile.style.setProperty('--y', t.y.toFixed(1) + 'px');
    });

    // Inclinaisons et aimants
    inclines.forEach(function (o) {
      o.rx += (o.vx - o.rx) * 0.1; o.ry += (o.vy - o.ry) * 0.1;
      o.el.style.transform = 'perspective(900px) rotateX(' + o.rx.toFixed(2) + 'deg) rotateY(' + o.ry.toFixed(2) + 'deg)';
    });
    aimants.forEach(function (o) {
      o.x += (o.vx - o.x) * 0.14; o.y += (o.vy - o.y) * 0.14;
      o.el.style.transform = 'translate3d(' + o.x.toFixed(1) + 'px,' + o.y.toFixed(1) + 'px,0)';
    });

    // Phrase qui s'allume
    phrases.forEach(function (p) {
      var r = p.el.getBoundingClientRect();
      if (r.height === 0) return;
      var avance = borne((vh * 0.82 - r.top) / (r.height + vh * 0.38), 0, 1);
      var n = Math.round(avance * p.mots.length);
      if (n === p.allumes) return;
      p.allumes = n;
      p.mots.forEach(function (m, i) { m.classList.toggle('allume', i < n); });
    });

    // Panneaux de projets : le mot géant glisse, le panneau recouvert recule
    piliers.forEach(function (pilier) {
      var r = pilier.el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      pilier.panneaux.forEach(function (p, i) {
        if (p.mot) p.mot.style.transform = 'translate3d(' + (r.top * 0.32 + i * vh * 0.42 + vw * 0.06).toFixed(1) + 'px,0,0)';
        var suivant = pilier.panneaux[i + 1];
        if (!suivant || !p.interieur) return;
        var c = borne(1 - suivant.el.getBoundingClientRect().top / vh, 0, 1);
        p.interieur.style.transform = 'scale(' + (1 - 0.07 * c).toFixed(4) + ')';
        p.interieur.style.opacity = (1 - 0.8 * c).toFixed(3);
      });
    });

    // Piste horizontale, penchée selon la vitesse de défilement
    defiles.forEach(function (d) {
      if (!d.distance) return;
      var r = d.section.getBoundingClientRect();
      var course = r.height - vh;
      var p = course > 0 ? borne(-r.top / course, 0, 1) : 0;
      d.piste.style.transform = 'translate3d(' + (-p * d.distance).toFixed(1) + 'px,0,0) skewX(' + borne(vitesse * -0.07, -5, 5).toFixed(2) + 'deg)';
      if (d.jauge) d.jauge.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    });

    // Parallaxe
    var actif = large.matches;
    flottants.forEach(function (f) {
      if (!actif) { if (f.y) { f.el.style.transform = ''; f.y = 0; } return; }
      var r = f.el.getBoundingClientRect();
      if (r.height === 0 || r.bottom < -300 || r.top > vh + 300) return;
      var centre = r.top - f.y + r.height / 2;
      f.y = (centre - vh / 2) * -f.force;
      f.el.style.transform = 'translate3d(0,' + f.y.toFixed(1) + 'px,0)';
    });

    window.requestAnimationFrame(image);
  }

  window.addEventListener('resize', mesurer);
  window.addEventListener('load', mesurer);
  if (large.addEventListener) large.addEventListener('change', mesurer);
  mesurer();
  window.requestAnimationFrame(image);
})();
