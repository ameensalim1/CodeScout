(function () {
  async function buildSnapshot() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "CAPTURE_SNAPSHOT" }, response => {
        if (!response || !response.ok) {
          reject(new Error(response && response.error ? response.error : "Capture failed."));
          return;
        }
        resolve(response.payload);
      });
    });
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
        const payload = await buildSnapshot();
        await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        alert("Snapshot copied to clipboard");
      } catch (error) {
        alert(error.message || "Snapshot failed.");
      }
    };

    document.body.appendChild(btn);
  }

  if (document.body) addButton();
  else window.addEventListener("load", addButton);
})();
