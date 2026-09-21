(function () {
  "use strict";
  const mount = document.getElementById("syllabi-list");
  if (!mount) return;

  Site.onReady(function () {
    Site.loadData("data/syllabi.txt", "text").then(function (text) {
      mount.replaceChildren();
      Site.parseKeyValueBlocks(text).forEach(function (record) {
        const row = document.createElement("tr");
        const department = document.createElement("td");
        const course = document.createElement("td");
        const pdf = document.createElement("td");

        const departmentName = (record.department || "").trim() || "Department to be supplied";
        const courseName = (record.course || departmentName || "").trim() || "Course to be supplied";
        const pdfPath = String(record.pdf || "").trim().replace(/\\/g, "/").replace(/^\/+/, "");

        department.textContent = departmentName;
        course.textContent = courseName;

        if (pdfPath) {
          const link = document.createElement("a");
          link.href = (Site.pageBase || "") + pdfPath;
          link.textContent = "View PDF";
          link.target = "_blank";
          link.rel = "noopener";
          pdf.appendChild(link);
        } else {
          pdf.textContent = "Not Available";
          pdf.className = "muted";
        }

        row.append(department, course, pdf);
        mount.appendChild(row);
      });
    }).catch(function () {
      mount.innerHTML = '<tr><td colspan="3">Syllabus records are currently unavailable.</td></tr>';
    });
  });
})();