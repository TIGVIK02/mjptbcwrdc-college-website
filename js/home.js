(function () {
  "use strict";
  if (!document.getElementById("leadership-grid") && !document.getElementById("student-strength") && !document.querySelector("[data-carousel]")) return;

  Site.onReady(function () {
    const pageBase = Site.pageBase;
    const initializeCarousel = function (carousel, interval) {
      if (!carousel) return;
      const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));
      if (!slides.length) return;
      let current = 0; let timer; let touchStartX = 0; const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const showSlide = function (index) { current = (index + slides.length) % slides.length; const track = carousel.querySelector(".carousel-track"); if (track) track.style.transform = "translateX(-" + current * 100 + "%)"; slides.forEach(function (slide, slideIndex) { const active = slideIndex === current; slide.classList.toggle("is-active", active); slide.hidden = !active; slide.setAttribute("aria-hidden", String(!active)); }); };
      const stop = function () { window.clearInterval(timer); };
      const start = function () { stop(); if (!reducedMotion && slides.length > 1) timer = window.setInterval(function () { showSlide(current + 1); }, interval); };
      const previous = carousel.querySelector(".carousel-prev"); const next = carousel.querySelector(".carousel-next");
      if (previous) previous.addEventListener("click", function () { showSlide(current - 1); start(); });
      if (next) next.addEventListener("click", function () { showSlide(current + 1); start(); });
      carousel.addEventListener("mouseenter", stop); carousel.addEventListener("mouseleave", start); carousel.addEventListener("focusin", stop); carousel.addEventListener("focusout", function (event) { if (!carousel.contains(event.relatedTarget)) start(); });
      carousel.addEventListener("keydown", function (event) { if (event.key === "ArrowLeft") { showSlide(current - 1); start(); } if (event.key === "ArrowRight") { showSlide(current + 1); start(); } });
      carousel.addEventListener("touchstart", function (event) { touchStartX = event.changedTouches[0].clientX; stop(); }, { passive: true }); carousel.addEventListener("touchend", function (event) { const distance = event.changedTouches[0].clientX - touchStartX; if (Math.abs(distance) > 40) showSlide(current + (distance < 0 ? 1 : -1)); start(); }, { passive: true });
      showSlide(0); start();
    };

    const leadershipMount = document.getElementById("leadership-grid");
    if (leadershipMount) {
      Site.loadData("data/leadership.txt", "text").then(function (text) {
        const records = Site.parseKeyValueBlocks(text).filter(function (record) { return (record.ROLE || "").toLowerCase() !== "principal"; });
        leadershipMount.replaceChildren();
        records.forEach(function (record, index) {
          const slide = document.createElement("article"); slide.className = "carousel-slide leadership-slide"; slide.setAttribute("role", "group"); slide.setAttribute("aria-roledescription", "slide"); slide.setAttribute("aria-label", index + 1 + " of " + records.length); slide.hidden = index !== 0;
          const portrait = document.createElement("div"); portrait.className = "leadership-portrait";
          if (record.IMAGE) { const image = document.createElement("img"); image.src = pageBase + record.IMAGE; image.alt = "Official portrait of " + (record.NAME || record.ROLE); image.onerror = function () { image.remove(); portrait.classList.add("is-placeholder"); }; portrait.appendChild(image); } else { portrait.classList.add("is-placeholder"); const label = document.createElement("span"); label.textContent = "OFFICIAL IMAGE TO BE UPDATED"; portrait.appendChild(label); }
          const copy = document.createElement("div"); copy.className = "leadership-copy"; const role = document.createElement("p"); role.className = "eyebrow"; role.textContent = record.ROLE || "LEADERSHIP"; const name = document.createElement("h3"); name.textContent = record.NAME || "Information to be updated"; const designation = document.createElement("p"); designation.className = "leadership-designation"; designation.textContent = record.DESIGNATION || "Information to be updated"; const message = document.createElement("p"); message.className = "leadership-message"; message.textContent = record.DESCRIPTION || record.MESSAGE || "Institutional leadership information."; copy.append(role, name, designation, message); slide.append(portrait, copy); leadershipMount.appendChild(slide);
        });
        initializeCarousel(document.querySelector("[data-leadership-carousel]"), 6000);
      }).catch(function () { leadershipMount.innerHTML = "<div class=\"carousel-slide\"><p class=\"empty-state\">Leadership information is temporarily unavailable.</p></div>"; });
    }

    const strengthMount = document.getElementById("student-strength");
    if (strengthMount) Site.loadData("data/students.txt", "text").then(function (text) {
      const records = Site.parseKeyValueBlocks(text).filter(function (record) { return record.YEAR; });
      let overallTotal = 0;
      strengthMount.replaceChildren();
      records.forEach(function (record) {
        const card = document.createElement("article"); card.className = "strength-card";
        const title = document.createElement("h3"); const yearNumber = Number(record.YEAR); title.textContent = yearNumber === 1 ? "1st Year" : yearNumber === 2 ? "2nd Year" : yearNumber === 3 ? "3rd Year" : "Year " + record.YEAR;
        const table = document.createElement("table"); table.innerHTML = "<thead><tr><th>Programme</th><th>Students</th></tr></thead><tbody></tbody>";
        const body = table.querySelector("tbody"); let yearTotal = 0;
        Object.keys(record).forEach(function (key) {
          if (["YEAR", "TOTAL", "OVERALL_TOTAL"].includes(key) || !/^\d+$/.test(record[key])) return;
          const value = Number(record[key]); yearTotal += value;
          const row = document.createElement("tr"); row.innerHTML = "<td></td><td></td>"; row.cells[0].textContent = key; row.cells[1].textContent = record[key]; body.appendChild(row);
        });
        overallTotal += yearTotal;
        const total = document.createElement("p"); total.className = "year-total"; total.textContent = "Total: " + yearTotal + " students";
        card.append(title, table, total); strengthMount.appendChild(card);
      });
      const overall = document.createElement("p"); overall.className = "strength-overall"; overall.innerHTML = "<strong></strong>"; overall.firstElementChild.textContent = "Overall total: " + overallTotal + " students"; strengthMount.parentElement.appendChild(overall);
      strengthMount.setAttribute("aria-busy", "false");
    }).catch(function () { strengthMount.setAttribute("aria-busy", "false"); strengthMount.innerHTML = "<p class=\"empty-state\">Current student strength is unavailable.</p>"; });

    initializeCarousel(document.querySelector("[data-carousel]"), 5000);
    initializeCarousel(document.querySelector("[data-campus-carousel]"), 5500);
  });
})();
