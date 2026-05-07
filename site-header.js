// site-header.js
// MCBattle.jp shared header / navigation

(function () {
  function getBasePrefix() {
    const path = window.location.pathname || "";

    if (
      path.includes("/detail_mc/") ||
      path.includes("/detail_event/")
    ) {
      return "../";
    }

    return "./";
  }

  function getCurrentSection() {
    const file = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    const path = window.location.pathname.toLowerCase();

    if (
      file === "list_mc.html" ||
      file === "list_event.html" ||
      path.includes("/detail_mc/") ||
      path.includes("/detail_event/")
    ) {
      return "data";
    }

    if (
      file === "score_ranking.html" ||
      file === "prize_ranking.html" ||
      file === "score_spec.html"
    ) {
      return "ranking";
    }

    if (file === "simulation.html") {
      return "simulator";
    }

    if (file === "articles.html" || file.startsWith("article")) {
      return "reading";
    }

    return "";
  }

  function closeOtherMenus(currentMenu) {
    document.querySelectorAll(".home-menu[open]").forEach(function (menu) {
      if (menu !== currentMenu) {
        menu.removeAttribute("open");
      }
    });
  }

  function closeMenusOnOutsideClick(event) {
    if (!event.target.closest(".home-menu")) {
      document.querySelectorAll(".home-menu[open]").forEach(function (menu) {
        menu.removeAttribute("open");
      });
    }
  }

  function createHeader() {
    const base = getBasePrefix();
    const current = getCurrentSection();

    return `
      <header class="home-header">
        <div class="home-header-inner">
          <h1 class="home-logo">
            <a href="${base}">MCBattle.jp</a>
          </h1>

          <p class="home-lead">
            日本一情報量の多いMCバトルポータル。<br>
            大会記録・戦績・独自スコアをまとめています。
          </p>

          <nav class="home-tabs" aria-label="主要メニュー">

            <details class="home-menu ${current === "data" ? "is-current" : ""}" data-menu="data">
              <summary class="home-menu-summary">Data</summary>

              <div class="home-submenu">
                <a href="${base}list_mc.html">MC一覧</a>
                <a href="${base}list_event.html">大会一覧</a>
              </div>
            </details>

            <details class="home-menu ${current === "ranking" ? "is-current" : ""}" data-menu="ranking">
              <summary class="home-menu-summary">Ranking</summary>

              <div class="home-submenu">
                <a href="${base}score_ranking.html">スコアランキング</a>
                <a href="${base}prize_ranking.html">賞金ランキング</a>
                <a href="${base}score_spec.html">スコアリング仕様</a>
              </div>
            </details>

            <a
              class="home-tab ${current === "simulator" ? "is-current" : ""}"
              href="${base}simulation.html"
            >
              Simulator
            </a>

            <a
              class="home-tab ${current === "reading" ? "is-current" : ""}"
              href="${base}articles.html"
            >
              Reading
            </a>

          </nav>
        </div>
      </header>
    `;
  }

  function mountHeader() {
    const mount = document.getElementById("site-header");
    if (!mount) return;

    mount.innerHTML = createHeader();

    document.querySelectorAll(".home-menu").forEach(function (menu) {
      menu.addEventListener("toggle", function () {
        if (menu.open) {
          closeOtherMenus(menu);
        }
      });
    });

    document.addEventListener("click", closeMenusOnOutsideClick);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountHeader);
  } else {
    mountHeader();
  }
})();
