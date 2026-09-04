(function () {
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
    phone: "+91 7013310928",
    email: "mjptbcwrdcstationghanpurwomen@gmail.com",
    officeHours: "8:00 a.m. to 4:30 p.m.",
    copyrightText: "MJPTBCWRDC(W), Station Ghanpur"
  };
  const parseConfig = function (text) {
    const config = {};
    text.split(/\r?\n/).forEach(function (line) { const separator = line.indexOf("="); if (separator > 0 && !line.trim().startsWith("#")) config[line.slice(0, separator).trim()] = line.slice(separator + 1).trim(); });
    return Object.assign({}, fallbackConfig, config);
  };
  let siteConfig = fallbackConfig;
  const loadingIndicator = document.createElement("div");
  loadingIndicator.className = "site-loader";
  loadingIndicator.setAttribute("role", "status");
  loadingIndicator.setAttribute("aria-label", "Loading college website");
  loadingIndicator.innerHTML = '<img src="' + pageBase + 'assets/images/logo/crest.svg" alt=""><span>Loading college website</span>';
  document.body.appendChild(loadingIndicator);
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
  ensureSharedMounts();
  const loadComponent = function (id, file) {
    const mount = document.getElementById(id);
    if (!mount) return Promise.resolve();
    return fetch(pageBase + "components/" + file)
      .then(function (response) { if (!response.ok) throw new Error("Component unavailable"); return response.text(); })
      .then(function (html) { mount.innerHTML = html.replaceAll("__BASE__", pageBase); });
  };

  const loadSiteConfig = function () {
    return fetch(pageBase + "data/site-config.txt").then(function (response) { if (!response.ok) throw new Error("Site configuration unavailable"); return response.text(); }).then(function (text) { siteConfig = parseConfig(text); }).catch(function (error) { console.warn("Using built-in site configuration fallback.", error); });
  };

  const applySiteConfig = function () {
    document.querySelectorAll("[data-config-text]").forEach(function (element) { const value = siteConfig[element.getAttribute("data-config-text")]; if (value) element.textContent = value; });
    document.querySelectorAll("[data-config-href]").forEach(function (element) { const key = element.getAttribute("data-config-href"); const value = siteConfig[key]; if (value) element.href = key === "email" ? "mailto:" + value : "tel:" + value.replace(/\s+/g, ""); });
    const description = document.querySelector('meta[name="description"]'); if (description && siteConfig.officialName) description.content = siteConfig.officialName + ", " + siteConfig.location + " — affiliated to " + siteConfig.affiliation + ".";
    const titleLabel = document.title.split("·")[0].trim(); const isHomepage = window.location.pathname.endsWith("/index.html") || window.location.pathname.endsWith("/"); document.title = isHomepage ? siteConfig.officialName + " · " + siteConfig.location.split(" · ")[0] : titleLabel + " · " + siteConfig.shortName;
  };

  Promise.all([loadSiteConfig(), loadComponent("site-header", "header.html"), loadComponent("site-footer", "footer.html")]).then(function () {
    applySiteConfig();
    initializePage();
  }).catch(function () {
    applySiteConfig();
    initializePage();
  });

  function initializePage() {
  document.body.classList.add("page-ready");
  loadingIndicator.classList.add("is-hidden");
  window.setTimeout(function () { loadingIndicator.remove(); }, 220);
  const pageHero = document.querySelector(".page-hero .container");
  if (pageHero) {
    const heading = pageHero.querySelector("h2");
    const breadcrumb = document.createElement("nav");
    breadcrumb.className = "breadcrumbs";
    breadcrumb.setAttribute("aria-label", "Breadcrumb");
    const pageName = heading ? heading.textContent.trim().toUpperCase() : "PAGE";
    const isDedicatedStudentPage = /\/pages\/(student-support|attendance-code-of-conduct|student-educational-verification|student-achievements|our-services|clubs|cells|committees|centre-for-excellence|magazine-newsletter)\.html$/.test(window.location.pathname);
    const studentZoneCrumb = isDedicatedStudentPage ? '<a href="' + pageBase + 'pages/student-zone.html">STUDENT ZONE</a><span aria-hidden="true">&gt;</span>' : "";
    breadcrumb.innerHTML = '<a href="' + pageBase + 'index.html">HOME</a><span aria-hidden="true">&gt;</span>' + studentZoneCrumb + '<span>' + pageName + "</span>";
    pageHero.insertBefore(breadcrumb, pageHero.firstChild);
  }
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  const close = document.querySelector(".nav-close");
  const firstLink = document.querySelector(".nav-group a");
  if (toggle && nav) {
    let lastFocused = toggle;
    const setMenu = function (open) {
      nav.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      nav.setAttribute("aria-hidden", String(!open));
      if (open) { lastFocused = document.activeElement; if (firstLink) firstLink.focus(); }
      if (!open && lastFocused) lastFocused.focus();
    };
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    if (close) close.addEventListener("click", function () { setMenu(false); });
    nav.addEventListener("click", function (event) { if (event.target === nav) setMenu(false); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("open")) { setMenu(false); return; }
      if (event.key === "Tab" && nav.classList.contains("open")) {
        const focusable = Array.from(nav.querySelectorAll("button, a")).filter(function (item) { return !item.hasAttribute("disabled"); });
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const destination = new URL(link.href, window.location.href);
        if (destination.origin !== window.location.origin) return;
        event.preventDefault();
        document.body.classList.add("page-leaving");
        window.setTimeout(function () { window.location.href = link.href; }, 130);
      });
    });
    nav.querySelectorAll(".nav-group-toggle").forEach(function (button) {
      const submenu = button.closest(".nav-group").querySelector(".nav-submenu");
      button.addEventListener("click", function () { const expanded = button.getAttribute("aria-expanded") === "true"; button.setAttribute("aria-expanded", String(!expanded)); submenu.hidden = expanded; });
    });
    document.querySelectorAll(".main-nav a").forEach(function (link) {
      const linkPath = new URL(link.href).pathname.replace(/\/$/, "");
      const currentPath = window.location.pathname.replace(/\/$/, "");
      if (linkPath === currentPath || (linkPath.endsWith("/index.html") && currentPath.endsWith("/"))) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  const parseKeyValueBlocks = function (text) { return text.split(/\r?\n\s*\r?\n/).map(function (block) { const record = {}; block.split(/\r?\n/).forEach(function (line) { const separator = line.indexOf("="); if (separator > 0 && !line.trim().startsWith("#")) record[line.slice(0, separator).trim()] = line.slice(separator + 1).trim(); }); return record; }).filter(function (record) { return Object.keys(record).length; }); };
  const strengthMount = document.getElementById("student-strength");
  if (strengthMount) {
    fetch(pageBase + "data/students.txt").then(function (response) { if (!response.ok) throw new Error("Student data unavailable"); return response.text(); }).then(function (text) {
      const records = parseKeyValueBlocks(text); const overall = records.find(function (record) { return record.OVERALL_TOTAL; }); const years = records.filter(function (record) { return record.YEAR; }); strengthMount.replaceChildren();
      years.forEach(function (record) { const card = document.createElement("article"); card.className = "strength-card"; const title = document.createElement("h3"); title.textContent = record.YEAR === "1" ? "1st Year" : record.YEAR === "2" ? "2nd Year" : "3rd Year"; const table = document.createElement("table"); table.innerHTML = "<thead><tr><th>Programme</th><th>Students</th></tr></thead><tbody></tbody>"; const body = table.querySelector("tbody"); ["MPCs", "MSCs", "BZC", "BCom(CA)", "BA"].forEach(function (key) { if (!/^\d+$/.test(record[key] || "")) return; const row = document.createElement("tr"); row.innerHTML = "<td></td><td></td>"; row.cells[0].textContent = key === "BCom(CA)" ? "B.Com (CA)" : key; row.cells[1].textContent = record[key]; body.appendChild(row); }); const total = document.createElement("p"); total.className = "year-total"; total.textContent = "Total: " + record.TOTAL + " students"; card.append(title, table, total); strengthMount.appendChild(card); }); if (overall) { const total = document.createElement("p"); total.className = "strength-overall"; total.innerHTML = "<strong></strong>"; total.firstElementChild.textContent = "Overall total: " + overall.OVERALL_TOTAL + " students"; strengthMount.parentElement.appendChild(total); }
    }).catch(function () { strengthMount.textContent = "Current student strength is unavailable."; });
  }

  const noticeMount = document.getElementById("notice-table") || document.getElementById("notice-preview");
  if (noticeMount) {
    const archiveButton = document.querySelector(".archive-button"); const archiveModal = document.getElementById("notice-archive-modal"); const archiveTable = document.getElementById("notice-archive-table");
    const formatDate = function (value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); };
    const formatTime = function (value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); };
    const buildTable = function (items) { const table = document.createElement("table"); table.className = "notice-data-table"; table.innerHTML = "<thead><tr><th>NOTICE</th><th>DATE</th><th>TIME</th></tr></thead><tbody></tbody>"; const body = table.querySelector("tbody"); items.forEach(function (item) { const row = document.createElement("tr"); const title = document.createElement("a"); title.href = pageBase + "assets/notice_files/" + encodeURIComponent(item.file); title.textContent = item.title || item.file; title.target = "_blank"; title.rel = "noopener"; row.innerHTML = "<td></td><td></td><td></td>"; row.cells[0].appendChild(title); row.cells[1].textContent = formatDate(item.updated); row.cells[2].textContent = formatTime(item.updated); body.appendChild(row); }); return table; };
    fetch(pageBase + "assets/notice_files/notice-index.json").then(function (response) { if (!response.ok) throw new Error("Notice index unavailable"); return response.json(); }).then(function (items) { items.sort(function (a, b) { return new Date(b.updated) - new Date(a.updated); }); const emptyState = document.getElementById("notice-empty"); if (!items.length && noticeMount.id === "notice-preview") { noticeMount.closest(".notice-preview").hidden = true; return; } if (!items.length) { noticeMount.replaceChildren(); if (emptyState) emptyState.hidden = false; return; } if (emptyState) emptyState.hidden = true; const current = items.slice(0, 10); noticeMount.replaceChildren(buildTable(current)); if (archiveButton) { archiveButton.disabled = items.length <= 10; archiveButton.title = items.length > 10 ? "View older notices" : "Archive becomes available after more than 10 notices"; if (items.length > 10) { archiveButton.addEventListener("click", function () { archiveTable.replaceChildren(buildTable(items.slice(10))); archiveModal.hidden = false; document.body.classList.add("modal-open"); archiveModal.querySelector(".modal-close").focus(); }); } } }).catch(function () { noticeMount.innerHTML = "<p class=\"empty-state\">Notices are temporarily unavailable. Please contact the college office for current announcements.</p>"; });
    if (archiveModal) { const closeArchive = function () { archiveModal.hidden = true; document.body.classList.remove("modal-open"); }; archiveModal.querySelector(".modal-close").addEventListener("click", closeArchive); archiveModal.addEventListener("click", function (event) { if (event.target === archiveModal) closeArchive(); }); document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !archiveModal.hidden) closeArchive(); }); }
  }

  const backTop = document.createElement("button"); backTop.className = "back-to-top"; backTop.type = "button"; backTop.setAttribute("aria-label", "Back to top"); backTop.innerHTML = "<span aria-hidden=\"true\">↑</span>"; document.body.appendChild(backTop); const updateBackTop = function () { backTop.classList.toggle("is-visible", window.scrollY > 420); }; window.addEventListener("scroll", updateBackTop, { passive: true }); backTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }); updateBackTop();

  const carousel = document.querySelector("[data-carousel]");
  if (carousel) {
    const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));
    let current = 0;
    let timer;
    let paused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let touchStartX = 0;
    const showSlide = function (index) {
      current = (index + slides.length) % slides.length;
      const track = carousel.querySelector(".carousel-track");
      track.style.transform = "translateX(-" + (current * 100) + "%)";
      slides.forEach(function (slide, slideIndex) { slide.classList.toggle("is-active", slideIndex === current); slide.hidden = false; slide.setAttribute("aria-hidden", String(slideIndex !== current)); });
    };
    const stop = function () { window.clearInterval(timer); };
    const start = function () { stop(); if (!paused) timer = window.setInterval(function () { showSlide(current + 1); }, 5000); };
    carousel.querySelector(".carousel-prev").addEventListener("click", function () { showSlide(current - 1); start(); });
    carousel.querySelector(".carousel-next").addEventListener("click", function () { showSlide(current + 1); start(); });
    const pauseButton = carousel.querySelector(".carousel-pause");
    if (pauseButton) pauseButton.addEventListener("click", function () { paused = !paused; pauseButton.setAttribute("aria-pressed", String(paused)); pauseButton.textContent = paused ? "Play" : "Pause"; pauseButton.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow"); if (paused) stop(); else start(); });
    carousel.addEventListener("mouseenter", stop); carousel.addEventListener("mouseleave", start); carousel.addEventListener("focusin", stop); carousel.addEventListener("focusout", function (event) { if (!carousel.contains(event.relatedTarget)) start(); });
    carousel.addEventListener("keydown", function (event) { if (event.key === "ArrowLeft") showSlide(current - 1); if (event.key === "ArrowRight") showSlide(current + 1); });
    carousel.addEventListener("touchstart", function (event) { touchStartX = event.changedTouches[0].clientX; stop(); }, { passive: true });
    carousel.addEventListener("touchend", function (event) { const distance = event.changedTouches[0].clientX - touchStartX; if (Math.abs(distance) > 40) showSlide(current + (distance < 0 ? 1 : -1)); start(); }, { passive: true });
    showSlide(0);
    start();
  }

  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const recipient = form.getAttribute("data-contact-email") || siteConfig.email;
      const fields = new FormData(form);
      const subject = "College enquiry: " + fields.get("topic");
      const body = "Name: " + fields.get("name") + "\nEmail: " + fields.get("email") + "\nTopic: " + fields.get("topic") + "\n\n" + fields.get("message");
      window.location.href = "mailto:" + recipient + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      const success = document.getElementById("form-success");
      if (success) { success.classList.add("show"); success.focus(); }
    });
  }

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  if (lightbox && lightboxImg) {
    document.querySelectorAll("[data-lightbox]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        lightboxImg.src = link.getAttribute("href");
        lightbox.classList.add("open");
      });
    });
    lightbox.addEventListener("click", function () {
      lightbox.classList.remove("open");
    });
  }

  const departmentPage = document.querySelector(".department-layout");
  if (departmentPage) {
    const departmentButtons = Array.from(departmentPage.querySelectorAll(".department-select"));
    const detail = departmentPage.querySelector(".department-detail");
    const facultyList = document.getElementById("faculty-list");
    const modal = document.querySelector(".faculty-modal");
    const closeModal = modal && modal.querySelector(".faculty-modal-close");
    let currentDepartment = "Botany";
    let facultyRecords = [];
    const normalize = function (value) { return String(value || "").toLowerCase().replace(/^department\s+of\s+/, "").replace(/\s*&\s*/g, " and ").replace(/[^a-z0-9]+/g, " ").trim(); };
    const parseFaculty = function (text) {
      return text.split(/\r?\n\s*\r?\n/).map(function (block) {
        const record = {};
        block.split(/\r?\n/).forEach(function (line) { const separator = line.indexOf("="); if (separator > 0 && !line.trim().startsWith("#")) record[line.slice(0, separator).trim()] = line.slice(separator + 1).trim(); });
        return record;
      }).filter(function (record) { return record.faculty_profile_number; });
    };
    const openFaculty = function (record) {
      if (!modal) return;
      modal.querySelector("#faculty-modal-title").textContent = record.Name || "Faculty profile";
      const fields = ["Department", "Designation", "Qualification", "Teaching Experience", "Academic Positions", "Areas of Interest", "Contact"];
      const definitionList = modal.querySelector("dl");
      definitionList.replaceChildren();
      fields.forEach(function (field) { if (record[field]) { const term = document.createElement("dt"); const value = document.createElement("dd"); term.textContent = field; value.textContent = record[field]; definitionList.append(term, value); } });
      modal.hidden = false;
      document.body.classList.add("modal-open");
      if (closeModal) closeModal.focus();
    };
    const renderFaculty = function () {
      if (!facultyList) return;
      facultyList.replaceChildren();
      const matches = facultyRecords.filter(function (record) { return normalize(record.Department).includes(normalize(currentDepartment)) || normalize(currentDepartment).includes(normalize(record.Department)); });
      if (!matches.length) { const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = "Faculty profiles will be added when official records are supplied."; facultyList.appendChild(empty); return; }
      matches.forEach(function (record) {
        const card = document.createElement("button"); card.type = "button"; card.className = "faculty-card";
        const photo = document.createElement("span"); photo.className = "faculty-photo"; photo.setAttribute("role", "img"); photo.setAttribute("aria-label", "Photograph of " + (record.Name || "faculty member"));
        const image = document.createElement("img"); image.alt = ""; const extensions = ["jpg", "jpeg", "png", "webp"]; let extensionIndex = 0; image.src = pageBase + "assets/images/faculty_profile_images/" + record.faculty_profile_number + "." + extensions[extensionIndex]; image.onerror = function () { extensionIndex += 1; if (extensionIndex < extensions.length) image.src = pageBase + "assets/images/faculty_profile_images/" + record.faculty_profile_number + "." + extensions[extensionIndex]; else { image.remove(); photo.classList.add("missing-image"); } }; photo.appendChild(image);
        const details = document.createElement("span"); details.innerHTML = "<strong></strong><small></small>"; details.firstElementChild.textContent = record.Name || "Faculty profile"; details.lastElementChild.textContent = record.Designation || "Designation to be supplied";
        card.append(photo, details); card.addEventListener("click", function () { openFaculty(record); }); facultyList.appendChild(card);
      });
    };
    departmentButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        departmentButtons.forEach(function (item) { item.classList.toggle("is-selected", item === button); });
        currentDepartment = button.textContent.trim(); detail.querySelector(".department-title").textContent = currentDepartment; renderFaculty();
      });
    });
    departmentPage.querySelectorAll(".department-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        const panelId = tab.getAttribute("aria-controls");
        departmentPage.querySelectorAll(".department-tab").forEach(function (item) { item.classList.toggle("is-active", item === tab); item.setAttribute("aria-selected", String(item === tab)); });
        departmentPage.querySelectorAll(".department-panel").forEach(function (panel) { panel.hidden = panel.id !== panelId; panel.classList.toggle("is-active", panel.id === panelId); });
      });
    });
    const dismissModal = function () { if (modal) { modal.hidden = true; document.body.classList.remove("modal-open"); } };
    if (closeModal) closeModal.addEventListener("click", dismissModal);
    if (modal) { modal.addEventListener("click", function (event) { if (event.target === modal) dismissModal(); }); document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !modal.hidden) dismissModal(); }); }
    fetch(pageBase + "data/faculty.txt").then(function (response) { if (!response.ok) throw new Error("Faculty file unavailable"); return response.text(); }).then(function (text) { facultyRecords = parseFaculty(text); renderFaculty(); }).catch(function () { facultyRecords = []; renderFaculty(); });
  }
  }
})();
