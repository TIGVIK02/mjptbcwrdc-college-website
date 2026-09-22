(function () {
  "use strict";

  const mount = document.getElementById("events-list");
  if (!mount) return;

  Site.onReady(function () {
    const emptyMessage = "No events are currently available.";
    const normalizeTitle = function (value) {
      return String(value || "Event").replace(/[_-]+/g, " ").replace(/\s*\(\d+\)\s*$/g, "").replace(/\s+/g, " ").trim();
    };

    const render = function (records) {
      mount.replaceChildren();
      if (!records.length) {
        mount.innerHTML = '<p class="empty-state">' + emptyMessage + '</p>';
        return;
      }

      records.forEach(function (record) {
        const card = document.createElement("article");
        card.className = "resource-card event-card";

        const heading = document.createElement("h3");
        heading.textContent = normalizeTitle(record.title || "Event");
        card.appendChild(heading);

        if (record.year) {
          const metaYear = document.createElement("p");
          metaYear.className = "muted";
          metaYear.textContent = String(record.year);
          card.appendChild(metaYear);
        }

        if (record.type === "image") {
          const preview = document.createElement("img");
          preview.src = Site.pageBase + record.path;
          preview.alt = record.title || "Event photograph";
          preview.loading = "lazy";
          preview.style.display = "block";
          preview.style.width = "100%";
          preview.style.maxHeight = "260px";
          preview.style.objectFit = "cover";
          preview.style.border = "1px solid #e4ddd2";
          preview.style.margin = "0 0 1rem";
          card.appendChild(preview);
        }

        const actions = document.createElement("div");
        actions.className = "resource-actions";

        const view = document.createElement("a");
        view.className = "archive-button";
        view.href = Site.pageBase + record.path;
        view.target = "_blank";
        view.rel = "noopener";
        view.textContent = record.type === "pdf" ? "VIEW PDF" : "VIEW EVENT";
        actions.appendChild(view);

        const download = document.createElement("a");
        download.className = "archive-button";
        download.href = Site.pageBase + record.path;
        download.setAttribute("download", record.file || record.title || "event");
        download.target = "_blank";
        download.rel = "noopener";
        download.textContent = "DOWNLOAD";
        actions.appendChild(download);

        card.appendChild(actions);
        mount.appendChild(card);
      });
    };

    Site.loadData("data/events.json", "json").then(function (records) {
      render(records);
    }).catch(function () {
      render([]);
    });
  });
})();
