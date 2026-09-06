(function () {
  "use strict";

  const ticker = document.getElementById("quick-notice-ticker");
  const tickerTrack = document.getElementById("quick-notice-track");
  const quickList = document.getElementById("quick-notices-list");
  const pdfList = document.getElementById("pdf-notices-list");
  if (!ticker && !quickList && !pdfList) return;

  Site.onReady(function () {
    const pageBase = Site.pageBase;
    const parseQuickNotices = function (text) {
      return text.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
    };
    const parsePdfNotices = function (text) {
      return Site.parseKeyValueBlocks(text).map(function (record) {
        return { title: (record.TITLE || "").trim(), pdf: (record.PDF || "").trim() };
      }).filter(function (record) { return record.title && record.pdf && !record.pdf.includes("/") && !record.pdf.includes("\\"); });
    };
    const renderEmpty = function (mount, message, emptyId) {
      if (!mount) return;
      mount.replaceChildren();
      const empty = document.getElementById(emptyId);
      if (empty) empty.hidden = false;
      else mount.innerHTML = '<p class="empty-state">' + message + '</p>';
    };
    const renderQuickList = function (notices) {
      if (!quickList) return;
      const empty = document.getElementById("quick-notices-empty");
      if (empty) empty.hidden = notices.length > 0;
      if (!notices.length) { renderEmpty(quickList, "NO QUICK NOTICES ARE CURRENTLY PUBLISHED.", "quick-notices-empty"); return; }
      const table = document.createElement("table"); table.className = "notice-data-table"; table.innerHTML = "<thead><tr><th>NOTICE</th></tr></thead><tbody></tbody>";
      const body = table.querySelector("tbody"); notices.forEach(function (notice) { const row = document.createElement("tr"); const cell = document.createElement("td"); cell.textContent = notice; row.appendChild(cell); body.appendChild(row); }); quickList.replaceChildren(table);
    };
    const renderTicker = function (notices) {
      if (!ticker || !tickerTrack) return;
      if (!notices.length) { ticker.hidden = true; return; }
      ticker.hidden = false; tickerTrack.replaceChildren();
      const renderItems = function (items) { items.forEach(function (notice) { const item = document.createElement("span"); item.textContent = notice; tickerTrack.appendChild(item); }); };
      renderItems(notices);
      if (notices.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) { renderItems(notices); tickerTrack.classList.add("is-scrolling"); }
    };
    const renderPdfList = function (records) {
      if (!pdfList) return;
      const empty = document.getElementById("pdf-notices-empty");
      if (empty) empty.hidden = records.length > 0;
      if (!records.length) { renderEmpty(pdfList, "NO DOCUMENT NOTICES ARE CURRENTLY PUBLISHED.", "pdf-notices-empty"); return; }
      const table = document.createElement("table"); table.className = "notice-data-table"; table.innerHTML = "<thead><tr><th>DOCUMENT NOTICE</th></tr></thead><tbody></tbody>";
      const body = table.querySelector("tbody"); records.forEach(function (record) { const row = document.createElement("tr"); const cell = document.createElement("td"); const link = document.createElement("a"); link.textContent = record.title; link.href = pageBase + "assets/notice_files/" + encodeURIComponent(record.pdf); link.target = "_blank"; link.rel = "noopener"; cell.appendChild(link); row.appendChild(cell); body.appendChild(row); fetch(link.href, { headers: { Range: "bytes=0-0" } }).then(function (response) { if (!response.ok) throw new Error("Document unavailable"); }).catch(function () { link.removeAttribute("href"); link.removeAttribute("target"); link.removeAttribute("rel"); link.textContent = record.title + " (DOCUMENT UNAVAILABLE)"; }); }); pdfList.replaceChildren(table);
    };

    Site.loadData("assets/notice_files/quick-notices.txt", "text").then(function (text) {
      const notices = parseQuickNotices(text); renderQuickList(notices); renderTicker(notices);
    }).catch(function () { if (quickList) renderEmpty(quickList, "NO QUICK NOTICES ARE CURRENTLY PUBLISHED.", "quick-notices-empty"); if (ticker) ticker.hidden = true; });
    if (pdfList) Site.loadData("assets/notice_files/pdf-notices.txt", "text").then(function (text) { renderPdfList(parsePdfNotices(text)); }).catch(function () { renderEmpty(pdfList, "NO DOCUMENT NOTICES ARE CURRENTLY PUBLISHED.", "pdf-notices-empty"); });
  });
})();
