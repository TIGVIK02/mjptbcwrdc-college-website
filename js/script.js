(function () {
  "use strict";

  const pageBase = window.location.pathname.includes("/pages/") ? "../" : "";
  const fallbackConfig = {
    officialName: "Mahatma Jyothiba Phule Telangana Backward Classes Welfare Residential Degree College for Women",
    shortName: "MJPTBCWRDC(W)",
    headerLine1: "Mahatma Jyothiba Phule",
    headerLine2: "Telangana Backward Classes",
    headerLine3: "Welfare Residential Degree College for Women",
    location: "Station Ghanpur · Women",
    address: "Station Ghanpur, Pembarthy, Jangaon, Telangana 506201",
    affiliation: "Kakatiya University",
    society: "MJPTBCWREIS",
    secretary: "B. Saidulu, IFS",
    officeAddress: "Masab Tank, Hyderabad",
    principal: "Dr. K. Bhagyalaxmi",
    phone: "+91 7032765139",
    email: "mjptbcwrdcstationghanpurwomen@gmail.com",
    officeHours: "8:00 a.m. to 4:30 p.m.",
    copyrightText: "MJPTBCWRDC(W), Station Ghanpur"
  };
  let siteConfig = fallbackConfig;
  let ready = false;
  let navigationInitializedFor = null;
  let backToTopInitialized = false;
  const readyCallbacks = [];
  const parseKeyValueBlocks = function (text) {
    const records = [];
    let currentRecord = null;
    let currentKey = null;

    const finalizeCurrentRecord = function () {
      if (currentRecord && Object.keys(currentRecord).length) {
        records.push(currentRecord);
      }
      currentRecord = null;
      currentKey = null;
    };

    text.split(/\r?\n/).forEach(function (line) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const separator = trimmed.indexOf("=");
      if (separator > 0) {
        const key = trimmed.slice(0, separator).trim();
        const value = trimmed.slice(separator + 1).trim();
        const upperKey = key.toUpperCase();

        if (currentRecord && (upperKey === "ROLE" || upperKey === "YEAR") && (currentRecord[upperKey] || currentRecord[key] || "")) {
          const previousValue = String(currentRecord[upperKey] || currentRecord[key] || "").trim();
          if (previousValue && previousValue !== value) {
            finalizeCurrentRecord();
          }
        }

        if (!currentRecord) currentRecord = {};
        currentKey = key;
        currentRecord[key] = value;
        return;
      }

      if (currentRecord && currentKey) {
        currentRecord[currentKey] = (currentRecord[currentKey] ? currentRecord[currentKey] + "\n" : "") + trimmed;
      }
    });

    finalizeCurrentRecord();
    return records.filter(function (record) { return Object.keys(record).length; });
  };
  const parseConfig = function (text) {
    const config = {};
    text.split(/\r?\n/).forEach(function (line) { const separator = line.indexOf("="); if (separator > 0 && !line.trim().startsWith("#")) config[line.slice(0, separator).trim()] = line.slice(separator + 1).trim(); });
    return Object.assign({}, fallbackConfig, config);
  };
  const loadingIndicator = document.createElement("div");
  loadingIndicator.className = "site-loader";
  loadingIndicator.setAttribute("role", "status");
  loadingIndicator.setAttribute("aria-label", "Loading college website");
  loadingIndicator.innerHTML = '<img src="' + pageBase + 'assets/images/logo/logo.png" alt=""><span>Loading college website</span>';
  document.body.appendChild(loadingIndicator);

  const loadData = function (path, type) {
    return fetch(pageBase + path).then(function (response) { if (!response.ok) throw new Error("Data unavailable: " + path); return type === "json" ? response.json() : response.text(); });
  };
  const ensureSharedMounts = function () {
    let headerMount = document.getElementById("site-header");
    let footerMount = document.getElementById("site-footer");
    const oldTopbar = document.querySelector("body > .topbar");
    const oldHeader = document.querySelector("body > .site-header");
    const oldFooter = document.querySelector("body > .site-footer");
    if (!headerMount) { headerMount = document.createElement("div"); headerMount.id = "site-header"; (oldTopbar || oldHeader || document.querySelector("main")).before(headerMount); }
    if (!footerMount) { footerMount = document.createElement("div"); footerMount.id = "site-footer"; (oldFooter || document.querySelector("script[src*='script.js']")).before(footerMount); }
    if (oldTopbar) oldTopbar.remove();
    if (oldHeader) oldHeader.remove();
    if (oldFooter) oldFooter.remove();
  };
  const loadComponent = function (id, file) {
    const mount = document.getElementById(id);
    if (!mount) return Promise.resolve();
    return fetch(pageBase + "components/" + file).then(function (response) { if (!response.ok) throw new Error("Component unavailable"); return response.text(); }).then(function (html) { mount.innerHTML = html.replaceAll("__BASE__", pageBase); });
  };
  const applySiteConfig = function () {
    document.querySelectorAll("[data-config-text]").forEach(function (element) { const value = siteConfig[element.getAttribute("data-config-text")]; if (value) element.textContent = value; });
    document.querySelectorAll("[data-config-href]").forEach(function (element) { const key = element.getAttribute("data-config-href"); const value = siteConfig[key]; if (value) element.href = key === "email" ? "mailto:" + value : "tel:" + value.replace(/\s+/g, ""); });
    const description = document.querySelector('meta[name="description"]'); if (description && siteConfig.officialName) description.content = siteConfig.officialName + ", " + siteConfig.location + " — affiliated to " + siteConfig.affiliation + ".";
    const titleLabel = document.title.split("·")[0].trim(); const isHomepage = window.location.pathname.endsWith("/index.html") || window.location.pathname.endsWith("/"); document.title = isHomepage ? siteConfig.officialName + " · " + siteConfig.location.split(" · ")[0] : titleLabel + " · " + siteConfig.shortName;
  };
  const addBreadcrumbs = function () {
    const pageHero = document.querySelector(".page-hero .container");
    if (!pageHero) return;
    const heading = pageHero.querySelector("h2");
    const breadcrumb = document.createElement("nav"); breadcrumb.className = "breadcrumbs"; breadcrumb.setAttribute("aria-label", "Breadcrumb");
    const pageName = heading ? heading.textContent.trim().toUpperCase() : "PAGE";
    const isDedicatedStudentPage = /\/pages\/(student-support|attendance-code-of-conduct|student-educational-verification|student-achievements|student-placements|our-services|clubs|cells|committees|centre-for-excellence|magazine|grievance-cell|magazine-newsletter)\.html$/.test(window.location.pathname);
    const studentZoneCrumb = isDedicatedStudentPage ? '<a href="' + pageBase + 'pages/student-zone.html">STUDENT ZONE</a><span aria-hidden="true">&gt;</span>' : "";
    breadcrumb.innerHTML = '<a href="' + pageBase + 'index.html">HOME</a><span aria-hidden="true">&gt;</span>' + studentZoneCrumb + '<span>' + pageName + "</span>";
    pageHero.insertBefore(breadcrumb, pageHero.firstChild);
  };
  const initializeNavigation = function () {
    const toggle = document.querySelector(".nav-toggle"); const nav = document.querySelector(".main-nav"); const close = document.querySelector(".nav-close"); const firstLink = document.querySelector(".nav-major-link");
    if (!toggle || !nav || navigationInitializedFor === nav) return;
    navigationInitializedFor = nav;
    let lastFocused = toggle;
    const closeDropdowns = function () { nav.querySelectorAll(".nav-group-toggle").forEach(function (item) { item.setAttribute("aria-expanded", "false"); }); nav.querySelectorAll(".nav-submenu").forEach(function (item) { item.hidden = true; }); };
    const setBackgroundInert = function (inert) { document.querySelectorAll("body > main, body > #site-footer").forEach(function (element) { element.inert = inert; }); };
    const setMenu = function (open) { nav.classList.toggle("open", open); document.body.classList.toggle("menu-open", open); toggle.setAttribute("aria-expanded", String(open)); toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation"); nav.setAttribute("aria-hidden", String(!open)); setBackgroundInert(open); if (!open) closeDropdowns(); if (open) { lastFocused = document.activeElement; if (firstLink) firstLink.focus(); } if (!open && lastFocused) lastFocused.focus(); };
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    if (close) close.addEventListener("click", function () { setMenu(false); });
    nav.addEventListener("click", function (event) { if (event.target === nav) setMenu(false); });
    document.addEventListener("click", function (event) { if (nav.classList.contains("open") && !nav.contains(event.target) && !toggle.contains(event.target)) setMenu(false); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("open")) { setMenu(false); return; }
      if (event.key === "Tab" && nav.classList.contains("open")) { const focusable = Array.from(nav.querySelectorAll("button, a")).filter(function (item) { return !item.hasAttribute("disabled") && !item.closest("[hidden]") && item.offsetParent !== null; }); if (!focusable.length) return; const first = focusable[0]; const last = focusable[focusable.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
    });
    nav.querySelectorAll("a").forEach(function (link) { link.addEventListener("click", function (event) { if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; const destination = new URL(link.href, window.location.href); if (destination.origin !== window.location.origin) return; event.preventDefault(); document.body.classList.add("page-leaving"); window.setTimeout(function () { window.location.href = link.href; }, 130); }); });
    nav.querySelectorAll(".nav-group-toggle").forEach(function (button) { const submenu = document.getElementById(button.getAttribute("aria-controls")); button.addEventListener("click", function () { const expanded = button.getAttribute("aria-expanded") === "true"; nav.querySelectorAll(".nav-group-toggle").forEach(function (item) { item.setAttribute("aria-expanded", "false"); }); nav.querySelectorAll(".nav-submenu").forEach(function (item) { item.hidden = true; }); button.setAttribute("aria-expanded", String(!expanded)); submenu.hidden = expanded; }); button.addEventListener("keydown", function (event) { if (event.key === "ArrowDown" && button.getAttribute("aria-expanded") === "true") { const firstSubmenuLink = submenu.querySelector("a"); if (firstSubmenuLink) { event.preventDefault(); firstSubmenuLink.focus(); } } }); });
    document.querySelectorAll(".main-nav a").forEach(function (link) { const linkPath = new URL(link.href).pathname.replace(/\/$/, ""); const currentPath = window.location.pathname.replace(/\/$/, ""); if (linkPath === currentPath || (linkPath.endsWith("/index.html") && currentPath.endsWith("/"))) { link.classList.add("active"); link.setAttribute("aria-current", "page"); const group = link.closest(".nav-group"); const groupToggle = group && group.querySelector(".nav-group-toggle"); if (groupToggle) groupToggle.classList.add("active"); } });
  };
  const initializeSearch = function () {
    const toggle = document.querySelector(".search-toggle"); const panel = document.getElementById("site-search"); const form = panel && panel.querySelector(".site-search"); const input = form && form.querySelector("input"); if (!toggle || !panel || !form || !input) return;
    const closeSearch = function () { panel.hidden = true; toggle.setAttribute("aria-expanded", "false"); };
    const openSearch = function () { panel.hidden = false; toggle.setAttribute("aria-expanded", "true"); window.setTimeout(function () { input.focus(); }, 40); };
    toggle.addEventListener("click", function () { if (panel.hidden) openSearch(); else closeSearch(); });
    document.addEventListener("click", function (event) { if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) closeSearch(); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !panel.hidden) closeSearch(); });
    const destinations = [
      { label: "home", href: pageBase + "index.html" }, { label: "about", href: pageBase + "pages/vision-and-mission.html" }, { label: "principal", href: pageBase + "pages/principal.html" },
      { label: "academics", href: pageBase + "pages/academics.html" }, { label: "departments", href: pageBase + "pages/departments.html" }, { label: "courses", href: pageBase + "pages/academics.html" },
      { label: "admissions", href: pageBase + "pages/admissions.html" }, { label: "timetable", href: pageBase + "pages/timetable.html" }, { label: "syllabus", href: pageBase + "pages/syllabi.html" },
      { label: "facilities", href: pageBase + "pages/facilities.html" }, { label: "infrastructure", href: pageBase + "pages/infrastructure.html" },
      { label: "student zone", href: pageBase + "pages/student-zone.html" }, { label: "achievements", href: pageBase + "pages/student-achievements.html" }, { label: "placements", href: pageBase + "pages/student-placements.html" },
      { label: "cells", href: pageBase + "pages/cells.html" }, { label: "committees", href: pageBase + "pages/committees.html" }, { label: "magazine", href: pageBase + "pages/magazine.html" },
      { label: "results", href: pageBase + "pages/result-analysis.html" }, { label: "question papers", href: pageBase + "pages/previous-year-question-papers.html" }, { label: "notices", href: pageBase + "pages/notices.html" },
      { label: "gallery", href: pageBase + "pages/gallery.html" }, { label: "downloads", href: pageBase + "pages/downloads.html" }, { label: "contact", href: pageBase + "pages/contact.html" }, { label: "nss", href: pageBase + "pages/nss.html" }
    ];
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const query = input.value.trim().toLowerCase();
      if (!query) { input.focus(); return; }
      const match = destinations.find(function (entry) { return entry.label.includes(query) || query.includes(entry.label); });
      if (match) {
        window.location.href = match.href;
        return;
      }
      window.location.href = pageBase + "pages/notices.html";
    });
  };
  const initializeBackToTop = function () { if (backToTopInitialized) return; backToTopInitialized = true; const backTop = document.querySelector(".back-to-top") || document.createElement("button"); backTop.className = "back-to-top"; backTop.type = "button"; backTop.setAttribute("aria-label", "Back to top"); backTop.innerHTML = "<span aria-hidden=\"true\">↑</span>"; if (!backTop.parentElement) document.body.appendChild(backTop); const update = function () { backTop.classList.toggle("is-visible", window.scrollY > 420); }; window.addEventListener("scroll", update, { passive: true }); backTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }); update(); };
  const notifyReady = function () { ready = true; window.dispatchEvent(new CustomEvent("site:ready")); readyCallbacks.splice(0).forEach(function (callback) { try { callback(); } catch (error) { console.error("Page initialization failed.", error); } }); };

  window.Site = { pageBase: pageBase, config: function () { return siteConfig; }, loadData: loadData, parseKeyValueBlocks: parseKeyValueBlocks, onReady: function (callback) { if (ready) callback(); else readyCallbacks.push(callback); } };
  ensureSharedMounts();
  const configReady = loadData("data/site-config.txt", "text").then(function (text) { siteConfig = parseConfig(text); }).catch(function () { console.warn("Using built-in site configuration fallback."); });
  const headerReady = loadComponent("site-header", "header.html");
  loadComponent("site-footer", "footer.html").catch(function () { console.warn("Footer component unavailable."); });
  Promise.all([configReady, headerReady]).then(function () {
    applySiteConfig(); addBreadcrumbs(); const year = document.getElementById("year"); if (year) year.textContent = new Date().getFullYear(); initializeNavigation(); initializeSearch(); initializeBackToTop(); document.body.classList.add("page-ready"); loadingIndicator.classList.add("is-hidden"); window.setTimeout(function () { loadingIndicator.remove(); }, 220); notifyReady();
  }).catch(function () { applySiteConfig(); initializeNavigation(); initializeSearch(); initializeBackToTop(); notifyReady(); });
})();
