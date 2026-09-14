(function () {
  "use strict";

  const mount = document.getElementById("pyq-list");
  if (!mount) return;

  Site.onReady(function () {
    const emptyMessage = "PREVIOUS YEAR QUESTION PAPERS ARE CURRENTLY UNAVAILABLE. PLEASE CHECK AGAIN LATER.";
    const pageBase = Site.pageBase;

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
        view.href = pageBase + record.pdf;
        view.target = "_blank";
        view.rel = "noopener";
        view.textContent = "VIEW";
        const download = document.createElement("a");
        download.className = "archive-button";
        download.href = pageBase + record.pdf;
        download.setAttribute("download", "");
        download.textContent = "DOWNLOAD";
        actions.append(view, download);
        card.append(heading, actions);
        mount.appendChild(card);

      });
    };

    Site.loadData("data/pyq.json", "json").then(function (records) {
      render(records);
    }).catch(function () {
      mount.innerHTML = '<p class="empty-state">' + emptyMessage + '</p>';
    });
  });
})();
