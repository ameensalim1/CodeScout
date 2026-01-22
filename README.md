# CodeScout

One-click project context capture for Microstudio and Pixelpad.

## Option A: Chrome extension (recommended)

Install from the Chrome Web Store: https://chromewebstore.google.com/detail/codescout/dpbagbbpdocodlodbeiibbeclgohjcma

1) Install from the Chrome Web Store: https://chromewebstore.google.com/detail/codescout/dpbagbbpdocodlodbeiibbeclgohjcma
2) Open a Microstudio or Pixelpad project.
3) Click the extension icon and press **Copy Snapshot**.

## Option B: Userscript (Tampermonkey)

1) Install Tampermonkey in Chrome.
2) Add `userscripts/microstudio_snapshot.user.js`.
3) Open a Microstudio or Pixelpad project and click the **Snapshot** button.

## Snapshot JSON format

```json
{
  "schema": "student-project-snapshot/v1",
  "platform": "microstudio",
  "projectName": "Project Name",
  "student": "Student Name",
  "capturedAt": "2026-01-12T21:35:42.875Z",
  "files": [
    { "path": "main", "contents": "..." }
  ],
  "entry_points": {}
}
```
