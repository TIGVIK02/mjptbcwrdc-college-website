(function () {
  "use strict";
  const mount = document.getElementById("syllabi-list");
  if (!mount) return;
  Site.onReady(function () {
    Site.loadData("data/syllabi.txt", "text").then(function (text) {
      mount.replaceChildren();
      Site.parseKeyValueBlocks(text).forEach(function (record) {
        const row = document.createElement("tr");
        const department = document.createElement("td"); department.textContent = record.department || "Department to be supplied";
        const pdf = document.createElement("td");
        if (record.pdf) {
          const link = document.createElement("a");
          link.href = Site.pageBase + record.pdf;
          link.textContent = "View PDF";
          link.target = "_blank";
          link.rel = "noopener";
          pdf.appendChild(link);
        } else {
          pdf.textContent = "Not Available";
          pdf.className = "muted";
        }
        row.append(department, pdf); mount.appendChild(row);
      });
    }).catch(function () { mount.innerHTML = "<tr><td colspan=\"2\">Syllabus records are currently unavailable.</td></tr>"; });
  });
})();