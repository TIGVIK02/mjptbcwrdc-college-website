(function () {
  "use strict";
  const page = document.querySelector(".timetable-page");
  if (!page) return;

  Site.onReady(function () {
    const programmeSelect = page.querySelector("#programme-select");
    const yearSelect = page.querySelector("#year-select");
    const sectionField = page.querySelector(".timetable-section-field");
    const sectionSelect = page.querySelector("#section-select");
    const status = page.querySelector(".timetable-status");
    const view = page.querySelector(".timetable-view");
    const title = page.querySelector("#selected-timetable-title");
    const frame = page.querySelector(".timetable-frame");
    const manifestPath = Site.pageBase + "website raw data/timetable_output/timetable_manifest.json";
    const programmeNames = { BA: "B.A.", BCOM_BA: "B.Com. (Business Administration)", BCOM_CA: "B.Com. (Computer Applications)", BZC: "B.Z.C.", MPCS: "M.P.Cs.", MSCS: "M.Sc.s" };
    let programmes = [];
    let selectedProgramme = null;
    let selectedYear = null;
    let selectedSection = null;

    const clearView = function (message) {
      view.hidden = true;
      frame.removeAttribute("src");
      status.textContent = message;
    };
    const showTimetable = function () {
      const entry = selectedProgramme && selectedProgramme.entries.find(function (item) { return item.year === selectedYear && (item.section || null) === (selectedSection || null); });
      if (!entry) { clearView("Timetable currently unavailable."); return; }
      title.textContent = entry.title + " - Year " + entry.year + (entry.section ? " - Section " + entry.section : "") + " Timetable";
      frame.src = Site.pageBase + "website raw data/timetable_output/" + entry.path;
      view.hidden = false;
      status.textContent = "";
    };
    const renderYears = function () {
      yearSelect.replaceChildren(); selectedSection = null;
      const years = Array.from(new Set(selectedProgramme.entries.map(function (entry) { return entry.year; }))).sort(function (a, b) { return a - b; });
      years.forEach(function (year) {
        const option = document.createElement("option");
        option.value = String(year);
        option.textContent = "Year " + year;
        yearSelect.appendChild(option);
      });
      selectedYear = years[0] || null;
      if (selectedYear) renderSections(); else clearView("Timetable currently unavailable.");
    };
    const renderSections = function () {
      const sections = selectedProgramme.entries.filter(function (entry) { return entry.year === selectedYear && entry.section; }).sort(function (a, b) { return a.section.localeCompare(b.section, undefined, { numeric: true }); });
      sectionSelect.replaceChildren();
      sectionField.hidden = sections.length < 2;
      selectedSection = sections.length === 1 ? sections[0].section : null;
      sections.forEach(function (entry) {
        const option = document.createElement("option");
        option.value = entry.section;
        option.textContent = "Section " + entry.section;
        sectionSelect.appendChild(option);
      });
      if (sections.length > 1) selectedSection = sections[0].section;
      showTimetable();
    };
    const renderProgrammes = function () {
      programmeSelect.replaceChildren();
      programmes.forEach(function (programme, index) {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = programme.label;
        programmeSelect.appendChild(option);
      });
      if (!programmes.length) { clearView("Timetable currently unavailable."); return; }
      selectedProgramme = programmes[0];
      renderYears();
    };

    programmeSelect.addEventListener("change", function () {
      selectedProgramme = programmes[Number(programmeSelect.value)];
      renderYears();
    });
    yearSelect.addEventListener("change", function () {
      selectedYear = Number(yearSelect.value);
      renderSections();
    });
    sectionSelect.addEventListener("change", function () {
      selectedSection = sectionSelect.value;
      showTimetable();
    });
    fetch(manifestPath).then(function (response) {
      if (!response.ok) throw new Error("Timetable manifest unavailable");
      return response.json();
    }).then(function (entries) {
      const byProgramme = {};
      entries.forEach(function (entry) {
        if (!byProgramme[entry.programme]) byProgramme[entry.programme] = { label: programmeNames[entry.programme] || entry.title, entries: [] };
        byProgramme[entry.programme].entries.push(entry);
      });
      programmes = Object.keys(byProgramme).map(function (key) { return byProgramme[key]; });
      renderProgrammes();
    }).catch(function () { clearView("Timetable currently unavailable."); });
  });
})();
