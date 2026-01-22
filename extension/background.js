chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "CAPTURE_SNAPSHOT") return;

  const tabId = sender && sender.tab ? sender.tab.id : null;
  if (!tabId) {
    sendResponse({ ok: false, error: "No active tab found." });
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: () => {
      const isPixelpad = window.location.host === "pixelpad.io";
      const projectName = (document.title || (isPixelpad ? "pixelpad-project" : "microstudio-project")).trim();

      if (isPixelpad && window.monaco && window.monaco.editor) {
        const models = window.monaco.editor.getModels();
        const files = models.map(model => ({
          path: model.uri ? model.uri.toString() : model.id,
          contents: model.getValue()
        }));
        const entryPoints = {};
        for (const file of files) {
          if (file.path === "Game.start") entryPoints.start = file.contents;
          if (file.path === "Game.loop") entryPoints.loop = file.contents;
        }
        return {
          schema: "student-project-snapshot/v1",
          platform: "pixelpad",
          projectName,
          capturedAt: new Date().toISOString(),
          files,
          entry_points: entryPoints
        };
      }

      const editorEl = document.getElementById("editor-view");
      if (!editorEl) {
        throw new Error("Editor not found. Open a Microstudio or Pixelpad project.");
      }

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
      if (fileEls.length === 0) {
        files.push({ path: "main", contents: getCode() });
      } else {
        for (const el of fileEls) {
          el.click();
          const name = (el.innerText || "").trim() || el.getAttribute("title") || "main";
          files.push({ path: name, contents: getCode() });
        }
      }

      return {
        schema: "student-project-snapshot/v1",
        platform: "microstudio",
        projectName,
        capturedAt: new Date().toISOString(),
        files,
        entry_points: {}
      };
    }
  }, results => {
    const err = chrome.runtime.lastError;
    if (err) {
      sendResponse({ ok: false, error: err.message });
      return;
    }
    if (!results || !results[0]) {
      sendResponse({ ok: false, error: "Capture failed." });
      return;
    }
    sendResponse({ ok: true, payload: results[0].result });
  });

  return true;
});
