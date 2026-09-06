(function () {
  "use strict";
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  if (!lightbox || !lightboxImg) return;
  Site.onReady(function () {
    document.querySelectorAll("[data-lightbox]").forEach(function (link) { link.addEventListener("click", function (event) { event.preventDefault(); lightboxImg.src = link.getAttribute("href"); lightbox.classList.add("open"); }); });
    lightbox.addEventListener("click", function () { lightbox.classList.remove("open"); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") lightbox.classList.remove("open"); });
  });
})();
