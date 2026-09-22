(function () {
  "use strict";
  const mount = document.getElementById("student-placements-list");
  if (!mount) return;

  Site.onReady(function () {
    const emptyMessage = "Placement information is currently unavailable.";

    const render = function (records) {
      mount.replaceChildren();

      if (!records.length) {
        mount.innerHTML = '<tr><td colspan="6" class="empty-state">' + emptyMessage + '</td></tr>';
        return;
      }

      records.forEach(function (record) {
        const row = document.createElement("tr");
        const student = document.createElement("td");
        const course = document.createElement("td");
        const company = document.createElement("td");
        const role = document.createElement("td");
        const packageCell = document.createElement("td");
        const academicYear = document.createElement("td");

        student.textContent = record.student || "-";
        course.textContent = record.course || "-";
        company.textContent = record.company || "-";
        role.textContent = record.role || "-";
        packageCell.textContent = record.package || "-";
        academicYear.textContent = record.academicYear || "-";

        row.append(student, course, company, role, packageCell, academicYear);
        mount.appendChild(row);
      });
    };

    Site.loadData("data/student-placements.json", "json").then(function (payload) {
      const records = Array.isArray(payload && payload.records) ? payload.records : [];
      render(records);
    }).catch(function () {
      mount.innerHTML = '<tr><td colspan="6" class="empty-state">' + emptyMessage + '</td></tr>';
    });
  });
})();
