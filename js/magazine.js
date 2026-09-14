(function () {
  "use strict";

  const mount = document.getElementById("magazine-list");
  if (!mount) return;

  Site.onReady(function () {
    const directoryUrl = new URL(Site.pageBase + "assets/magazine/", window.location.href);
    const emptyMessage = "No annual magazines are currently available.";
    const formatTitle = function (fileName) {
      return fileName.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    };
    const parseDirectoryListing = function (html) {
      const listing = new DOMParser().parseFromString(html, "text/html");
      return Array.from(listing.querySelectorAll("a[href]")).map(function (link) {
        const url = new URL(link.getAttribute("href"), directoryUrl);
        const fileName = decodeURIComponent(url.pathname.split("/").pop());
        const yearMatch = fileName.match(/(?:^|[^0-9])((?:19|20)\d{2})(?!\d)/);
        return { url: url, fileName: fileName, year: yearMatch ? Number(yearMatch[1]) : null };
      }).filter(function (record) {
        return record.url.origin === window.location.origin &&
          record.url.pathname.startsWith(directoryUrl.pathname) &&
          record.url.pathname.slice(directoryUrl.pathname.length).indexOf("/") === -1 &&
          /^[^/]+\.pdf$/i.test(record.fileName);
      }).map(function (record) {
        return { title: formatTitle(record.fileName), fileName: record.fileName, year: record.year, pdf: record.url.href };
      }).sort(function (first, second) {
        if (first.year !== null && second.year !== null && first.year !== second.year) return second.year - first.year;
        if (first.year !== null) return -1;
        if (second.year !== null) return 1;
        return first.title.localeCompare(second.title);
      });
    };
    const render = function (records) {
      mount.replaceChildren();
      if (!records.length) {
        mount.innerHTML = '<p class="empty-state">' + emptyMessage + '</p>';
        return;
      }
      records.forEach(function (record) {
        const card = document.createElement("article");
        card.className = "resource-card magazine-card";
        const heading = document.createElement("h3");
        heading.textContent = record.title;
        if (record.year !== null) {
          const year = document.createElement("p");
          year.className = "magazine-year";
          year.textContent = String(record.year);
          card.append(year);
        }
        const actions = document.createElement("div");
        actions.className = "resource-actions";
        const view = document.createElement("a");
        view.className = "archive-button";
        view.href = record.pdf;
        view.target = "_blank";
        view.rel = "noopener";
        view.textContent = "VIEW MAGAZINE";
        actions.appendChild(view);
        card.append(heading, actions);
        mount.appendChild(card);
      });
    };

    Site.loadData("assets/magazine/", "text").then(function (html) {
      render(parseDirectoryListing(html));
    }).catch(function () {
      render([]);
    });
  });
})();
