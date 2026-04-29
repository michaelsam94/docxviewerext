import * as vscode from "vscode";
import * as path from "node:path";
import mammoth from "mammoth";

let currentPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
  const openDisposable = vscode.commands.registerCommand(
    "docxviewerext.openDocxFile",
    async (resource?: vscode.Uri) => {
      const sourceUri = await resolveSourceUri(resource);
      if (!sourceUri) {
        return;
      }

      const config = vscode.workspace.getConfiguration("docxviewerext");
      const openToSide = config.get<boolean>("openToSide", true);
      const preserveFocus = config.get<boolean>("preserveFocus", false);

      try {
        const result = await mammoth.convertToHtml({ path: sourceUri.fsPath });
        const viewColumn = openToSide
          ? vscode.ViewColumn.Beside
          : vscode.ViewColumn.Active;
        const panel = vscode.window.createWebviewPanel(
          "docxviewerext.preview",
          `DOCX Viewer: ${path.basename(sourceUri.fsPath)}`,
          { viewColumn, preserveFocus },
          {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.dirname(sourceUri.fsPath))]
          }
        );

        panel.webview.html = getDocxViewerHtml(
          path.basename(sourceUri.fsPath),
          sanitizeMammothHtml(result.value)
        );
        currentPanel = panel;
        panel.onDidDispose(() => {
          if (currentPanel === panel) {
            currentPanel = undefined;
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`DOCX open failed: ${message}`);
      }
    }
  );

  const zoomInDisposable = vscode.commands.registerCommand(
    "docxviewerext.zoomIn",
    () => sendZoomCommand("zoomIn")
  );
  const zoomOutDisposable = vscode.commands.registerCommand(
    "docxviewerext.zoomOut",
    () => sendZoomCommand("zoomOut")
  );
  const resetZoomDisposable = vscode.commands.registerCommand(
    "docxviewerext.resetZoom",
    () => sendZoomCommand("resetZoom")
  );

  context.subscriptions.push(
    openDisposable,
    zoomInDisposable,
    zoomOutDisposable,
    resetZoomDisposable
  );
}

async function resolveSourceUri(
  resource?: vscode.Uri
): Promise<vscode.Uri | undefined> {
  if (resource && resource.fsPath.toLowerCase().endsWith(".docx")) {
    return resource;
  }

  const selection = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: "Open DOCX in Viewer",
    filters: {
      "Word Documents": ["docx"]
    }
  });

  if (!selection || selection.length === 0) {
    return undefined;
  }

  return selection[0];
}

function getDocxViewerHtml(title: string, bodyHtml: string): string {
  const safeTitle = escapeHtml(title);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: https: http:;">
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #1e1e1e;
        color: #e6edf3;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #container {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        overflow: auto;
        padding: 24px;
      }
      #content {
        max-width: 960px;
        margin: 0 auto;
        background: #111827;
        border: 1px solid #374151;
        border-radius: 10px;
        padding: 28px;
        transform-origin: top center;
      }
      h1, h2, h3 { margin-top: 1.2em; }
      p { line-height: 1.6; }
      a { color: #60a5fa; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #4b5563; padding: 8px; text-align: left; }
      img { max-width: 100%; }
      .hint {
        position: fixed;
        top: 12px;
        right: 12px;
        background: rgba(0, 0, 0, 0.75);
        padding: 8px 12px;
        border-radius: 6px;
        z-index: 2;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="hint">Zoom: Ctrl/Cmd + Mouse Wheel</div>
    <div id="container">
      <article id="content">${bodyHtml}</article>
    </div>
    <script>
      const content = document.getElementById("content");
      let zoom = 1;

      function applyZoom() {
        content.style.transform = "scale(" + zoom + ")";
      }

      function setZoom(nextZoom) {
        const clamped = Math.min(3, Math.max(0.4, nextZoom));
        if (Math.abs(clamped - zoom) < 0.001) {
          return;
        }
        zoom = clamped;
        applyZoom();
      }

      window.addEventListener("wheel", (event) => {
        if (!(event.ctrlKey || event.metaKey)) {
          return;
        }
        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        setZoom(zoom + delta);
      }, { passive: false });

      window.addEventListener("keydown", (event) => {
        if (!(event.ctrlKey || event.metaKey)) {
          return;
        }
        if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          setZoom(zoom + 0.1);
        } else if (event.key === "-") {
          event.preventDefault();
          setZoom(zoom - 0.1);
        } else if (event.key === "0") {
          event.preventDefault();
          setZoom(1);
        }
      });

      window.addEventListener("message", (event) => {
        const command = event.data?.command;
        if (command === "zoomIn") {
          setZoom(zoom + 0.1);
        } else if (command === "zoomOut") {
          setZoom(zoom - 0.1);
        } else if (command === "resetZoom") {
          setZoom(1);
        }
      });
    </script>
  </body>
</html>`;
}

function sanitizeMammothHtml(html: string): string {
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sendZoomCommand(command: "zoomIn" | "zoomOut" | "resetZoom"): void {
  if (!currentPanel) {
    vscode.window.showWarningMessage(
      "Open a DOCX file in DOCX Viewer first to use zoom commands."
    );
    return;
  }
  currentPanel.webview.postMessage({ command });
}

export function deactivate() {}
