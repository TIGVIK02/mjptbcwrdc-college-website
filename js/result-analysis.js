(function () {
  "use strict";
  const mount = document.getElementById("result-analysis-table");
  if (!mount) return;

  const pageBase = Site.pageBase;

  const renderEmpty = function (message) {
    mount.innerHTML = '<p class="empty-state">' + message + '</p>';
  };

  const toDisplayName = function (filename) {
    const stem = String(filename || "").split(".")[0];
    if (!stem) return "Result Analysis";
    const spaced = stem.replace(/[_-]+/g, " ").replace(/(?<=[A-Za-z])(?=\d)/g, " ");
    const words = spaced.split(/\s+/).filter(Boolean);
    if (!words.length) return "Result Analysis";
    return words.map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); }).join(" ");
  };

  const getTableMarkup = function (rows) {
    const table = document.createElement("table");
    table.className = "notice-data-table";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Workbook", "Title", "Status"].forEach(function (label) {
      const th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach(function (row) {
      const tr = document.createElement("tr");
      const nameCell = document.createElement("td");
      nameCell.textContent = row.title;
      const titleCell = document.createElement("td");
      titleCell.textContent = row.filename;
      const actionCell = document.createElement("td");
      const actionWrap = document.createElement("div");
      actionWrap.className = "resource-actions";

      const viewButton = document.createElement("button");
      viewButton.type = "button";
      viewButton.className = "archive-button";
      viewButton.textContent = "VIEW";
      viewButton.setAttribute("aria-label", "View result analysis workbook " + row.title);
      viewButton.addEventListener("click", function () {
        openWorkbookViewer(row);
      });

      const downloadLink = document.createElement("a");
      downloadLink.className = "archive-button";
      downloadLink.href = pageBase + row.path;
      downloadLink.setAttribute("download", row.filename);
      downloadLink.textContent = "DOWNLOAD";

      actionWrap.appendChild(viewButton);
      actionWrap.appendChild(downloadLink);
      actionCell.appendChild(actionWrap);
      tr.appendChild(nameCell);
      tr.appendChild(titleCell);
      tr.appendChild(actionCell);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    return table;
  };

  const openWorkbookViewer = function (file) {
    if (!window.XLSX) {
      renderEmpty("THE RESULT ANALYSIS VIEWER IS UNAVAILABLE. PLEASE USE THE DOWNLOAD OPTION TO OPEN THE ORIGINAL EXCEL FILE.");
      return;
    }

    const backdrop = document.createElement("div");
    backdrop.style.position = "fixed";
    backdrop.style.top = "0";
    backdrop.style.left = "0";
    backdrop.style.right = "0";
    backdrop.style.bottom = "0";
    backdrop.style.background = "rgba(4, 20, 36, 0.72)";
    backdrop.style.display = "flex";
    backdrop.style.alignItems = "center";
    backdrop.style.justifyContent = "center";
    backdrop.style.zIndex = "2000";
    backdrop.style.padding = "1rem";

    const modal = document.createElement("div");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Result analysis workbook viewer");
    modal.style.width = "min(1200px, 96vw)";
    modal.style.maxHeight = "90vh";
    modal.style.background = "#ffffff";
    modal.style.borderRadius = "16px";
    modal.style.boxShadow = "0 22px 70px rgba(0,0,0,0.25)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.overflow = "hidden";
    modal.style.border = "1px solid rgba(11, 37, 64, 0.12)";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.gap = "1rem";
    header.style.padding = "1rem 1.25rem";
    header.style.borderBottom = "1px solid rgba(11, 37, 64, 0.12)";
    header.style.background = "#f6f0e8";

    const title = document.createElement("h3");
    title.textContent = file.title;
    title.style.margin = "0";
    title.style.fontSize = "1.1rem";
    title.style.color = "#0b2540";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "CLOSE";
    closeButton.className = "archive-button";
    closeButton.setAttribute("aria-label", "Close workbook viewer");
    closeButton.addEventListener("click", function () { backdrop.remove(); });

    header.appendChild(title);
    header.appendChild(closeButton);

    const sheetBar = document.createElement("div");
    sheetBar.style.display = "flex";
    sheetBar.style.flexWrap = "wrap";
    sheetBar.style.gap = "0.5rem";
    sheetBar.style.padding = "0.75rem 1.25rem";
    sheetBar.style.borderBottom = "1px solid rgba(11, 37, 64, 0.12)";
    sheetBar.style.background = "#fff";

    const viewport = document.createElement("div");
    viewport.style.flex = "1";
    viewport.style.overflow = "auto";
    viewport.style.padding = "1rem 1.25rem";
    viewport.style.background = "#f9f8f5";

    const status = document.createElement("p");
    status.style.margin = "0 0 0.75rem";
    status.style.color = "#0b2540";
    status.style.fontWeight = "600";
    status.textContent = "Loading workbook...";

    const downloadLink = document.createElement("a");
    downloadLink.className = "archive-button";
    downloadLink.href = pageBase + file.path;
    downloadLink.setAttribute("download", file.filename);
    downloadLink.textContent = "DOWNLOAD EXCEL";
    downloadLink.style.margin = "0 1.25rem 1rem";

    modal.appendChild(header);
    modal.appendChild(sheetBar);
    modal.appendChild(viewport);
    modal.appendChild(downloadLink);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    const closeOnEscape = function (event) {
      if (event.key === "Escape") {
        backdrop.remove();
        window.removeEventListener("keydown", closeOnEscape);
      }
    };
    window.addEventListener("keydown", closeOnEscape);

    fetch(pageBase + file.path)
      .then(function (response) {
        if (!response.ok) throw new Error("Workbook unavailable");
        return response.arrayBuffer();
      })
      .then(function (buffer) {
        const workbook = XLSX.read(buffer, { type: "array", cellDates: true, raw: false });
        const sheetNames = workbook.SheetNames || [];
        if (!sheetNames.length) {
          status.textContent = "This result analysis file could not be displayed. Please use the Download option to open the original Excel file.";
          return;
        }

        const renderSheet = function (sheetName) {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) return;
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: "" });
          const colCount = Math.max(1, ...rows.map(function (row) { return Array.isArray(row) ? row.length : 1; }));
          const table = document.createElement("table");
          table.style.width = "100%";
          table.style.borderCollapse = "collapse";
          table.style.tableLayout = "fixed";
          table.style.minWidth = "720px";

          rows.forEach(function (row, rowIndex) {
            const tr = document.createElement("tr");
            for (let index = 0; index < colCount; index += 1) {
              const cell = document.createElement(rowIndex === 0 ? "th" : "td");
              const value = Array.isArray(row) && row[index] !== undefined ? row[index] : "";
              const text = value === null || value === undefined ? "" : String(value);
              cell.textContent = text;
              cell.style.border = "1px solid rgba(11, 37, 64, 0.15)";
              cell.style.padding = "0.5rem 0.7rem";
              cell.style.background = rowIndex === 0 ? "#eef5ff" : "#ffffff";
              cell.style.verticalAlign = "top";
              cell.style.whiteSpace = "normal";
              cell.style.wordBreak = "break-word";
              cell.style.fontSize = "0.82rem";
              tr.appendChild(cell);
            }
            table.appendChild(tr);
          });

          viewport.innerHTML = "";
          viewport.appendChild(table);
        };

        let activeSheet = sheetNames[0];
        const switchSheet = function (sheetName) {
          activeSheet = sheetName;
          sheetBar.querySelectorAll("button").forEach(function (button) {
            const isActive = button.dataset.sheetName === sheetName;
            button.setAttribute("aria-pressed", String(isActive));
            button.style.background = isActive ? "#0b2540" : "#eef3fa";
            button.style.color = isActive ? "#ffffff" : "#0b2540";
            button.style.border = "1px solid rgba(11, 37, 64, 0.1)";
            button.style.fontWeight = isActive ? "700" : "600";
          });
          status.textContent = "Sheet: " + sheetName;
          renderSheet(sheetName);
        };

        sheetNames.forEach(function (sheetName) {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = sheetName;
          button.dataset.sheetName = sheetName;
          button.setAttribute("aria-label", "Open worksheet " + sheetName);
          button.setAttribute("aria-pressed", String(sheetName === activeSheet));
          button.style.border = "1px solid rgba(11, 37, 64, 0.1)";
          button.style.borderRadius = "999px";
          button.style.padding = "0.5rem 0.8rem";
          button.style.cursor = "pointer";
          button.style.background = sheetName === activeSheet ? "#0b2540" : "#eef3fa";
          button.style.color = sheetName === activeSheet ? "#ffffff" : "#0b2540";
          button.style.fontWeight = sheetName === activeSheet ? "700" : "600";
          button.addEventListener("click", function () { switchSheet(sheetName); });
          sheetBar.appendChild(button);
        });

        status.textContent = "Sheet: " + activeSheet;
        renderSheet(activeSheet);
        viewport.insertBefore(status, viewport.firstChild);
      })
      .catch(function () {
        status.textContent = "This result analysis file could not be displayed. Please use the Download option to open the original Excel file.";
      });
  };

  Site.onReady(function () {
    Site.loadData("data/result-analysis.json", "json")
      .then(function (payload) {
        const files = Array.isArray(payload && payload.files) ? payload.files : [];
        if (!files.length) {
          renderEmpty("RESULT ANALYSIS FILES ARE CURRENTLY UNAVAILABLE. PLEASE CHECK AGAIN LATER.");
          return;
        }
        mount.replaceChildren(getTableMarkup(files.map(function (file) { return { title: file.title || toDisplayName(file.filename), filename: file.filename, path: file.path }; })));
      })
      .catch(function () {
        renderEmpty("RESULT ANALYSIS FILES ARE CURRENTLY UNAVAILABLE. PLEASE CHECK AGAIN LATER.");
      });
  });
})();
