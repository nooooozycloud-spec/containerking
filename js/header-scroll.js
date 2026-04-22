(function () {
  var header = document.querySelector(".site-header");
  var hero = document.querySelector(".hero");
  var logoLink = header ? header.querySelector(".site-header__row > .logo") : null;

  function hasLpSections() {
    return !!document.getElementById("features");
  }
  var navToggle = document.getElementById("nav-toggle");
  var railNavLinks = header
    ? header.querySelectorAll(
        ".site-header__rail .nav-desktop a[href^='#'], .nav-drawer .nav-scroll__inner a[href^='#']"
      )
    : null;

  /* 境界付近でクラスが切り替わり続けないようヒステリシス */
  var SCROLL_HEADER_ON = 48;
  var SCROLL_HEADER_OFF = 10;

  var SPY_SECTION_IDS = [
    "features",
    "new-products",
    "pricing",
    "cases",
    "custom",
    "flow",
    "contact",
  ];

  var spyMq = window.matchMedia("(min-width: 1201px)");
  var spyRaf = 0;
  /* スムーズスクロール中は中間セクションが順次アクティブ化されないよう、ターゲット ID を固定する */
  var spyLockedTargetId = null;
  var spyUnlockTimer = 0;
  var spyUnlockFallback = 0;

  /* MV（.hero）下端が画面上端を通過したらロゴ表示（戻すときはヒステリシス） */
  var LOGO_SHOW_HERO_BOTTOM = 4;
  var LOGO_HIDE_HERO_BOTTOM = 72;

  function updateLogoAfterHero() {
    if (!header) return;
    /* LP 以外（施工事例サブページ等）：ヒーローが無いのでロゴは常に表示 */
    if (!hero) {
      header.classList.add("site-header--logo-visible");
      if (logoLink) logoLink.removeAttribute("aria-hidden");
      return;
    }
    /* 1200px 以下はロゴ常時表示（CSS と併用） */
    if (!spyMq.matches) {
      header.classList.add("site-header--logo-visible");
      if (logoLink) logoLink.removeAttribute("aria-hidden");
      return;
    }
    var bottom = hero.getBoundingClientRect().bottom;
    var show = header.classList.contains("site-header--logo-visible");
    if (!show && bottom <= LOGO_SHOW_HERO_BOTTOM) {
      header.classList.add("site-header--logo-visible");
      if (logoLink) logoLink.removeAttribute("aria-hidden");
    } else if (show && bottom > LOGO_HIDE_HERO_BOTTOM) {
      header.classList.remove("site-header--logo-visible");
      if (logoLink) logoLink.setAttribute("aria-hidden", "true");
    }
  }

  function updateHeaderScrolled() {
    if (!header) return;
    var y = window.scrollY || window.pageYOffset || 0;
    if (header.classList.contains("site-header--scrolled")) {
      if (y <= SCROLL_HEADER_OFF) {
        header.classList.remove("site-header--scrolled");
      }
    } else {
      if (y >= SCROLL_HEADER_ON) {
        header.classList.add("site-header--scrolled");
      }
    }
  }

  function clearRailActive() {
    if (!railNavLinks) return;
    railNavLinks.forEach(function (a) {
      a.classList.remove("is-active");
      a.removeAttribute("aria-current");
    });
  }

  function setRailActive(id) {
    if (!railNavLinks) return;
    var firstCurrent = true;
    railNavLinks.forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var match = href === "#" + id;
      a.classList.toggle("is-active", match);
      if (match) {
        if (firstCurrent) {
          a.setAttribute("aria-current", "location");
          firstCurrent = false;
        } else {
          a.removeAttribute("aria-current");
        }
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  /**
   * スクロール位置ベースのスクロールスパイ
   * （IntersectionObserver はセクション高さ・rootMargin 次第で「価格表」等が反応しないことがあるため）
   */
  function computeActiveSectionId() {
    var y = window.scrollY || window.pageYOffset || 0;
    /* ビューポート上端付近を基準に、どのセクションにいるか判定（--scroll-anchor-offset に近い） */
    var probe = y + Math.min(200, Math.max(88, window.innerHeight * 0.2));
    var activeId = null;
    for (var i = 0; i < SPY_SECTION_IDS.length; i++) {
      var id = SPY_SECTION_IDS[i];
      var el = document.getElementById(id);
      if (!el) continue;
      var rect = el.getBoundingClientRect();
      var top = rect.top + y;
      if (top <= probe) {
        activeId = id;
      }
    }
    return activeId;
  }

  function updateScrollSpy() {
    if (!hasLpSections()) {
      clearRailActive();
      return;
    }
    if (!railNavLinks || railNavLinks.length === 0) return;
    /* ロック中はターゲット ID に固定（スムーズスクロール中の中間「なぞり」発生を抑止） */
    if (spyLockedTargetId) {
      setRailActive(spyLockedTargetId);
      return;
    }
    var y = window.scrollY || window.pageYOffset || 0;
    if (y < 72) {
      clearRailActive();
      return;
    }
    var id = computeActiveSectionId();
    if (id) {
      setRailActive(id);
    }
  }

  function lockSpyTo(id) {
    spyLockedTargetId = id;
    setRailActive(id);
    if (spyUnlockFallback) clearTimeout(spyUnlockFallback);
    /* 万一スクロールが発火しない／途中で止まったケースのための最終解除 */
    spyUnlockFallback = window.setTimeout(function () {
      spyUnlockFallback = 0;
      unlockSpy();
    }, 1500);
  }

  function unlockSpy() {
    if (!spyLockedTargetId) return;
    spyLockedTargetId = null;
    if (spyUnlockTimer) {
      clearTimeout(spyUnlockTimer);
      spyUnlockTimer = 0;
    }
    if (spyUnlockFallback) {
      clearTimeout(spyUnlockFallback);
      spyUnlockFallback = 0;
    }
    updateScrollSpy();
  }

  function scheduleSpyUnlock() {
    /* スクロールが 120ms 止まったらロック解除（＝スクロール終了とみなす） */
    if (spyUnlockTimer) clearTimeout(spyUnlockTimer);
    spyUnlockTimer = window.setTimeout(function () {
      spyUnlockTimer = 0;
      unlockSpy();
    }, 120);
  }

  function scheduleScrollSpy() {
    if (spyRaf) return;
    spyRaf = window.requestAnimationFrame(function () {
      spyRaf = 0;
      updateScrollSpy();
    });
  }

  /** 同一ページ内アンカーのスムーズスクロール */
  function initSmoothAnchors() {
    var page = document.querySelector(".page");
    if (!page) return;

    page.addEventListener("click", function (e) {
      var a = e.target.closest("a[href^='#']");
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href === "#") return;
      var id = href.slice(1);
      var el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (navToggle) {
        navToggle.checked = false;
      }
      if (SPY_SECTION_IDS.indexOf(id) !== -1) {
        lockSpyTo(id);
      }
      try {
        history.pushState(null, "", href);
      } catch (err) {
        location.hash = href;
      }
    });
  }

  function onScroll() {
    updateHeaderScrolled();
    updateLogoAfterHero();
    scheduleScrollSpy();
    /* ロック中はスクロールが止まったタイミングで解除 */
    if (spyLockedTargetId) {
      scheduleSpyUnlock();
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    updateHeaderScrolled();
    updateLogoAfterHero();
    updateScrollSpy();
  });
  updateHeaderScrolled();
  updateLogoAfterHero();
  updateScrollSpy();
  initSmoothAnchors();

  if (logoLink && !header.classList.contains("site-header--logo-visible")) {
    logoLink.setAttribute("aria-hidden", "true");
  }

  spyMq.addEventListener("change", function () {
    updateScrollSpy();
    updateLogoAfterHero();
  });

  window.addEventListener("load", function () {
    updateLogoAfterHero();
    var raw = location.hash.replace(/^#/, "");
    if (!hasLpSections()) {
      return;
    }
    if (raw && SPY_SECTION_IDS.indexOf(raw) !== -1) {
      setRailActive(raw);
    } else {
      updateScrollSpy();
    }
  });
})();
