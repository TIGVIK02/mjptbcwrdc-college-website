(function () {
  "use strict";
  const carousel = document.getElementById("gallery-carousel");
  const categoriesMount = document.getElementById("gallery-categories");
  const track = document.getElementById("gallery-track");
  const status = document.getElementById("gallery-status");
  if (!carousel || !categoriesMount || !track) return;

  Site.onReady(function () {
    let current = 0; let timer; let touchStartX = 0; let items = [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const show = function (index) {
      if (!items.length) return;
      current = (index + items.length) % items.length;
      Array.from(track.children).forEach(function (slide, slideIndex) { const active = slideIndex === current; slide.hidden = !active; slide.classList.toggle("is-active", active); slide.setAttribute("aria-hidden", String(!active)); });
    };
    const stop = function () { window.clearInterval(timer); };
    const start = function () { stop(); if (!reducedMotion && items.length > 1) timer = window.setInterval(function () { show(current + 1); }, 5000); };
    const render = function (files) {
      stop(); items = files || []; current = 0; track.replaceChildren();
      items.forEach(function (path, index) {
        const slide = document.createElement("div"); slide.className = "carousel-slide"; slide.hidden = index !== 0; slide.setAttribute("role", "group"); slide.setAttribute("aria-roledescription", "slide"); slide.setAttribute("aria-label", index + 1 + " of " + items.length);
        const removeFailedSlide = function () { slide.remove(); items = items.filter(function (item) { return item !== path; }); if (!items.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No gallery items available."; track.replaceChildren(empty); stop(); } else { show(Math.min(current, items.length - 1)); } };
        if (/\.pdf$/i.test(path)) { const frame = document.createElement("iframe"); frame.src = Site.pageBase + path; frame.title = "Gallery PDF " + (index + 1); frame.loading = "lazy"; frame.addEventListener("error", removeFailedSlide); slide.appendChild(frame); } else { const image = document.createElement("img"); image.src = Site.pageBase + path; image.alt = "Gallery photograph " + (index + 1); image.loading = "lazy"; image.addEventListener("error", removeFailedSlide); slide.appendChild(image); }
        track.appendChild(slide);
      });
      if (!items.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No gallery items available."; track.appendChild(empty); }
      show(0); start();
    };
    const selectCategory = function (button, category) { categoriesMount.querySelectorAll("button").forEach(function (item) { item.classList.toggle("is-selected", item === button); }); render(category.files); };
    Site.loadData("data/media-manifest.json", "json").then(function (manifest) {
      const categories = manifest.gallery || [];
      categoriesMount.replaceChildren();
      if (!categories.length) { status.hidden = false; carousel.hidden = true; return; }
      categories.forEach(function (category, index) { const button = document.createElement("button"); button.type = "button"; button.className = "gallery-category"; button.textContent = String(category.category || "Gallery").toUpperCase(); button.addEventListener("click", function () { selectCategory(button, category); }); categoriesMount.appendChild(button); if (index === 0) selectCategory(button, category); });
    }).catch(function () { status.hidden = false; carousel.hidden = true; });
    carousel.querySelector(".carousel-prev").addEventListener("click", function () { show(current - 1); start(); });
    carousel.querySelector(".carousel-next").addEventListener("click", function () { show(current + 1); start(); });
    carousel.addEventListener("mouseenter", stop); carousel.addEventListener("mouseleave", start); carousel.addEventListener("focusin", stop); carousel.addEventListener("focusout", function (event) { if (!carousel.contains(event.relatedTarget)) start(); });
    carousel.addEventListener("keydown", function (event) { if (event.key === "ArrowLeft") { show(current - 1); start(); } if (event.key === "ArrowRight") { show(current + 1); start(); } });
    carousel.addEventListener("touchstart", function (event) { touchStartX = event.changedTouches[0].clientX; stop(); }, { passive: true }); carousel.addEventListener("touchend", function (event) { const distance = event.changedTouches[0].clientX - touchStartX; if (Math.abs(distance) > 40) show(current + (distance < 0 ? 1 : -1)); start(); }, { passive: true });
  });
})();
