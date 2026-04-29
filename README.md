# DocxViewer

Preview DOCX files quickly inside VS Code.

![DocxViewer banner](docxviewerext-banner.png)

## Features

- Command: `DOCX Viewer: Open File`
- Right-click `.docx` in Explorer and open directly from the context menu
- Open selected DOCX in an in-extension preview panel
- Commands: `DOCX Viewer: Zoom In`, `DOCX Viewer: Zoom Out`, `DOCX Viewer: Reset Zoom`
- Zoom shortcut in preview: `Cmd + Mouse Wheel` (macOS), `Ctrl + Mouse Wheel` (Windows/Linux)

## Extension Settings

- `docxviewerext.openToSide`: Open DOCX preview in side editor.
- `docxviewerext.preserveFocus`: Keep focus in current editor after opening preview.

## Scripts

- `npm run compile`: Compile TypeScript
- `npm run watch`: Watch and compile on changes
- `npm run lint`: Run ESLint
- `npm test`: Run extension tests

## Run locally

1. Install dependencies: `npm install`
2. Press `F5` in VS Code to launch Extension Development Host
3. Open using either:
   - Explorer right-click on a `.docx` file -> `DOCX Viewer: Open File`
   - Command Palette -> `DOCX Viewer: Open File`

## Publish

1. Install VSCE globally: `npm i -g @vscode/vsce`
2. Login once: `vsce login michaelsam94`
3. Publish: `vsce publish`
