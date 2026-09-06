(function () {
  "use strict";
  const mount = document.getElementById("student-achievements-list");
  if (!mount) return;
  Site.onReady(function () {
    const parseRecords = function (text) {
      return Site.parseKeyValueBlocks(text).map(function (record) { return { name: (record.name || "").trim(), achievement: (record.achievement || "").trim() }; }).filter(function (record) { return record.name && record.achievement; });
    };
    const render = function (records) {
      if (!records.length) { mount.innerHTML = '<p class="empty-state">Student achievement information is currently unavailable.</p>'; return; }
      const table = document.createElement("table"); table.className = "clean-data-table"; table.innerHTML = "<thead><tr><th>NAME</th><th>ACHIEVEMENT</th></tr></thead><tbody></tbody>";
      const body = table.querySelector("tbody"); records.forEach(function (record) { const row = document.createElement("tr"); const name = document.createElement("td"); const achievement = document.createElement("td"); name.textContent = record.name; achievement.textContent = record.achievement; row.append(name, achievement); body.appendChild(row); }); mount.replaceChildren(table);
    };
    Site.loadData("data/student_achievements.txt", "text").then(function (text) { render(parseRecords(text)); }).catch(function () { mount.innerHTML = '<p class="empty-state">Student achievement information is currently unavailable.</p>'; });
  });
})();
