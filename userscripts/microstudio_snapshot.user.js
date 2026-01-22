// ==UserScript==
// @name         Microstudio Snapshot (all files)
// @namespace    coach
// @version      0.5
// @match        *://microstudio.dev/*
// @match        *://*.microstudio.dev/*
// @match        *://microstudio.io/*
// @match        *://*.microstudio.io/*
// @match        *://pixelpad.io/app/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  function captureMicrostudio() {
    const editorEl = document.getElementById("editor-view");
    const getCode = () => {
      if (editorEl && editorEl.env && editorEl.env.editor && editorEl.env.editor.getValue) {
        return editorEl.env.editor.getValue();
      }
      if (window.ace && editorEl) {
        return window.ace.edit(editorEl).getValue();
      }
      const textLayer = editorEl ? editorEl.querySelector(".ace_text-layer") : null;
      return textLayer ? textLayer.innerText : "";
    };

    const fileEls = Array.from(document.querySelectorAll("#sourcelist .asset-box-source"));
    const files = [];
    const clickEach = async () => {
      for (const el of fileEls) {
        el.click();
        await new Promise(r => setTimeout(r, 80));
        const name = (el.innerText || "").trim() || el.getAttribute("title") || "main";
        files.push({ path: name, contents: getCode() });
      }
    };

    return clickEach().then(() => ({ files }));
  }

  function capturePixelpad() {
    const models = window.monaco && window.monaco.editor
      ? window.monaco.editor.getModels()
      : [];
    const files = models.map(model => ({
      path: model.uri ? model.uri.toString() : model.id,
      contents: model.getValue()
    }));

    const entryPoints = {};
    for (const file of files) {
      if (file.path === "Game.start") entryPoints.start = file.contents;
      if (file.path === "Game.loop") entryPoints.loop = file.contents;
    }

    return Promise.resolve({ files, entryPoints });
  }

  function addButton() {
    if (document.getElementById("__snapshot_button")) return;
    const btn = document.createElement("button");
    btn.id = "__snapshot_button";
    btn.textContent = "Snapshot";

    btn.style.position = "fixed";
    btn.style.bottom = "16px";
    btn.style.right = "16px";
    btn.style.zIndex = "2147483647";
    btn.style.padding = "8px 12px";
    btn.style.fontSize = "14px";
    btn.style.background = "#ffd166";
    btn.style.color = "#111";
    btn.style.border = "0";
    btn.style.borderRadius = "6px";
    btn.style.cursor = "pointer";

    btn.onclick = async () => {
      try {
        const isPixelpad = window.location.host === "pixelpad.io";
        const projectName = (document.title || (isPixelpad ? "pixelpad-project" : "microstudio-project")).trim();
        const lastStudent = localStorage.getItem("snapshotStudent") || "";
        const student = prompt("Student name (optional):", lastStudent) || "";
        if (student) localStorage.setItem("snapshotStudent", student);

        const capture = isPixelpad ? capturePixelpad : captureMicrostudio;
        const result = await capture();

        const payload = {
          schema: "student-project-snapshot/v1",
          platform: isPixelpad ? "pixelpad" : "microstudio",
          projectName,
          student,
          capturedAt: new Date().toISOString(),
          files: result.files,
          entry_points: result.entryPoints || {}
        };

        await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        alert("Snapshot copied to clipboard");
      } catch (e) {
        alert("Snapshot failed: " + e.message);
      }
    };

    document.body.appendChild(btn);
  }

  if (document.body) addButton();
  else window.addEventListener("load", addButton);
})();
