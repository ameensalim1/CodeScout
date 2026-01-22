const captureButton = document.getElementById("capture");
const statusEl = document.getElementById("status");

function setStatus(message, isError) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b00020" : "#333";
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function requestSnapshot() {
  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    throw new Error("No active tab found.");
  }

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    func: async () => {
      const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
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
          await sleep(80);
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
  });

  if (!result || typeof result.result === "undefined") {
    throw new Error("Capture failed.");
  }

  return result.result;
}

captureButton.addEventListener("click", async () => {
  setStatus("");
  captureButton.disabled = true;
  try {
    const payload = await requestSnapshot();
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setStatus("Snapshot copied to clipboard.");
  } catch (error) {
    setStatus(error.message || "Snapshot failed.", true);
  } finally {
    captureButton.disabled = false;
  }
});
