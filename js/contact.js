(function () {
  "use strict";
  const form = document.getElementById("contact-form");
  if (!form) return;
  Site.onReady(function () {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const recipient = form.getAttribute("data-contact-email") || Site.config().email; const fields = new FormData(form); const subject = "College enquiry: " + fields.get("topic"); const body = "Name: " + fields.get("name") + "\nEmail: " + fields.get("email") + "\nTopic: " + fields.get("topic") + "\n\n" + fields.get("message");
      try { const request = indexedDB.open("mjptbcwrdcw-development", 1); request.onupgradeneeded = function () { request.result.createObjectStore("imports", { keyPath: "id", autoIncrement: true }); }; request.onsuccess = function () { request.result.transaction("imports", "readwrite").objectStore("imports").put({ type: "contact", fileName: "contact-form", data: { name: fields.get("name"), email: fields.get("email"), topic: fields.get("topic"), message: fields.get("message") }, approved: false, importedAt: new Date().toISOString() }); }; } catch (error) { }
      window.location.href = "mailto:" + recipient + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      const success = document.getElementById("form-success"); if (success) { success.classList.add("show"); success.focus(); }
    });
  });
})();
