(function () {
  "use strict";

  const mount = document.getElementById("pyq-list");
  if (!mount) return;

  Site.onReady(function () {
    const emptyMessage = "PREVIOUS YEAR QUESTION PAPERS ARE CURRENTLY UNAVAILABLE. PLEASE CHECK AGAIN LATER.";
    const pageBase = Site.pageBase;
    const directoryUrl = new URL(pageBase + "assets/pyq/", window.location.href);

    /* Accept only direct PDF links from the intended PYQ directory listing. */
    const parseDirectoryListing = function (html) {
      const listing = new DOMParser().parseFromString(html, "text/html");
      return Array.from(listing.querySelectorAll("a[href]")).map(function (link) {
        const url = new URL(link.getAttribute("href"), directoryUrl);
        const fileName = decodeURIComponent(url.pathname.split("/").pop());
        return { url: url, fileName: fileName };
      }).filter(function (record) {
        return record.url.origin === window.location.origin &&
          record.url.pathname.startsWith(directoryUrl.pathname) &&
          record.url.pathname.slice(directoryUrl.pathname.length).indexOf("/") === -1 &&
          /^[^/]+\.pdf$/i.test(record.fileName);
      }).map(function (record) {
        return { title: record.fileName.replace(/\.pdf$/i, ""), pdf: record.url.href };
      }).sort(function (first, second) {
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
        card.className = "resource-card";
        const heading = document.createElement("h3");
        heading.textContent = record.title;
        const actions = document.createElement("div");
        actions.className = "resource-actions";
        const view = document.createElement("a");
        view.className = "archive-button";
        view.href = record.pdf;
        view.target = "_blank";
        view.rel = "noopener";
        view.textContent = "VIEW";
        const download = document.createElement("a");
        download.className = "archive-button";
        download.href = record.pdf;
        download.setAttribute("download", "");
        download.textContent = "DOWNLOAD";
        actions.append(view, download);
        card.append(heading, actions);
        mount.appendChild(card);

      });
    };

    Site.loadData("assets/pyq/", "text").then(function (html) {
      render(parseDirectoryListing(html));
    }).catch(function () {
      mount.innerHTML = '<p class="empty-state">' + emptyMessage + '</p>';
    });
  });
})();
