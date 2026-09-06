(function () {
  "use strict";
  const mount = document.getElementById("result-analysis-table");
  if (!mount) return;
  Site.onReady(function () {
    const fields = ["ACADEMIC_YEAR", "PROGRAMME", "YEAR_SEMESTER", "STUDENTS", "APPEARED", "PASSED", "PASS_PERCENTAGE"];
    const parseRecords = function (text) { return Site.parseKeyValueBlocks(text).filter(function (record) { return fields.some(function (field) { return record[field]; }); }); };
    const render = function (records) {
      if (!records.length) { mount.innerHTML = "<p class=\"empty-state\">OFFICIAL RESULT ANALYSIS WILL BE PUBLISHED HERE WHEN DATA IS SUPPLIED.</p>"; return; }
      const table = document.createElement("table"); table.className = "notice-data-table"; table.innerHTML = "<thead><tr><th>ACADEMIC YEAR</th><th>PROGRAMME</th><th>YEAR / SEMESTER</th><th>NUMBER OF STUDENTS</th><th>STUDENTS APPEARED</th><th>STUDENTS PASSED</th><th>PASS PERCENTAGE</th></tr></thead><tbody></tbody>";
      const body = table.querySelector("tbody"); records.forEach(function (record) { const row = document.createElement("tr"); fields.forEach(function (field) { const cell = document.createElement("td"); cell.textContent = record[field] || "—"; row.appendChild(cell); }); body.appendChild(row); }); mount.replaceChildren(table);
    };
    Site.loadData("data/result-analysis.txt", "text").then(function (text) { render(parseRecords(text)); }).catch(function () { mount.innerHTML = "<p class=\"empty-state\">OFFICIAL RESULT ANALYSIS IS CURRENTLY UNAVAILABLE. PLEASE CHECK AGAIN LATER.</p>"; });
  });
})();
