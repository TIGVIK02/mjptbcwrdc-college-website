(function () {
  "use strict";

  const mount = document.getElementById("magazine-list");
  if (!mount) return;

  Site.onReady(function () {
    const emptyMessage = "No annual magazines are currently available.";
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
        view.href = Site.pageBase + record.pdf;
        view.target = "_blank";
        view.rel = "noopener";
        view.textContent = "VIEW MAGAZINE";
        actions.appendChild(view);
        card.append(heading, actions);
        mount.appendChild(card);
      });
    };

    Site.loadData("data/magazine.json", "json").then(function (records) {
      render(records);
    }).catch(function () {
      render([]);
    });
  });
})();
