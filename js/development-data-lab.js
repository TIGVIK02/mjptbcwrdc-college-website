(function () {
  "use strict";
  const databaseName = "mjptbcwrdcw-development";
  const storeName = "imports";
  const requiredFields = {
    faculty: ["faculty_profile_number", "Name", "Department"],
    students: ["YEAR"],
    notices: ["title", "file", "updated"],
    "notice-pdf": [],
    image: [],
    results: ["ACADEMIC_YEAR", "PROGRAMME"],
    pyq: ["SUBJECT", "PDF"]
  };
  const labels = { faculty: "Faculty CSV", students: "Student strength TXT", notices: "Notice index JSON", "notice-pdf": "Notice PDF", image: "Image asset", results: "Result analysis TXT", pyq: "Question paper metadata TXT", contact: "Contact enquiry" };
  const datasetType = document.getElementById("dataset-type");
  const fileInput = document.getElementById("data-file");
  const importButton = document.getElementById("import-button");
  const statusMount = document.getElementById("import-status");
  const workflowDetail = document.getElementById("workflow-detail");
  const recordList = document.getElementById("record-list");
  const publicPreview = document.getElementById("public-preview");
  const steps = Array.from(document.querySelectorAll("[data-step]"));
  let database;

  const openDatabase = function () {
    return new Promise(function (resolve, reject) {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = function () { request.result.createObjectStore(storeName, { keyPath: "id", autoIncrement: true }); };
      request.onsuccess = function () { database = request.result; resolve(database); };
      request.onerror = function () { reject(request.error); };
    });
  };
  const transaction = function (mode) { return database.transaction(storeName, mode).objectStore(storeName); };
  const getAll = function () { return new Promise(function (resolve, reject) { const request = transaction("readonly").getAll(); request.onsuccess = function () { resolve(request.result); }; request.onerror = function () { reject(request.error); }; }); };
  const put = function (record) { return new Promise(function (resolve, reject) { const request = transaction("readwrite").put(record); request.onsuccess = function () { resolve(request.result); }; request.onerror = function () { reject(request.error); }; }); };
  const remove = function (id) { return new Promise(function (resolve, reject) { const request = transaction("readwrite").delete(id); request.onsuccess = resolve; request.onerror = function () { reject(request.error); }; }); };
  const clear = function () { return new Promise(function (resolve, reject) { const request = transaction("readwrite").clear(); request.onsuccess = resolve; request.onerror = function () { reject(request.error); }; }); };

  const setWorkflow = function (completed, detail) {
    const order = ["input", "upload", "validate", "parse", "store", "review", "display"];
    steps.forEach(function (step) { const index = order.indexOf(step.dataset.step); step.classList.toggle("is-complete", index < completed); step.classList.toggle("is-current", index === completed); });
    workflowDetail.textContent = detail;
  };
  const showStatus = function (message, error) { statusMount.hidden = false; statusMount.classList.toggle("is-error", Boolean(error)); statusMount.textContent = message; };
  const parseKeyValue = function (text) {
    return text.split(/\r?\n\s*\r?\n/).map(function (block) {
      const record = {};
      block.split(/\r?\n/).forEach(function (line) { const separator = line.indexOf("="); if (separator > 0 && !line.trim().startsWith("#")) record[line.slice(0, separator).trim()] = line.slice(separator + 1).trim(); });
      return record;
    }).filter(function (record) { return Object.keys(record).length; });
  };
  const parseCsv = function (text) {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (!lines.length) throw new Error("The CSV file is empty.");
    const headers = lines.shift().split(",").map(function (value) { return value.trim(); });
    const records = lines.map(function (line, index) { const values = line.split(",").map(function (value) { return value.trim(); }); const record = {}; headers.forEach(function (header, headerIndex) { record[header] = values[headerIndex] || ""; }); record._row = index + 2; return record; });
    return { headers: headers, records: records };
  };
  const parseJson = function (text) { let value; try { value = JSON.parse(text); } catch (error) { throw new Error("The JSON file is malformed."); } if (!Array.isArray(value)) throw new Error("Expected a JSON array of records."); return { headers: Object.keys(value[0] || {}), records: value }; };
  const validateRecords = function (type, records, headers) {
    const errors = [];
    const required = requiredFields[type]; required.forEach(function (field) { if (headers.indexOf(field) === -1 && !records.some(function (record) { return record[field]; })) errors.push("Missing required field: " + field); });
    records.forEach(function (record, index) { required.forEach(function (field) { if (!record[field]) errors.push("Record " + (record._row || index + 1) + " is missing " + field + "."); }); });
    if (type === "faculty") { const ids = {}; records.forEach(function (record) { if (record.faculty_profile_number) { if (ids[record.faculty_profile_number]) errors.push("Duplicate faculty profile number: " + record.faculty_profile_number); ids[record.faculty_profile_number] = true; } }); }
    if (type === "notices") records.forEach(function (record, index) { if (Number.isNaN(new Date(record.updated).getTime())) errors.push("Notice " + (index + 1) + " has an invalid updated date."); });
    return errors;
  };
  const readablePdfText = function (buffer) { return new TextDecoder().decode(buffer).replace(/[^\x20-\x7E\r\n]+/g, " ").replace(/\s+/g, " ").trim(); };
  const parseFile = function (type, file) {
    return file.arrayBuffer().then(function (buffer) {
      if (!file.size) throw new Error("The selected file is empty.");
      if (type === "notice-pdf") { if (new Uint8Array(buffer.slice(0, 5)).toString() !== "37,80,68,70,45") throw new Error("The file is not a readable PDF."); return { headers: ["file", "extracted_text"], records: [{ file: file.name, extracted_text: readablePdfText(buffer).slice(0, 500) }], binary: buffer }; }
      if (type === "image") { if (!/^image\//.test(file.type) && !/\.svg$/i.test(file.name)) throw new Error("Expected an image or SVG file."); return { headers: ["file", "media_type", "size"], records: [{ file: file.name, media_type: file.type || "image/svg+xml", size: file.size + " bytes" }], binary: buffer }; }
      return file.text().then(function (text) { if (type === "faculty") return parseCsv(text); if (type === "notices") return parseJson(text); return { headers: Object.keys(parseKeyValue(text)[0] || {}), records: parseKeyValue(text) }; });
    });
  };
  const publicText = function (record) {
    if (record.type === "faculty") return (record.data.Name || "Faculty profile") + " - " + (record.data.Department || "Department to be supplied") + " - " + (record.data.Designation || "Designation to be supplied");
    if (record.type === "notices") return (record.data.title || "Notice") + " - " + (record.data.updated || "Date to be supplied");
    if (record.type === "notice-pdf") return "PDF extracted text: " + (record.data.extracted_text || "No readable text layer found.");
    if (record.type === "image") return "Image ready for gallery review: " + record.data.file;
    if (record.type === "contact") return "Enquiry from " + (record.data.name || "Unnamed visitor") + " about " + (record.data.topic || "General enquiry") + ". Review before any operational response.";
    return Object.keys(record.data).filter(function (key) { return key.charAt(0) !== "_"; }).map(function (key) { return key + ": " + record.data[key]; }).join(" | ");
  };
  const renderPreview = function (records) {
    const approved = records.filter(function (record) { return record.approved; }); publicPreview.replaceChildren();
    if (!approved.length) { publicPreview.innerHTML = '<p class="muted">Approve an imported record to preview its public-facing output.</p>'; return; }
    approved.forEach(function (record) { const card = document.createElement("article"); card.className = "resource-card"; const title = document.createElement("h3"); title.textContent = labels[record.type]; const text = document.createElement("p"); text.textContent = publicText(record); card.append(title, text); if (record.type === "image" && record.binary) { const image = document.createElement("img"); image.src = URL.createObjectURL(new Blob([record.binary], { type: record.data.media_type || "image/svg+xml" })); image.alt = "Approved development sample"; image.className = "dev-preview-image"; card.appendChild(image); } publicPreview.appendChild(card); });
  };
  const renderRecords = function () {
    getAll().then(function (records) {
      recordList.replaceChildren(); if (!records.length) { recordList.innerHTML = '<p class="muted">No development records have been imported.</p>'; renderPreview(records); return; }
      records.forEach(function (record) { const card = document.createElement("article"); card.className = "dev-record"; const heading = document.createElement("h3"); heading.textContent = labels[record.type] + " - " + record.fileName; const state = document.createElement("p"); state.className = "dev-record-state"; state.textContent = record.approved ? "APPROVED FOR DEVELOPMENT PREVIEW" : "PENDING ADMINISTRATOR REVIEW"; const raw = document.createElement("pre"); raw.textContent = JSON.stringify(record.data, null, 2); const edit = document.createElement("textarea"); edit.value = JSON.stringify(record.data, null, 2); edit.setAttribute("aria-label", "Edit imported record"); const actions = document.createElement("div"); actions.className = "resource-actions"; const save = document.createElement("button"); save.className = "archive-button"; save.type = "button"; save.textContent = "SAVE EDIT"; const approve = document.createElement("button"); approve.className = "archive-button"; approve.type = "button"; approve.textContent = record.approved ? "UNAPPROVE" : "APPROVE FOR PREVIEW"; const removeButton = document.createElement("button"); removeButton.className = "archive-button"; removeButton.type = "button"; removeButton.textContent = "DELETE"; save.addEventListener("click", function () { try { record.data = JSON.parse(edit.value); put(record).then(renderRecords); } catch (error) { alert("Edit is not valid JSON."); } }); approve.addEventListener("click", function () { record.approved = !record.approved; put(record).then(renderRecords); }); removeButton.addEventListener("click", function () { remove(record.id).then(renderRecords); }); actions.append(save, approve, removeButton); card.append(heading, state, raw, edit, actions); recordList.appendChild(card); }); renderPreview(records);
    });
  };
  const importFile = function () {
    const file = fileInput.files[0]; if (!file) { showStatus("Choose a file before importing.", true); setWorkflow(0, "No input file selected."); return; }
    const type = datasetType.value; setWorkflow(1, "Selected " + file.name + " as " + labels[type] + ".");
    if (type === "notice-pdf" && file.type && file.type !== "application/pdf") { showStatus("Wrong file type: choose a PDF.", true); setWorkflow(2, "Validation stopped because the selected file is not a PDF."); return; }
    parseFile(type, file).then(function (parsed) { setWorkflow(2, "File type, required fields, empty-file state, and duplicate rules are being checked."); const errors = validateRecords(type, parsed.records, parsed.headers); if (errors.length) throw new Error(errors.join(" ")); setWorkflow(3, "Parsed " + parsed.records.length + " record(s). PDF text was extracted from the local file and images were retained as binary data."); const records = parsed.records.map(function (data) { const record = { type: type, fileName: file.name, data: data, approved: false, importedAt: new Date().toISOString() }; if (parsed.binary) record.binary = parsed.binary; return record; }); return Promise.all(records.map(function (record) { return put(record); })); }).then(function () { setWorkflow(4, "Stored in the browser IndexedDB development database. No production file or server database was changed."); showStatus("Import succeeded. The record is waiting for administrator review.", false); setWorkflow(5, "Review the extracted record below, edit its JSON if needed, then approve it for the public preview."); renderRecords(); }).catch(function (error) { showStatus(error.message || "The file could not be imported.", true); setWorkflow(2, "Import stopped safely. No invalid record was stored."); });
  };
  importButton.addEventListener("click", importFile);
  document.getElementById("clear-data").addEventListener("click", function () { clear().then(renderRecords); });
  openDatabase().then(renderRecords).catch(function () { showStatus("IndexedDB is unavailable in this browser. The development database cannot be opened.", true); });
})();
