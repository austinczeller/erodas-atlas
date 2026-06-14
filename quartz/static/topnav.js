(function () {
  var BASE = '/erodas-atlas';
  var MUSIC_SRC = 'https://www.youtube.com/embed/HL8oQw0nm0M?autoplay=1&loop=1&playlist=HL8oQw0nm0M';

  var NAV_HTML = [
    '<nav id="enc-topnav">',
    '  <div class="enc-nav-inner">',
    '    <a href="' + BASE + '/" class="enc-nav-brand">Erodian Encyclopedia</a>',
    '    <div class="enc-nav-sep"></div>',
    '    <ul class="enc-nav-list" id="enc-nav-list">',

    '      <li class="enc-has-dd">',
    '        <button class="enc-nav-btn" aria-haspopup="true">',
    '          Continents <span class="enc-nav-arrow">&#9660;</span>',
    '        </button>',
    '        <ul class="enc-nav-dd">',
    '          <li><a href="' + BASE + '/world-(erodas)/korlornium">Korlornium</a></li>',
    '          <li><a href="' + BASE + '/world-(erodas)/dracofold">Dracofold</a></li>',
    '          <li><a href="' + BASE + '/world-(erodas)/goghdor">Goghdor</a></li>',
    '          <li><a href="' + BASE + '/world-(erodas)/seivara">Seivara</a></li>',
    '        </ul>',
    '      </li>',

    '      <li class="enc-has-dd">',
    '        <button class="enc-nav-btn" aria-haspopup="true">',
    '          Lore <span class="enc-nav-arrow">&#9660;</span>',
    '        </button>',
    '        <ul class="enc-nav-dd">',
    '          <li><a href="' + BASE + '/gods-and-higher-powers">Gods &amp; Higher Powers</a></li>',
    '          <li><a href="' + BASE + '/factions">Factions</a></li>',
    '          <li><a href="' + BASE + '/species">Species</a></li>',
    '        </ul>',
    '      </li>',

    '      <li class="enc-has-dd">',
    '        <button class="enc-nav-btn" aria-haspopup="true">',
    '          History <span class="enc-nav-arrow">&#9660;</span>',
    '        </button>',
    '        <ul class="enc-nav-dd">',
    '          <li><a href="' + BASE + '/history">Timelines &amp; Events</a></li>',
    '          <li><a href="' + BASE + '/planes">Planes</a></li>',
    '          <li><a href="' + BASE + '/celestial-bodies">Celestial Bodies</a></li>',
    '        </ul>',
    '      </li>',

    '      <li><a href="' + BASE + '/static/map/" class="enc-nav-link enc-static-link">Map</a></li>',
    '      <li><a href="' + BASE + '/static/calendar/" class="enc-nav-link enc-static-link">Calendar</a></li>',
    '      <li><a href="' + BASE + '/static/vote/" class="enc-nav-link enc-static-link">Vote</a></li>',

    '    </ul>',

    '    <button class="enc-nav-btn enc-music-btn" id="enc-music-btn" title="Toggle ambient music">&#9834;</button>',

    '    <button class="enc-nav-ham" id="enc-nav-ham" aria-label="Toggle navigation">',
    '      <span></span><span></span><span></span>',
    '    </button>',
    '  </div>',
    '</nav>',
  ].join('\n');

  // ── Music state (persists in module scope across re-inserts) ──
  var musicIframe = null;
  var musicPlaying = false;

  function toggleMusic() {
    var btn = document.getElementById('enc-music-btn');
    if (musicPlaying) {
      if (musicIframe && musicIframe.parentNode) {
        musicIframe.parentNode.removeChild(musicIframe);
      }
      musicIframe = null;
      musicPlaying = false;
      if (btn) { btn.innerHTML = '&#9834;'; btn.classList.remove('playing'); }
    } else {
      musicIframe = document.createElement('iframe');
      musicIframe.id = 'enc-music-iframe';
      musicIframe.src = MUSIC_SRC;
      musicIframe.allow = 'autoplay; encrypted-media';
      musicIframe.setAttribute('allowfullscreen', '');
      // Tiny but visible so Chrome doesn't block audio
      musicIframe.style.cssText = 'position:fixed;bottom:0;right:0;width:1px;height:1px;border:0;opacity:0.01;pointer-events:none;z-index:-1;';
      document.body.appendChild(musicIframe);
      musicPlaying = true;
      if (btn) { btn.innerHTML = '&#9835;'; btn.classList.add('playing'); }
    }
  }

  // ── Click interceptor: prevent SPA from hijacking static-page links ──
  document.addEventListener('click', function (e) {
    var link = e.target && e.target.closest
      ? e.target.closest('a.enc-static-link, a.map-card')
      : null;
    if (link) {
      // Stop SPA from seeing this click; let the browser follow the href normally
      e.stopImmediatePropagation();
    }
  }, true); // capture phase — runs before Quartz's SPA handler

  // ── Nav insertion ──
  function insertNav() {
    if (document.getElementById('enc-topnav')) {
      // Nav survived micromorph (shouldn't happen, but just in case)
      syncMusicBtn();
      return;
    }

    var wrapper = document.createElement('div');
    wrapper.innerHTML = NAV_HTML;
    var nav = wrapper.firstElementChild;
    document.body.insertBefore(nav, document.body.firstChild);
    wireUp();
  }

  function syncMusicBtn() {
    var btn = document.getElementById('enc-music-btn');
    if (!btn) return;
    btn.innerHTML = musicPlaying ? '&#9835;' : '&#9834;';
    if (musicPlaying) btn.classList.add('playing');
    else btn.classList.remove('playing');
  }

  function wireUp() {
    var ham = document.getElementById('enc-nav-ham');
    var list = document.getElementById('enc-nav-list');
    if (ham && list) {
      ham.addEventListener('click', function () {
        ham.classList.toggle('open');
        list.classList.toggle('open');
      });
    }

    // Mobile: tap dropdown buttons to expand
    document.querySelectorAll('.enc-has-dd .enc-nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.innerWidth <= 768) {
          var li = btn.closest('li');
          if (li) li.classList.toggle('dd-open');
        }
      });
    });

    // Music button
    var musicBtn = document.getElementById('enc-music-btn');
    if (musicBtn) {
      musicBtn.addEventListener('click', toggleMusic);
      syncMusicBtn();
    }

    updateActive();
  }

  function updateActive() {
    var path = window.location.pathname;
    document.querySelectorAll('#enc-topnav a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href) return;
      var norm = href.replace(/\/$/, '');
      var curNorm = path.replace(/\/$/, '');
      var isHome = norm === BASE || norm === '';
      var isActive = isHome
        ? curNorm === BASE || curNorm === ''
        : curNorm.startsWith(norm);
      a.classList.toggle('active', isActive);
    });
  }

  // ── Boot ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertNav);
  } else {
    insertNav();
  }

  // After every Quartz SPA navigation, micromorph has wiped the body.
  // Re-insert the nav and update active state.
  document.addEventListener('nav', function () {
    insertNav();
    // insertNav → wireUp → updateActive, so active state is always set.
  });
})();
