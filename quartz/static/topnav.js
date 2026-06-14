(function () {
  var BASE = '/erodas-atlas';

  var NAV_HTML = [
    '<nav id="enc-topnav">',
    '  <div class="enc-nav-inner">',
    '    <a href="' + BASE + '/" class="enc-nav-brand">Erodian Encyclopedia</a>',
    '    <div class="enc-nav-sep"></div>',
    '    <ul class="enc-nav-list" id="enc-nav-list">',

    '      <li class="enc-has-dd">',
    '        <button class="enc-nav-btn" aria-haspopup="true">',
    '          Continents',
    '          <span class="enc-nav-arrow">&#9660;</span>',
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
    '          Lore',
    '          <span class="enc-nav-arrow">&#9660;</span>',
    '        </button>',
    '        <ul class="enc-nav-dd">',
    '          <li><a href="' + BASE + '/gods-and-higher-powers">Gods &amp; Higher Powers</a></li>',
    '          <li><a href="' + BASE + '/factions">Factions</a></li>',
    '          <li><a href="' + BASE + '/species">Species</a></li>',
    '        </ul>',
    '      </li>',

    '      <li class="enc-has-dd">',
    '        <button class="enc-nav-btn" aria-haspopup="true">',
    '          History',
    '          <span class="enc-nav-arrow">&#9660;</span>',
    '        </button>',
    '        <ul class="enc-nav-dd">',
    '          <li><a href="' + BASE + '/history">Timelines &amp; Events</a></li>',
    '          <li><a href="' + BASE + '/planes">Planes</a></li>',
    '          <li><a href="' + BASE + '/celestial-bodies">Celestial Bodies</a></li>',
    '        </ul>',
    '      </li>',

    '      <li><a href="' + BASE + '/static/map/" class="enc-nav-link" data-router-ignore>Map</a></li>',
    '      <li><a href="' + BASE + '/static/calendar/" class="enc-nav-link" data-router-ignore>Calendar</a></li>',
    '      <li><a href="' + BASE + '/static/vote/" class="enc-nav-link" data-router-ignore>Vote</a></li>',

    '    </ul>',
    '    <button class="enc-nav-ham" id="enc-nav-ham" aria-label="Toggle navigation">',
    '      <span></span><span></span><span></span>',
    '    </button>',
    '  </div>',
    '</nav>',
  ].join('\n');

  function insertNav() {
    if (document.getElementById('enc-topnav')) return;
    var wrapper = document.createElement('div');
    wrapper.innerHTML = NAV_HTML;
    var nav = wrapper.firstElementChild;
    document.body.insertBefore(nav, document.body.firstChild);
    wireUp();
  }

  function wireUp() {
    // Hamburger toggle
    var ham = document.getElementById('enc-nav-ham');
    var list = document.getElementById('enc-nav-list');
    if (ham && list) {
      ham.addEventListener('click', function () {
        ham.classList.toggle('open');
        list.classList.toggle('open');
      });
    }

    // Mobile: tap on dropdown buttons expands them
    document.querySelectorAll('.enc-has-dd .enc-nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          var li = btn.closest('li');
          li.classList.toggle('dd-open');
        }
      });
    });

    updateActive();
  }

  function updateActive() {
    var path = window.location.pathname;
    document.querySelectorAll('#enc-topnav a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href) return;
      // Exact match for brand/home; prefix match for others
      var isHome = href === BASE + '/' || href === BASE;
      var isActive = isHome
        ? path === href || path === BASE + '/'
        : path.startsWith(href);
      a.classList.toggle('active', isActive);
    });
  }

  // Initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertNav);
  } else {
    insertNav();
  }

  // Quartz SPA navigation event
  document.addEventListener('nav', updateActive);
})();
