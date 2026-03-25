import { jsx, jsxs, Fragment } from "data:text/javascript,export const jsx=window.__SHIPSTUDIO_REACT__.createElement;export const jsxs=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;";
import { useEffect, useCallback, useState, useRef } from "data:text/javascript,export default window.__SHIPSTUDIO_REACT__;export const useState=window.__SHIPSTUDIO_REACT__.useState;export const useEffect=window.__SHIPSTUDIO_REACT__.useEffect;export const useCallback=window.__SHIPSTUDIO_REACT__.useCallback;export const useMemo=window.__SHIPSTUDIO_REACT__.useMemo;export const useRef=window.__SHIPSTUDIO_REACT__.useRef;export const useContext=window.__SHIPSTUDIO_REACT__.useContext;export const createElement=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;";
const STYLE_ID = "weweb-to-code-styles";
const PLUGIN_CSS = `
.ww2c-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.ww2c-modal {
  width: 480px;
  max-height: 60vh;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.ww2c-modal-header {
  display: flex;
  flex-direction: row;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
  align-items: center;
}

.ww2c-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.ww2c-modal-body::-webkit-scrollbar {
  display: none;
}

.ww2c-modal-title {
  font-size: 15px;
  font-weight: 600;
}

.ww2c-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
  display: block;
}

.ww2c-mode-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ww2c-mode-card {
  padding: 6px 8px;
  border-radius: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.ww2c-mode-card:hover {
  border-color: var(--text-muted);
}

.ww2c-mode-card.selected {
  border-color: var(--accent, #0d99ff);
}

.ww2c-mode-card-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.ww2c-mode-card-desc {
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.3;
}

.ww2c-progress {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ww2c-progress::before {
  content: '';
  width: 14px;
  height: 14px;
  border: 2px solid var(--border);
  border-top-color: var(--accent, #0d99ff);
  border-radius: 50%;
  animation: ww2c-spin 0.6s linear infinite;
}

.ww2c-progress-done {
  color: var(--text-primary);
  font-weight: 500;
}

.ww2c-progress-done::before {
  content: none;
}

.ww2c-error {
  font-size: 13px;
  color: #e53935;
  padding: 12px;
  background: rgba(229, 57, 53, 0.08);
  border-radius: 6px;
  line-height: 1.5;
}

@keyframes ww2c-spin {
  to { transform: rotate(360deg); }
}

.ww2c-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0 0;
}

.ww2c-results-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.ww2c-results-stats {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}

.ww2c-results-output {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ww2c-results-output-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ww2c-results-path {
  font-size: 11px;
  font-family: monospace;
  color: var(--text-muted);
  padding: 6px 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
}

.ww2c-btn-ghost {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
  text-align: center;
  width: 100%;
  transition: color 0.15s ease;
}

.ww2c-btn-ghost:hover {
  color: var(--text-secondary);
}

.ww2c-preserve-section {
  margin-top: 12px;
}

.ww2c-checklist {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ww2c-check-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-primary);
  padding: 3px 0;
  cursor: pointer;
  user-select: none;
}

.ww2c-checkbox {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1.5px solid var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.ww2c-checkbox.checked {
  background: var(--accent, #0d99ff);
  border-color: var(--accent, #0d99ff);
}

.ww2c-custom-notes {
  width: 100%;
  font-size: 11px;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 6px 8px;
  resize: vertical;
  min-height: 36px;
  box-sizing: border-box;
}

.ww2c-custom-notes::placeholder {
  color: var(--text-muted);
}

.ww2c-custom-notes:focus {
  outline: none;
  border-color: var(--accent, #0d99ff);
}

.ww2c-results-tip {
  font-size: 11px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  border-left: 2px solid var(--accent, #0d99ff);
  padding: 6px 8px;
  line-height: 1.4;
  border-radius: 0 4px 4px 0;
}

.ww2c-progress-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--bg-secondary);
  overflow: hidden;
  margin-bottom: 12px;
}

.ww2c-progress-fill {
  height: 100%;
  background: #4caf50;
  border-radius: 3px;
  transition: width 0.3s ease;
}

`;
function Modal({ open, onClose, title, headerRight, children }) {
  useEffect(() => {
    if (!open) return;
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = PLUGIN_CSS;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(STYLE_ID);
      if (el) el.remove();
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);
  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );
  if (!open) return null;
  return /* @__PURE__ */ jsx("div", { className: "ww2c-overlay", onClick: handleOverlayClick, children: /* @__PURE__ */ jsxs("div", { className: "ww2c-modal", children: [
    /* @__PURE__ */ jsxs("div", { className: "ww2c-modal-header", children: [
      /* @__PURE__ */ jsxs(
        "svg",
        {
          width: "16",
          height: "16",
          viewBox: "0 0 474 471",
          fill: "none",
          children: [
            /* @__PURE__ */ jsx("rect", { width: "473.647", height: "471", rx: "64", fill: "currentColor" }),
            /* @__PURE__ */ jsx("path", { d: "M131.181 235.583C99.8733 235.583 73.923 259.525 71.2443 290.497L65.7194 354.117H131.851L142.231 235.416H131.348L131.181 235.583Z", fill: "var(--bg-primary, #1a1a1a)" }),
            /* @__PURE__ */ jsx("path", { d: "M385.661 116.883C350.167 116.883 322.376 147.353 325.724 182.679L341.796 354.118H407.928L385.661 116.883Z", fill: "var(--bg-primary, #1a1a1a)" }),
            /* @__PURE__ */ jsx("path", { d: "M271.312 168.783C229.792 168.783 192.457 194.398 177.724 233.24L131.851 354.118H197.982L236.824 252.661L275.665 354.118H341.796L271.312 168.783Z", fill: "var(--bg-primary, #1a1a1a)" })
          ]
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "ww2c-modal-title", children: title }),
      headerRight && /* @__PURE__ */ jsx("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center" }, children: headerRight })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "ww2c-modal-body", children })
  ] }) });
}
const _w = window;
function usePluginContext() {
  const React = _w.__SHIPSTUDIO_REACT__;
  const CtxRef = _w.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__;
  if (CtxRef && (React == null ? void 0 : React.useContext)) {
    return React.useContext(CtxRef);
  }
  return null;
}
function parseUnzipManifest(stdout) {
  const lines = stdout.split("\n");
  const entries = [];
  for (const line of lines) {
    if (line.match(/^-{5,}/) || line.match(/Length\s+Date/) || line.trim() === "") continue;
    const match = line.match(/^\s*\d+\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+(.+)$/);
    if (match) entries.push(match[1].trim());
  }
  const fileEntries = entries.filter((e) => !e.endsWith("/"));
  const fileCount = fileEntries.length;
  return { fileCount, entries };
}
const DATA_PREFIXES = ["data/", "public/data/", "public/public/data/"];
const HTML_CANDIDATES = ["index.html", "public/front.html", "public/index.html"];
function findDataPrefix(entries) {
  for (const prefix of DATA_PREFIXES) {
    if (entries.some((e) => e.startsWith(prefix) && e.endsWith(".json"))) {
      return prefix;
    }
  }
  return null;
}
function findHtmlShell(entries) {
  for (const candidate of HTML_CANDIDATES) {
    if (entries.includes(candidate)) {
      return candidate;
    }
  }
  return null;
}
async function validateWeWebExport(shell, extractDir, entries) {
  const dataPrefix = findDataPrefix(entries);
  if (!dataPrefix) {
    throw new Error("No data/*.json files found — is this a WeWeb export?");
  }
  const hasManifest = entries.some(
    (e) => e === "manifest.json" || e === "public/manifest.json"
  );
  if (!hasManifest) {
    throw new Error("No manifest.json found — is this a WeWeb export?");
  }
  const htmlShell = findHtmlShell(entries);
  if (!htmlShell) {
    throw new Error("No index.html found — is this a WeWeb export?");
  }
  const appResult = await shell.exec("bash", [
    "-c",
    `grep -c 'div id="app"' '${extractDir}/${htmlShell}' 2>/dev/null || echo 0`
  ]);
  const appCount = parseInt(appResult.stdout.trim(), 10);
  if (appCount === 0) {
    throw new Error(
      'No <div id="app"> found in HTML — is this a WeWeb export?'
    );
  }
  const wwcvResult = await shell.exec("bash", [
    "-c",
    `grep -c '_wwcv=' '${extractDir}/${htmlShell}' 2>/dev/null || echo 0`
  ]);
  const wwcvCount = parseInt(wwcvResult.stdout.trim(), 10);
  if (wwcvCount === 0) {
    throw new Error(
      "No _wwcv= version parameter found — is this a WeWeb export?"
    );
  }
  return { dataPrefix, htmlShell };
}
async function pickZipFile(shell) {
  const result = await shell.exec("osascript", [
    "-e",
    'POSIX path of (choose file with prompt "Select WeWeb export zip" of type {"zip"})'
  ]);
  if (result.exit_code !== 0) {
    if (result.stderr.includes("-128")) {
      return null;
    }
    throw new Error(`File picker failed: ${result.stderr.trim()}`);
  }
  const path = result.stdout.trim();
  if (!path) {
    throw new Error("No path returned from file picker");
  }
  return path;
}
function buildExtractDir(projectPath, zipPath) {
  const zipFileName = zipPath.split("/").pop();
  const sanitizedName = zipFileName.replace(/\.zip$/i, "").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 60);
  return `${projectPath}/.shipstudio/tmp/${sanitizedName}`;
}
async function extractAndVerify(shell, zipPath, extractDir, onProgress) {
  const listResult = await shell.exec("unzip", ["-l", zipPath]);
  if (listResult.exit_code !== 0) {
    throw new Error(`Cannot read zip manifest: ${listResult.stderr.trim()}`);
  }
  const manifest = parseUnzipManifest(listResult.stdout);
  await shell.exec("mkdir", ["-p", extractDir]);
  onProgress == null ? void 0 : onProgress(`Extracting zip... (${manifest.fileCount} files)`);
  const extractResult = await shell.exec(
    "unzip",
    ["-o", zipPath, "-d", extractDir],
    { timeout: 3e5 }
  );
  if (extractResult.exit_code !== 0) {
    throw new Error(`Extraction failed: ${extractResult.stderr.trim()}`);
  }
  const countResult = await shell.exec("bash", [
    "-c",
    `find '${extractDir}' -type f | wc -l | tr -d ' '`
  ]);
  const actual = parseInt(countResult.stdout.trim(), 10);
  if (actual < manifest.fileCount - 2) {
    throw new Error(
      `Extraction incomplete: expected ~${manifest.fileCount} files, found ${actual}. The zip may be corrupted.`
    );
  }
  return manifest;
}
const TOKEN_REGEX = /--([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s*:\s*([^;]+);/gi;
function classifyToken(value) {
  const v = value.trim();
  if (/^\d+\s+\d+px\/\d+px\s/.test(v)) return "font";
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return "color";
  if (/^-?\d+(\.\d+)?(px|rem|em|vh|vw|%)$/.test(v)) return "dimension";
  return "raw";
}
function extractFontSizePx(value) {
  const match = value.match(/\s(\d+)px\//);
  return match ? parseInt(match[1], 10) : 0;
}
function extractFontWeight(value) {
  const match = value.match(/^(\d+)\s/);
  return match ? match[1] : "";
}
function extractLineHeight(value) {
  const match = value.match(/px\/(\d+)px/);
  return match ? match[1] : "";
}
function hexToHsl(hex) {
  let h = hex.replace(/^#/, "");
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length > 6) {
    h = h.slice(0, 6);
  }
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  let sat = 0;
  const light = (max + min) / 2;
  if (delta !== 0) {
    sat = delta / (1 - Math.abs(2 * light - 1));
    switch (max) {
      case r:
        hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        hue = ((b - r) / delta + 2) / 6;
        break;
      case b:
        hue = ((r - g) / delta + 4) / 6;
        break;
    }
  }
  return { h: hue * 360, s: sat * 100, l: light * 100 };
}
function assignColorSemanticLabels(tokens) {
  const grays = [];
  const saturated = [];
  for (const token of tokens) {
    const hsl = hexToHsl(token.value);
    if (hsl.s < 10) {
      grays.push({ ...token, _lightness: hsl.l });
    } else {
      saturated.push({ ...token, _saturation: hsl.s, _hue: hsl.h });
    }
  }
  const grayLabels = ["gray-50", "gray-100", "gray-200", "gray-300", "gray-400", "gray-500", "gray-600", "gray-700", "gray-800", "gray-900"];
  const sortedGrays = [...grays].sort(
    (a, b) => hexToHsl(a.value).l - hexToHsl(b.value).l
  );
  const labeledGrays = sortedGrays.map((t, i) => ({
    ...t,
    semanticLabel: i < grayLabels.length ? grayLabels[i] : `gray-${i}`
  }));
  const sortedSaturated = [...saturated].sort(
    (a, b) => hexToHsl(b.value).s - hexToHsl(a.value).s
  );
  const clusterLabels = ["primary", "secondary", "accent"];
  const clusters = new Array(sortedSaturated.length).fill(-1);
  const clusterCenters = [];
  for (let i = 0; i < sortedSaturated.length; i++) {
    const hue = hexToHsl(sortedSaturated[i].value).h;
    let foundCluster = -1;
    for (let c = 0; c < clusterCenters.length; c++) {
      const diff = Math.abs(hue - clusterCenters[c]);
      if (diff <= 30 || diff >= 330) {
        foundCluster = c;
        break;
      }
    }
    if (foundCluster === -1 && clusterCenters.length < 3) {
      clusterCenters.push(hue);
      foundCluster = clusterCenters.length - 1;
    }
    clusters[i] = foundCluster;
  }
  const labeledSaturated = sortedSaturated.map((t, i) => {
    const clusterIdx = clusters[i];
    return {
      ...t,
      semanticLabel: clusterIdx >= 0 && clusterIdx < clusterLabels.length ? clusterLabels[clusterIdx] : t.value
    };
  });
  const result = [];
  for (const original of tokens) {
    const gray = labeledGrays.find((g) => g.uuid === original.uuid);
    if (gray) {
      result.push(gray);
      continue;
    }
    const sat = labeledSaturated.find((s) => s.uuid === original.uuid);
    if (sat) {
      result.push(sat);
      continue;
    }
    result.push(original);
  }
  return result;
}
function parseDesignTokens(html) {
  const fonts = [];
  const colorsRaw = [];
  const dimensions = [];
  const raw = [];
  let match;
  TOKEN_REGEX.lastIndex = 0;
  while ((match = TOKEN_REGEX.exec(html)) !== null) {
    const uuid = match[1];
    const value = match[2].trim();
    const type = classifyToken(value);
    const token = { uuid, value, type };
    if (type === "font") {
      token.fontSizePx = extractFontSizePx(value);
      token.fontWeight = extractFontWeight(value);
      token.lineHeight = extractLineHeight(value);
      fonts.push(token);
    } else if (type === "color") {
      colorsRaw.push(token);
    } else if (type === "dimension") {
      dimensions.push(token);
    } else {
      raw.push(token);
    }
  }
  fonts.sort((a, b) => (b.fontSizePx ?? 0) - (a.fontSizePx ?? 0));
  for (let i = 0; i < fonts.length; i++) {
    if (i < 6) {
      fonts[i].semanticLabel = `h${i + 1}`;
    } else {
      fonts[i].semanticLabel = `body-${i - 5}`;
    }
  }
  const seenHex = /* @__PURE__ */ new Set();
  const colors = [];
  for (const token of colorsRaw) {
    const key = token.value.toLowerCase();
    if (!seenHex.has(key)) {
      seenHex.add(key);
      colors.push(token);
    }
  }
  const labeledColors = assignColorSemanticLabels(colors);
  return {
    fonts,
    colors: labeledColors,
    dimensions,
    raw,
    googleFontUrls: []
  };
}
function extractGoogleFontUrls(html) {
  const regex = /https?:\/\/fonts\.googleapis\.com\/css2[^"'\s)]+/g;
  const matches = html.match(regex) ?? [];
  return [...new Set(matches)];
}
async function readJsonFile(shell, filePath) {
  const result = await shell.exec("bash", ["-c", `base64 < '${filePath}'`]);
  if (result.exit_code !== 0) {
    throw new Error(`Failed to read ${filePath}: ${result.stderr.trim()}`);
  }
  const json = atob(result.stdout.trim());
  return JSON.parse(json);
}
function normalizeRoute(path) {
  return path.replace(/\{\{([^|]+)\|[^}]*\}\}/g, "[$1]");
}
function parsePageData(pageJson, pageId) {
  var _a, _b, _c;
  const data = pageJson;
  const rawRoute = ((_b = (_a = data == null ? void 0 : data.page) == null ? void 0 : _a.paths) == null ? void 0 : _b.default) ?? "";
  const route = normalizeRoute(rawRoute);
  const isDynamic = route.includes("[");
  const sections = {};
  const rawSections = (data == null ? void 0 : data.sections) ?? {};
  for (const [uid, section] of Object.entries(rawSections)) {
    const style = ((_c = section == null ? void 0 : section._state) == null ? void 0 : _c.style) ?? {};
    const parsedSection = {
      uid,
      sectionBaseId: section.sectionBaseId ?? "",
      title: section.sectionTitle ?? null,
      isShared: false,
      // populated later by detectShared
      styleDefault: style.default ?? {},
      styleMobile: style.mobile,
      styleTablet: style.tablet,
      components: []
      // populated by tree walker
    };
    sections[uid] = parsedSection;
  }
  const variables = ((data == null ? void 0 : data.variables) ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    type: v.type,
    defaultValue: v.defaultValue ?? null,
    isLocalStorage: !!v.isLocalStorage,
    isPersistentOnNav: !!v.isPersistentOnNav
  }));
  const collections = ((data == null ? void 0 : data.collections) ?? []).map((c) => {
    var _a2;
    return {
      id: c.id,
      name: c.name,
      type: c.mode === "single" ? "single" : "list",
      table: ((_a2 = c.config) == null ? void 0 : _a2.table) ?? "",
      pluginId: c.pluginId ?? ""
    };
  });
  return {
    id: pageId,
    route,
    isDynamic,
    sections,
    variables,
    collections,
    workflows: []
    // populated by Plan 04 (parseWorkflows)
  };
}
const COMPONENT_LOOKUP = {
  b783dc65: "Container",
  d7904e9d: "Text",
  "1b1e2173": "Icon",
  "83d890fb": "Icon",
  "6f8796b1": "Button",
  "59dca300": "Button",
  deb10a01: "TextInput",
  aeb78b9a: "TextInput",
  "6145eb60": "Select",
  "0d3e75d1": "Select",
  "9ecb2cfc": "Form",
  aa29a661: "Checkbox",
  "6ba133b6": "Checkbox",
  "3a7d6379": "Image",
  a823467c: "FileUpload",
  "9202d35c": "FileInput",
  "985570fc": "DatePicker",
  d2eeb897: "DataGrid",
  a6cb6a4d: "Tabs",
  "9256b033": "Modal",
  "9ccf84b0": "ImageSlider",
  aa27b26f: "Loader",
  "70a53858": "Category",
  "97a63460": "Checkbox",
  "85044fa4": "DateDisplay",
  c8199d0d: "Select"
};
function lookupComponentType(wwObjectBaseId, name2) {
  const prefix = wwObjectBaseId.slice(0, 8);
  const found = COMPONENT_LOOKUP[prefix];
  if (found) return found;
  if (name2) return name2;
  return "custom-component";
}
function getAllWwRefs(val) {
  if (typeof val !== "object" || val === null) return [];
  if (Array.isArray(val)) return val.flatMap(getAllWwRefs);
  const obj = val;
  if (obj["isWwObject"] === true && typeof obj["uid"] === "string") {
    return [obj["uid"]];
  }
  return Object.values(obj).flatMap(getAllWwRefs);
}
function isDynamicBinding(val) {
  return typeof val === "object" && val !== null && "__wwtype" in val && (val.__wwtype === "f" || val.__wwtype === "js");
}
function walkObject(uid, objectMap, visited) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  if (visited.has(uid)) return null;
  visited.add(uid);
  const raw = objectMap[uid];
  if (!raw) return null;
  const componentType = lookupComponentType(raw.wwObjectBaseId ?? "", raw.name ?? null);
  const isLibraryComponent = !!raw.libraryComponentBaseId;
  const contentDefault = ((_a = raw.content) == null ? void 0 : _a.default) ?? {};
  let isDynamic = false;
  for (const v of Object.values(contentDefault)) {
    if (isDynamicBinding(v)) {
      isDynamic = true;
      break;
    }
  }
  let conditionalRendering;
  const stateStyle = ((_c = (_b = raw._state) == null ? void 0 : _b.style) == null ? void 0 : _c.default) ?? {};
  const condRender = stateStyle["conditionalRendering"];
  if (condRender !== void 0) {
    if (isDynamicBinding(condRender)) {
      conditionalRendering = "[DYNAMIC: conditional]";
    } else if (condRender === true) {
      conditionalRendering = "always visible";
    }
  }
  let textContent;
  const rawText = contentDefault["text"];
  if (rawText !== void 0 && rawText !== null) {
    if (isDynamicBinding(rawText)) {
      textContent = "[DYNAMIC]";
    } else if (typeof rawText === "string") {
      textContent = rawText;
    }
  }
  let imageUrl;
  const rawUrl = contentDefault["url"];
  if (rawUrl !== void 0 && rawUrl !== null) {
    if (isDynamicBinding(rawUrl)) {
      imageUrl = "[DYNAMIC]";
    } else if (typeof rawUrl === "string" && !rawUrl.includes("cdn.weweb.app")) {
      imageUrl = rawUrl;
    }
  }
  const styleDefault = ((_e = (_d = raw._state) == null ? void 0 : _d.style) == null ? void 0 : _e.default) ?? {};
  const styleMobile = (_g = (_f = raw._state) == null ? void 0 : _f.style) == null ? void 0 : _g.mobile;
  const styleTablet = (_i = (_h = raw._state) == null ? void 0 : _h.style) == null ? void 0 : _i.tablet;
  const childRefs = getAllWwRefs(contentDefault);
  const children = [];
  for (const childUid of childRefs) {
    const child = walkObject(childUid, objectMap, visited);
    if (child) children.push(child);
  }
  const interactions = ((_j = raw._state) == null ? void 0 : _j.interactions) ?? [];
  return {
    uid,
    name: raw.name ?? null,
    componentType,
    wwObjectBaseId: raw.wwObjectBaseId ?? "",
    isLibraryComponent,
    isDynamic,
    conditionalRendering,
    styleDefault,
    styleMobile,
    styleTablet,
    interactions,
    children,
    textContent,
    imageUrl
  };
}
function buildComponentTree(section, objectMap, parentSectionIndex, visited) {
  const results = [];
  const contentBreakpoints = section.content ?? {};
  for (const bpValue of Object.values(contentBreakpoints)) {
    const wwObjects = (bpValue == null ? void 0 : bpValue.wwObjects) ?? [];
    for (const ref of wwObjects) {
      if (ref.isWwObject && typeof ref.uid === "string") {
        const parsed = walkObject(ref.uid, objectMap, visited);
        if (parsed) results.push(parsed);
      }
    }
  }
  const fallbackUids = parentSectionIndex.get(section.uid) ?? [];
  for (const uid of fallbackUids) {
    const parsed = walkObject(uid, objectMap, visited);
    if (parsed) results.push(parsed);
  }
  return results;
}
function linearizeWorkflowChain(firstActionId, actionsMap, variableIndex = /* @__PURE__ */ new Map()) {
  if (!firstActionId) return [];
  const chain = [];
  const visited = /* @__PURE__ */ new Set();
  let current = firstActionId;
  while (current && !visited.has(current)) {
    visited.add(current);
    const action = actionsMap[current];
    if (!action) break;
    const type = action.type ?? "unknown";
    const name2 = action.name ?? action.type ?? "unnamed";
    const spec = { type, name: name2 };
    if (type === "variable") {
      const varId = action.wwpiId ?? action.variableId ?? action.id;
      if (varId) {
        spec.varId = varId;
        const resolved = variableIndex.get(varId);
        if (resolved) spec.varName = resolved;
      }
    }
    if (type === "fetch-collection" || type === "fetch-collections") {
      const details = {};
      if (action.collectionId) details.collectionId = action.collectionId;
      if (action.collectionIds) details.collectionIds = action.collectionIds;
      spec.details = details;
    } else if (type === "custom-js") {
      const details = {};
      if (action.code) details.code = action.code;
      spec.details = details;
    } else if (type === "change-page") {
      const details = {};
      if (action.pageId) details.pageId = action.pageId;
      if (action.parameters) details.parameters = action.parameters;
      spec.details = details;
    } else if (type === "if") {
      const details = {};
      if (action.condition) details.condition = action.condition;
      if (action.thenAction) details.thenAction = action.thenAction;
      if (action.elseAction) details.elseAction = action.elseAction;
      spec.details = details;
    } else if (type === "switch") {
      const details = {};
      if (action.expression) details.expression = action.expression;
      if (action.cases) details.cases = action.cases;
      spec.details = details;
    }
    chain.push(spec);
    current = action.next;
  }
  return chain;
}
function buildVariableIndex(variables) {
  const index = /* @__PURE__ */ new Map();
  for (const v of variables) {
    index.set(v.id, v.name);
  }
  return index;
}
function parsePageWorkflows(pageWorkflows, pageName, variableIndex) {
  return pageWorkflows.map((raw) => {
    const wf = raw;
    const spec = {
      id: wf.id,
      name: wf.name ?? "unnamed workflow",
      sourceType: "page",
      sourceName: pageName,
      trigger: wf.trigger ?? "unknown",
      actions: linearizeWorkflowChain(
        wf.firstAction,
        wf.actions ?? {},
        variableIndex
      )
    };
    const triggerConds = wf.triggerConditions;
    if (triggerConds && typeof triggerConds === "object" && triggerConds.__wwtype) {
      spec.triggerCondition = `[DYNAMIC: ${triggerConds.__wwtype}]`;
    }
    return spec;
  });
}
function parseElementInteractions(interactions, elementName, variableIndex) {
  return interactions.map((raw) => {
    const interaction = raw;
    const spec = {
      id: interaction.id,
      name: interaction.name ?? interaction.trigger ?? "unnamed",
      sourceType: "element",
      sourceName: elementName,
      trigger: interaction.trigger ?? "unknown",
      actions: linearizeWorkflowChain(
        interaction.firstAction,
        interaction.actions ?? {},
        variableIndex
      )
    };
    const triggerConds = interaction.triggerConditions;
    if (triggerConds && typeof triggerConds === "object" && triggerConds.__wwtype) {
      spec.triggerCondition = `[DYNAMIC: ${triggerConds.__wwtype}]`;
    }
    return spec;
  });
}
function parseVariables(rawVars) {
  return rawVars.map((raw) => {
    const v = raw;
    return {
      id: v.id,
      name: v.name ?? "unnamed",
      type: v.type ?? "string",
      defaultValue: v.defaultValue ?? null,
      isLocalStorage: !!v.isLocalStorage,
      isPersistentOnNav: !!v.isPersistentOnNav
    };
  });
}
function parseCollections(rawColls) {
  return rawColls.map((raw) => {
    const c = raw;
    const config = c.config;
    return {
      id: c.id,
      name: c.name ?? "unnamed",
      type: c.mode === "single" ? "single" : "list",
      table: (config == null ? void 0 : config.table) ?? "",
      pluginId: c.pluginId ?? ""
    };
  });
}
function inferSectionType(title) {
  const t = title.toLowerCase();
  if (t.includes("nav") || t.includes("menu")) return "nav";
  if (t.includes("header")) return "header";
  if (t.includes("side")) return "sidebar";
  if (t.includes("footer")) return "footer";
  return "shared";
}
function detectSharedSections(pages) {
  if (pages.length === 0) return /* @__PURE__ */ new Map();
  const pageFreq = /* @__PURE__ */ new Map();
  const baseTitles = /* @__PURE__ */ new Map();
  for (const page of pages) {
    for (const section of Object.values(page.sections)) {
      const bid = section.sectionBaseId;
      if (!bid) continue;
      if (!pageFreq.has(bid)) {
        pageFreq.set(bid, /* @__PURE__ */ new Set());
      }
      pageFreq.get(bid).add(page.id);
      baseTitles.set(bid, section.title ?? "unnamed");
    }
  }
  const threshold = pages.length * 0.5;
  const shared = /* @__PURE__ */ new Map();
  for (const [bid, pageIds] of pageFreq) {
    if (pageIds.size >= threshold) {
      const title = baseTitles.get(bid);
      shared.set(bid, {
        title,
        pageCount: pageIds.size,
        totalPages: pages.length,
        type: inferSectionType(title)
      });
    }
  }
  for (const page of pages) {
    for (const section of Object.values(page.sections)) {
      if (section.sectionBaseId && shared.has(section.sectionBaseId)) {
        section.isShared = true;
      }
    }
  }
  return shared;
}
function buildAssetManifest(entries, googleFontUrls) {
  const images = entries.filter((e) => e.startsWith("images/") && !e.endsWith("/")).map((e) => ({
    filename: e.split("/").pop(),
    projectRelativePath: `.shipstudio/assets/${e}`
  }));
  const icons = entries.filter((e) => e.startsWith("icons/") && !e.endsWith("/")).map((e) => ({
    filename: e.split("/").pop(),
    projectRelativePath: `.shipstudio/assets/${e}`
  }));
  return {
    images,
    icons,
    googleFonts: googleFontUrls,
    totalCopied: images.length + icons.length
  };
}
async function copyAssets(shell, extractDir, projectPath) {
  await shell.exec("mkdir", ["-p", `${projectPath}/.shipstudio/assets/images`]);
  await shell.exec("mkdir", ["-p", `${projectPath}/.shipstudio/assets/icons`]);
  const imgCheck = await shell.exec("bash", [
    "-c",
    `test -d '${extractDir}/images' && echo exists || echo none`
  ]);
  if (imgCheck.stdout.trim() === "exists") {
    await shell.exec("bash", [
      "-c",
      `cp -r '${extractDir}/images/'* '${projectPath}/.shipstudio/assets/images/' 2>/dev/null || true`
    ]);
  }
  const iconCheck = await shell.exec("bash", [
    "-c",
    `test -d '${extractDir}/icons' && echo exists || echo none`
  ]);
  if (iconCheck.stdout.trim() === "exists") {
    await shell.exec("bash", [
      "-c",
      `cp -r '${extractDir}/icons/'* '${projectPath}/.shipstudio/assets/icons/' 2>/dev/null || true`
    ]);
  }
}
function countObjects(objects) {
  let total = 0;
  for (const obj of objects) {
    total += 1 + countObjects(obj.children);
  }
  return total;
}
function flattenObjects(objects) {
  const result = [];
  for (const obj of objects) {
    result.push(obj);
    result.push(...flattenObjects(obj.children));
  }
  return result;
}
async function analyzeSite(shell, extractDir, entries, projectPath, onProgress, dataPrefix = "data/", htmlShell = "index.html") {
  var _a;
  onProgress({ kind: "analyzing", pageCount: 0 });
  const htmlResult = await shell.exec("bash", ["-c", `base64 < '${extractDir}/${htmlShell}'`]);
  if (htmlResult.exit_code !== 0) {
    throw new Error(`Failed to read ${htmlShell}: ${htmlResult.stderr.trim()}`);
  }
  const html = atob(htmlResult.stdout.trim());
  const designSystem = parseDesignTokens(html);
  const googleFontUrls = extractGoogleFontUrls(html);
  designSystem.googleFontUrls = googleFontUrls;
  const manifestPath = entries.includes("manifest.json") ? `${extractDir}/manifest.json` : `${extractDir}/public/manifest.json`;
  const manifest = await readJsonFile(shell, manifestPath);
  const siteName = manifest.name ?? manifest.short_name ?? "Unnamed Site";
  const pageEntries = entries.filter(
    (e) => e.startsWith(dataPrefix) && e.endsWith(".json") && !e.endsWith("/")
  );
  const pageIds = pageEntries.map(
    (e) => e.slice(dataPrefix.length, -".json".length)
  );
  const allParsedPages = [];
  let parsedSoFar = 0;
  for (const pageId of pageIds) {
    onProgress({ kind: "analyzing", pageCount: parsedSoFar });
    const pageJson = await readJsonFile(
      shell,
      `${extractDir}/${dataPrefix}${pageId}.json`
    );
    const parsedPage = parsePageData(pageJson, pageId);
    const parentSectionIndex = /* @__PURE__ */ new Map();
    const wwObjects = pageJson.wwObjects ?? {};
    for (const [uid, obj] of Object.entries(wwObjects)) {
      const rawObj = obj;
      const parentId = rawObj.parentSectionId;
      if (parentId) {
        if (!parentSectionIndex.has(parentId)) {
          parentSectionIndex.set(parentId, []);
        }
        parentSectionIndex.get(parentId).push(uid);
      }
    }
    const visited = /* @__PURE__ */ new Set();
    const rawSections = pageJson.sections ?? {};
    for (const [sectionUid, rawSection] of Object.entries(rawSections)) {
      const parsedSection = parsedPage.sections[sectionUid];
      if (!parsedSection) continue;
      const components = buildComponentTree(
        rawSection,
        wwObjects,
        parentSectionIndex,
        visited
      );
      parsedSection.components = components;
    }
    const libRoots = pageJson.libraryComponents ?? [];
    for (const libComp of libRoots) {
      const rootUid = libComp.rootElementId;
      if (!rootUid || visited.has(rootUid)) continue;
      buildComponentTree(
        { uid: "__lib_root__", content: { default: { wwObjects: [{ uid: rootUid, isWwObject: true }] } } },
        wwObjects,
        /* @__PURE__ */ new Map(),
        visited
      );
    }
    const variables = pageJson.variables ?? [];
    const variableIndex = buildVariableIndex(variables);
    const pageWorkflows = parsePageWorkflows(
      pageJson.page.workflows ?? [],
      parsedPage.route,
      variableIndex
    );
    parsedPage.workflows = pageWorkflows;
    for (const section of Object.values(parsedPage.sections)) {
      const allObjects = flattenObjects(section.components);
      for (const parsedObj of allObjects) {
        const rawObj = wwObjects[parsedObj.uid];
        const interactions = ((_a = rawObj == null ? void 0 : rawObj._state) == null ? void 0 : _a.interactions) ?? [];
        if (interactions.length > 0) {
          parsedObj.interactions = parseElementInteractions(
            interactions,
            parsedObj.name ?? parsedObj.uid,
            variableIndex
          );
        }
      }
    }
    parsedPage.variables = parseVariables(variables);
    parsedPage.collections = parseCollections(pageJson.collections ?? []);
    allParsedPages.push(parsedPage);
    parsedSoFar += 1;
  }
  onProgress({ kind: "analyzing", pageCount: parsedSoFar });
  const sharedSections = detectSharedSections(allParsedPages);
  const assetManifest = buildAssetManifest(entries, designSystem.googleFontUrls);
  onProgress({ kind: "copying", label: "Copying assets..." });
  await copyAssets(shell, extractDir, projectPath);
  const variableSeenIds = /* @__PURE__ */ new Set();
  const allVariables = [];
  for (const page of allParsedPages) {
    for (const v of page.variables) {
      if (!variableSeenIds.has(v.id)) {
        variableSeenIds.add(v.id);
        allVariables.push(v);
      }
    }
  }
  const collectionSeenIds = /* @__PURE__ */ new Set();
  const allCollections = [];
  for (const page of allParsedPages) {
    for (const c of page.collections) {
      if (!collectionSeenIds.has(c.id)) {
        collectionSeenIds.add(c.id);
        allCollections.push(c);
      }
    }
  }
  let totalComponentCount = 0;
  for (const page of allParsedPages) {
    for (const section of Object.values(page.sections)) {
      totalComponentCount += countObjects(section.components);
    }
  }
  const siteAnalysis = {
    siteName,
    pages: allParsedPages,
    sharedSections,
    allVariables,
    allCollections,
    totalComponentCount
  };
  return { siteAnalysis, designSystem, assetManifest };
}
const PRESERVE_OPTIONS = [
  { key: "brand-colors", label: "Brand colors & typography" },
  { key: "visual-hierarchy", label: "Visual hierarchy & spacing" },
  { key: "exact-layouts", label: "Exact layouts (grid/flex)" },
  { key: "interactions", label: "Interactions & workflows" },
  { key: "image-treatment", label: "Image treatment & sizing" }
];
const DEFAULT_PRESERVE = /* @__PURE__ */ new Set([
  "brand-colors",
  "visual-hierarchy",
  "image-treatment"
]);
const TOKEN_WARNING_THRESHOLD = 12e3;
function estimateTokens(markdown) {
  return Math.ceil(markdown.length / 4);
}
function escapeTableCell(value) {
  return value.replace(/\|/g, "\\|");
}
const COMPONENT_MIGRATION_NOTES = {
  Container: "div (or semantic section/article)",
  Text: "p or span",
  Image: "img with alt text",
  Button: "button or a",
  Link: "a",
  Icon: "svg or icon component",
  "Form Container": "form",
  Input: "input",
  Select: "select",
  Columns: "CSS grid or flexbox",
  Tabs: "tab component (custom or library)",
  Map: "map embed (iframe or library)",
  Video: "video element",
  Slider: "CSS scroll snap or lightweight carousel",
  Accordion: "details/summary or custom JS",
  Modal: "dialog element or custom modal",
  Navbar: "nav with hamburger JS",
  Footer: "footer element"
};
function buildMetadataSection(input) {
  const date = input.date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const modeLabel = input.mode === "pixel-perfect" ? "Pixel Perfect" : "Best Site";
  const { pages, totalComponentCount, sharedSections } = input.siteAnalysis;
  const assetCount = input.assetManifest.images.length + input.assetManifest.icons.length;
  const lines = [
    "# WeWeb Migration Brief",
    "",
    `**Site:** ${input.siteAnalysis.siteName}`,
    `**Extracted:** ${date}`,
    `**Mode:** ${modeLabel}`,
    `**Pages:** ${pages.length}`,
    `**Components:** ${totalComponentCount}`,
    `**Assets:** ${assetCount} files copied to .shipstudio/assets/`,
    `**Shared sections:** ${sharedSections.size}`
  ];
  return lines.join("\n");
}
function buildMigrationPlanSection() {
  return `## Migration Plan

The file \`.shipstudio/migration-plan.json\` will be generated alongside this brief. It contains all pages and sections from the site analysis with status \`"pending"\`.

**Before writing any code:**
1. Read \`.shipstudio/migration-plan.json\` to understand the full scope of work.
2. Do NOT recreate this file — it already exists. Do not overwrite it with a new structure.

**IMPORTANT — Update the plan file after EACH item you complete:**
- When you start an item: set its \`status\` to \`"in-progress"\` and write the file.
- When you finish an item: set its \`status\` to \`"complete"\` and write the file immediately — do not batch updates.
- The user is watching progress in real time. Update after every single item.

**Example of the file format:**
\`\`\`json
{
  "version": "1.0",
  "generatedAt": "2026-03-24",
  "items": [
    { "name": "Shared Nav", "type": "shared", "status": "pending" },
    {
      "name": "Home",
      "type": "page",
      "status": "in-progress",
      "children": [
        { "name": "Hero", "type": "section", "status": "complete" }
      ]
    }
  ]
}
\`\`\``;
}
function buildInstructionsSection(input) {
  var _a;
  if (input.mode === "pixel-perfect") {
    return `## How to Use This Brief

**Mode: pixel-perfect** — Reproduce the exact layout, spacing, and visual hierarchy from the WeWeb export.

**Instructions:**
- Use design tokens verbatim from the Design System section. Do not approximate or substitute values.
- Implement WeWeb interactive components (forms, tabs, sliders) as native HTML/JS equivalents.
- Preserve all layout relationships: grid columns, flex directions, gap values, and padding.
- Component types listed in the Component Migration Guidance section show the recommended native replacement.
- Shared sections (from the Shared Layout section) should be built once as shared components.`;
  }
  const preserve = input.preserve ?? /* @__PURE__ */ new Set();
  const activeOptions = PRESERVE_OPTIONS.filter((opt) => preserve.has(opt.key));
  const activeLabels = activeOptions.map((opt) => opt.label);
  const preserveSection = activeLabels.length > 0 ? `

**Preserve from original:** ${activeLabels.join(", ")}` : "";
  const customSection = ((_a = input.customNotes) == null ? void 0 : _a.trim()) ? `

**Additional instructions:**
> ${input.customNotes.trim().replace(/\n/g, "\n> ")}` : "";
  return `## How to Use This Brief

**Mode: best-site** — Use this brief as reference. Modernize with relative units, semantic HTML, and component-based architecture.

**Instructions:**
- Use modern CSS (clamp, grid, flexbox with relative units) rather than exact pixel values.
- Replace WeWeb component types with semantic HTML5 elements and native implementations.
- Prioritize accessibility and performance alongside visual fidelity.${preserveSection}${customSection}`;
}
function buildOverviewSection(input) {
  const { pages } = input.siteAnalysis;
  const lines = [
    "## Site Overview",
    "",
    "| Route | Sections | Components | Dynamic |",
    "|-------|----------|------------|---------|"
  ];
  let totalSections = 0;
  let totalComponents = 0;
  for (const page of pages) {
    const sections = Object.values(page.sections);
    const sectionCount = sections.length;
    const componentCount = sections.reduce((acc, s) => acc + s.components.length, 0);
    totalSections += sectionCount;
    totalComponents += componentCount;
    const dynamic = page.isDynamic ? "Yes" : "No";
    lines.push(`| ${escapeTableCell(page.route)} | ${sectionCount} | ${componentCount} | ${dynamic} |`);
  }
  lines.push(`| **Total** | **${totalSections}** | **${totalComponents}** | — |`);
  return lines.join("\n");
}
function buildDesignSystemSection(ds) {
  var _a;
  const lines = ["## Design System"];
  if (ds.fonts.length > 0) {
    lines.push("", "### Typography", "", "| Semantic | Size (px) | Weight | Line Height | Token UUID |", "|----------|-----------|--------|-------------|------------|");
    for (const token of ds.fonts) {
      const semantic = escapeTableCell(token.semanticLabel ?? token.uuid);
      const size = ((_a = token.fontSizePx) == null ? void 0 : _a.toString()) ?? "—";
      const weight = token.fontWeight ?? "—";
      const lineHeight = token.lineHeight ?? "—";
      lines.push(`| ${semantic} | ${size} | ${weight} | ${lineHeight} | ${token.uuid} |`);
    }
  }
  if (ds.colors.length > 0) {
    lines.push("", "### Colors", "", "| Semantic | Value | Token UUID |", "|----------|-------|------------|");
    for (const token of ds.colors) {
      const semantic = escapeTableCell(token.semanticLabel ?? token.uuid);
      lines.push(`| ${semantic} | ${escapeTableCell(token.value)} | ${token.uuid} |`);
    }
  }
  if (ds.dimensions.length > 0) {
    lines.push("", "### Spacing & Dimensions", "", "| Value | Token UUID |", "|-------|------------|");
    for (const token of ds.dimensions) {
      const label = token.semanticLabel ? `${token.semanticLabel} (${token.value})` : token.value;
      lines.push(`| ${escapeTableCell(label)} | ${token.uuid} |`);
    }
  }
  if (ds.googleFontUrls.length > 0) {
    lines.push("", "### External Fonts", "");
    for (const url of ds.googleFontUrls) {
      lines.push(`- ${url}`);
    }
  }
  return lines.join("\n");
}
function buildSharedLayoutSection(sa) {
  if (sa.sharedSections.size === 0) {
    return "";
  }
  const lines = [
    "## Shared Layout",
    "",
    "These sections appear on more than 50% of pages. Build them once as shared components.",
    "",
    "| Type | Title | Confidence | Section Base ID |",
    "|------|-------|------------|-----------------|"
  ];
  for (const [baseId, info] of sa.sharedSections) {
    const pct = Math.round(info.pageCount / info.totalPages * 100);
    lines.push(`| ${info.type} | ${escapeTableCell(info.title)} | ${pct}% (${info.pageCount}/${info.totalPages} pages) | ${escapeTableCell(baseId)} |`);
  }
  return lines.join("\n");
}
function renderComponentTree(objects, depth, maxDepth) {
  if (objects.length === 0) return "";
  const lines = [];
  const indent = "  ".repeat(depth);
  for (const obj of objects) {
    if (depth >= maxDepth) {
      const total = countDescendants(obj);
      lines.push(`${indent}- ...(${total + 1} nested components)`);
      continue;
    }
    const dynamicBadge = obj.isDynamic ? " [DYNAMIC]" : "";
    const libraryBadge = obj.isLibraryComponent ? " *(library)*" : "";
    const namePart = obj.name ? ` -- ${escapeTableCell(obj.name)}` : "";
    lines.push(`${indent}- **${escapeTableCell(obj.componentType)}**${dynamicBadge}${libraryBadge}${namePart}`);
    if (obj.children.length > 0) {
      lines.push(renderComponentTree(obj.children, depth + 1, maxDepth));
    }
  }
  return lines.filter(Boolean).join("\n");
}
function countDescendants(obj) {
  return obj.children.reduce((acc, child) => acc + 1 + countDescendants(child), 0);
}
function renderBreakpointDiffs(section) {
  const lines = [];
  if (section.styleMobile && Object.keys(section.styleMobile).length > 0) {
    lines.push("", "**Mobile breakpoint overrides:**", "", "| Property | Value |", "|----------|-------|");
    for (const [key, val] of Object.entries(section.styleMobile)) {
      lines.push(`| ${escapeTableCell(key)} | ${escapeTableCell(String(val))} |`);
    }
  }
  if (section.styleTablet && Object.keys(section.styleTablet).length > 0) {
    lines.push("", "**Tablet breakpoint overrides:**", "", "| Property | Value |", "|----------|-------|");
    for (const [key, val] of Object.entries(section.styleTablet)) {
      lines.push(`| ${escapeTableCell(key)} | ${escapeTableCell(String(val))} |`);
    }
  }
  return lines.join("\n");
}
function renderWorkflows(workflows) {
  if (workflows.length === 0) return "";
  const lines = ["", "**Workflows:**"];
  for (const wf of workflows) {
    const condition = wf.triggerCondition ? ` (when: ${wf.triggerCondition})` : "";
    lines.push(``, `*${escapeTableCell(wf.name)}* — trigger: \`${wf.trigger}\`${condition}`);
    wf.actions.forEach((action, i) => {
      const varRef = action.varName ? ` → ${action.varName}` : action.varId ? ` → ${action.varId}` : "";
      lines.push(`${i + 1}. ${escapeTableCell(action.type)}${varRef}: ${escapeTableCell(action.name)}`);
    });
  }
  return lines.join("\n");
}
function buildPageSubsection(page, input) {
  const dynamicFlag = page.isDynamic ? " [dynamic]" : "";
  const lines = [`### ${escapeTableCell(page.route)}${dynamicFlag}`];
  const sections = Object.values(page.sections).filter((s) => !s.isShared);
  for (const section of sections) {
    lines.push("");
    const title = section.title ? `**${escapeTableCell(section.title)}**` : `*(section: ${section.uid})*`;
    lines.push(title);
    if (section.components.length > 0) {
      const tree = renderComponentTree(section.components, 0, 3);
      if (tree) lines.push(tree);
    }
    const diffs = renderBreakpointDiffs(section);
    if (diffs) lines.push(diffs);
  }
  const wfText = renderWorkflows(page.workflows);
  if (wfText) lines.push(wfText);
  return lines.join("\n");
}
function buildPagesSection(input) {
  const subsections = input.siteAnalysis.pages.map((page) => buildPageSubsection(page));
  return `## Pages

${subsections.join("\n\n")}`;
}
function buildAssetsSection(am) {
  const lines = ["## Assets"];
  if (am.images.length > 0) {
    lines.push("", "### Images", "", "| Filename | Path |", "|----------|------|");
    for (const img of am.images) {
      lines.push(`| ${escapeTableCell(img.filename)} | ${escapeTableCell(img.projectRelativePath)} |`);
    }
  }
  if (am.icons.length > 0) {
    lines.push("", "### Icons", "", "| Filename | Path |", "|----------|------|");
    for (const icon of am.icons) {
      lines.push(`| ${escapeTableCell(icon.filename)} | ${escapeTableCell(icon.projectRelativePath)} |`);
    }
  }
  if (am.googleFonts.length > 0) {
    lines.push("", "### Fonts", "");
    for (const url of am.googleFonts) {
      lines.push(`- ${url}`);
    }
  }
  lines.push("", `Total assets copied: ${am.totalCopied}`);
  return lines.join("\n");
}
function collectComponentTypes(pages) {
  const types = /* @__PURE__ */ new Set();
  function walkObjects(objects) {
    for (const obj of objects) {
      types.add(obj.componentType);
      walkObjects(obj.children);
    }
  }
  for (const page of pages) {
    for (const section of Object.values(page.sections)) {
      walkObjects(section.components);
    }
  }
  return types;
}
function buildMigrationGuidanceSection(input) {
  const componentTypes = collectComponentTypes(input.siteAnalysis.pages);
  const lines = [
    "## Component Migration Guidance",
    "",
    "| WeWeb Component | Recommended Replacement |",
    "|-----------------|-------------------------|"
  ];
  for (const componentType of componentTypes) {
    const note = COMPONENT_MIGRATION_NOTES[componentType] ?? "Implement as custom component";
    lines.push(`| ${escapeTableCell(componentType)} | ${escapeTableCell(note)} |`);
  }
  return lines.join("\n");
}
function generateBrief(input) {
  const sections = [
    buildMetadataSection(input),
    buildMigrationPlanSection(),
    buildInstructionsSection(input),
    buildOverviewSection(input),
    buildDesignSystemSection(input.designSystem),
    buildSharedLayoutSection(input.siteAnalysis),
    buildPagesSection(input),
    buildAssetsSection(input.assetManifest),
    buildMigrationGuidanceSection(input)
  ].filter(Boolean);
  const markdown = sections.join("\n\n");
  const est = estimateTokens(markdown);
  const stats = {
    pageCount: input.siteAnalysis.pages.length,
    totalComponentCount: input.siteAnalysis.totalComponentCount,
    assetCount: input.assetManifest.images.length + input.assetManifest.icons.length,
    estimatedTokens: est
  };
  return {
    markdown,
    charCount: markdown.length,
    estimatedTokens: est,
    stats
  };
}
async function saveBrief(shell, projectPath, markdown) {
  const briefDir = `${projectPath}/.shipstudio/assets`;
  const briefPath = `${briefDir}/brief.md`;
  const encoded = btoa(unescape(encodeURIComponent(markdown)));
  const result = await shell.exec("bash", [
    "-c",
    `mkdir -p '${briefDir}' && echo '${encoded}' | base64 -d > '${briefPath}'`
  ]);
  if (result.exit_code !== 0) {
    throw new Error(`Failed to save brief: ${result.stderr}`);
  }
}
async function copyToClipboard(shell, markdown) {
  const encoded = btoa(unescape(encodeURIComponent(markdown)));
  const result = await shell.exec("bash", [
    "-c",
    `echo '${encoded}' | base64 -d | pbcopy`
  ]);
  if (result.exit_code !== 0) {
    throw new Error(`Clipboard copy failed: ${result.stderr}`);
  }
}
const SHARED_TYPE_ORDER = {
  nav: 0,
  header: 1,
  sidebar: 2,
  shared: 3,
  footer: 4
};
function generateMigrationPlan(siteAnalysis) {
  const items = [];
  const sharedEntries = Array.from(siteAnalysis.sharedSections.entries());
  sharedEntries.sort(([, a], [, b]) => {
    const orderA = SHARED_TYPE_ORDER[a.type] ?? 3;
    const orderB = SHARED_TYPE_ORDER[b.type] ?? 3;
    return orderA - orderB;
  });
  for (const [, info] of sharedEntries) {
    items.push({
      name: info.title,
      type: "shared",
      status: "pending"
    });
  }
  for (const page of siteAnalysis.pages) {
    const nonSharedSections = Object.values(page.sections).filter((s) => !s.isShared);
    const children = nonSharedSections.map((s) => ({
      name: s.title ?? s.uid,
      type: "section",
      status: "pending"
    }));
    items.push({
      name: page.route,
      type: "page",
      status: "pending",
      children: children.length > 0 ? children : void 0
    });
  }
  return {
    version: "1.0",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    items
  };
}
async function saveMigrationPlan(shell, projectPath, plan) {
  const planDir = `${projectPath}/.shipstudio`;
  const planPath = `${planDir}/migration-plan.json`;
  const json = JSON.stringify(plan, null, 2);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  const result = await shell.exec("bash", [
    "-c",
    `mkdir -p '${planDir}' && echo '${encoded}' | base64 -d > '${planPath}'`
  ]);
  if (result.exit_code !== 0) {
    throw new Error(`Failed to save migration plan: ${result.stderr}`);
  }
}
async function loadMigrationPlan(shell, projectPath) {
  const planPath = `${projectPath}/.shipstudio/migration-plan.json`;
  const check = await shell.exec("bash", ["-c", `test -f '${planPath}' && echo exists`]);
  if (check.exit_code !== 0 || !check.stdout.includes("exists")) return null;
  const result = await shell.exec("bash", ["-c", `cat '${planPath}' | base64`]);
  if (result.exit_code !== 0) return null;
  try {
    const json = decodeURIComponent(escape(atob(result.stdout.trim())));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function computeProgress(plan) {
  let complete = 0;
  let total = 0;
  for (const item of plan.items) {
    const leaves = item.children && item.children.length > 0 ? item.children : [item];
    for (const leaf of leaves) {
      total++;
      if (leaf.status === "complete") complete++;
    }
  }
  return { complete, total };
}
function computePageProgress(item) {
  if (!item.children || item.children.length === 0) {
    return { complete: item.status === "complete" ? 1 : 0, total: 1 };
  }
  let complete = 0;
  for (const child of item.children) {
    if (child.status === "complete") complete++;
  }
  return { complete, total: item.children.length };
}
function buildResumePrompt(projectPath) {
  return `Read the migration plan at ${projectPath}/.shipstudio/migration-plan.json and the brief at ${projectPath}/.shipstudio/assets/brief.md. Continue the migration from where you left off. Check which items are still "pending" or "in-progress" in the plan file and pick up from there. Update each item's status in the plan file as you complete it.`;
}
const STATUS_SYMBOL = {
  pending: "○",
  // ○
  "in-progress": "◆",
  // ◆
  complete: "✓"
  // ✓
};
const STATUS_COLOR = {
  pending: "var(--text-muted)",
  "in-progress": "var(--accent, #0d99ff)",
  complete: "#4caf50"
};
function ChildItem({ child }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: "6px",
        padding: "2px 0 2px 18px",
        fontSize: "11px"
      },
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            style: {
              color: STATUS_COLOR[child.status],
              fontSize: "11px",
              minWidth: "14px",
              flexShrink: 0
            },
            children: STATUS_SYMBOL[child.status]
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { style: { color: "var(--text-primary)" }, children: child.name }),
          child.notes ? /* @__PURE__ */ jsx("div", { style: { color: "var(--text-muted)", fontSize: "10px", marginTop: "1px" }, children: child.notes }) : null
        ] })
      ]
    }
  );
}
function PlanRow({
  item,
  isExpanded,
  onToggle
}) {
  const hasChildren = item.children && item.children.length > 0;
  const progress = hasChildren ? computePageProgress(item) : null;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        onClick: hasChildren ? onToggle : void 0,
        style: {
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 0",
          cursor: hasChildren ? "pointer" : "default",
          fontSize: "12px"
        },
        children: [
          hasChildren ? /* @__PURE__ */ jsx("span", { style: { color: "var(--text-muted)", fontSize: "10px", minWidth: "12px" }, children: isExpanded ? "▼" : "▶" }) : /* @__PURE__ */ jsx("span", { style: { color: STATUS_COLOR[item.status], fontSize: "11px", minWidth: "12px" }, children: STATUS_SYMBOL[item.status] }),
          /* @__PURE__ */ jsx("span", { style: { color: "var(--text-primary)", flex: 1 }, children: item.name }),
          progress ? /* @__PURE__ */ jsxs("span", { style: { color: "var(--text-muted)", fontSize: "11px" }, children: [
            progress.complete,
            "/",
            progress.total
          ] }) : null
        ]
      }
    ),
    isExpanded && item.children ? item.children.map((child, ci) => /* @__PURE__ */ jsx(ChildItem, { child }, ci)) : null
  ] });
}
function MigrationProgress({ shell, projectPath, onStartFresh }) {
  const [plan, setPlan] = useState(null);
  const [pollError, setPollError] = useState(false);
  const [expanded, setExpanded] = useState(/* @__PURE__ */ new Set());
  const [resumeCopied, setResumeCopied] = useState(false);
  const hadPlan = useRef(false);
  useEffect(() => {
    async function poll() {
      const result = await loadMigrationPlan(shell, projectPath);
      if (result !== null) {
        setPlan(result);
        hadPlan.current = true;
        setPollError(false);
      } else if (hadPlan.current) {
        setPollError(true);
      }
    }
    poll();
    const id = setInterval(poll, 3e4);
    return () => clearInterval(id);
  }, [shell, projectPath]);
  const handleCopyResumePrompt = useCallback(async () => {
    const promptText = buildResumePrompt(projectPath);
    await copyToClipboard(shell, promptText);
    setResumeCopied(true);
    setTimeout(() => setResumeCopied(false), 2e3);
  }, [shell, projectPath]);
  const toggleExpanded = useCallback((idx) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);
  const sectionLabel = /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        fontSize: "11px",
        fontWeight: 500,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "8px",
        marginTop: "0px"
      },
      children: "Migration Progress"
    }
  );
  if (pollError && plan === null) {
    return /* @__PURE__ */ jsxs("div", { children: [
      sectionLabel,
      /* @__PURE__ */ jsx("div", { style: { fontSize: "12px", color: "var(--text-muted)", padding: "8px 0" }, children: "Could not read migration plan" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "ww2c-btn-ghost",
          onClick: onStartFresh,
          style: { width: "100%", marginTop: "8px" },
          children: "Start Fresh"
        }
      )
    ] });
  }
  if (plan === null) {
    return null;
  }
  const { complete, total } = computeProgress(plan);
  const pct = total > 0 ? Math.round(complete / total * 100) : 0;
  const sharedItems = plan.items.map((item, idx) => ({ item, idx })).filter(({ item }) => item.type === "shared");
  const pageItems = plan.items.map((item, idx) => ({ item, idx })).filter(({ item }) => item.type !== "shared");
  const orderedItems = [...sharedItems, ...pageItems];
  return /* @__PURE__ */ jsxs("div", { children: [
    sectionLabel,
    /* @__PURE__ */ jsxs("div", { style: { fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }, children: [
      complete,
      "/",
      total,
      " items (",
      pct,
      "%)"
    ] }),
    /* @__PURE__ */ jsx("div", { className: "ww2c-progress-bar", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: "ww2c-progress-fill",
        style: { width: `${pct}%` }
      }
    ) }),
    /* @__PURE__ */ jsx("div", { children: orderedItems.map(({ item, idx }) => /* @__PURE__ */ jsx(
      PlanRow,
      {
        item,
        isExpanded: expanded.has(idx),
        onToggle: () => toggleExpanded(idx)
      },
      idx
    )) }),
    /* @__PURE__ */ jsx(
      "button",
      {
        className: "btn-primary",
        onClick: handleCopyResumePrompt,
        style: { width: "100%", marginTop: "12px", marginBottom: "8px" },
        children: resumeCopied ? "Prompt copied — paste into your agent" : "Copy Resume Prompt"
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        className: "ww2c-btn-ghost",
        onClick: onStartFresh,
        children: "Start Fresh"
      }
    )
  ] });
}
function PreserveCheckbox({ label, checked, onToggle }) {
  return /* @__PURE__ */ jsxs("div", { className: "ww2c-check-item", onClick: onToggle, children: [
    /* @__PURE__ */ jsx("div", { className: `ww2c-checkbox${checked ? " checked" : ""}`, children: checked && /* @__PURE__ */ jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M2 5.5L4 7.5L8 3", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
    /* @__PURE__ */ jsx("span", { children: label })
  ] });
}
function MainView() {
  const [step, setStep] = useState({ kind: "idle" });
  const [showConfirm, setShowConfirm] = useState(false);
  const [mode, setMode] = useState("pixel-perfect");
  const [preserve, setPreserve] = useState(new Set(DEFAULT_PRESERVE));
  const [customNotes, setCustomNotes] = useState("");
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [existingPlan, setExistingPlan] = useState("checking");
  const ctx = usePluginContext();
  useEffect(() => {
    if (!ctx) return;
    loadMigrationPlan(ctx.shell, ctx.project.path).then((plan) => {
      setExistingPlan(plan);
    });
  }, []);
  if (!ctx) {
    return /* @__PURE__ */ jsx("div", { className: "ww2c-progress", children: "Plugin context not available" });
  }
  const handleStartFresh = () => {
    setExistingPlan(null);
    setStep({ kind: "idle" });
  };
  const startPickFlow = async () => {
    const currentMode = mode;
    const currentPreserve = preserve;
    const currentCustomNotes = customNotes;
    try {
      setStep({ kind: "picking" });
      const zipPath = await pickZipFile(ctx.shell);
      if (!zipPath) {
        setStep({ kind: "idle" });
        return;
      }
      setStep({ kind: "extracting", fileCount: 0 });
      const extractDir = buildExtractDir(ctx.project.path, zipPath);
      const manifest = await extractAndVerify(ctx.shell, zipPath, extractDir, (_label) => {
        setStep({ kind: "extracting", fileCount: 0 });
      });
      setStep({ kind: "validating" });
      const { dataPrefix, htmlShell } = await validateWeWebExport(ctx.shell, extractDir, manifest.entries);
      const analysisResult = await analyzeSite(
        ctx.shell,
        extractDir,
        manifest.entries,
        ctx.project.path,
        setStep,
        dataPrefix,
        htmlShell
      );
      setStep({ kind: "generating" });
      const briefResult = generateBrief({
        mode: currentMode,
        siteAnalysis: analysisResult.siteAnalysis,
        designSystem: analysisResult.designSystem,
        assetManifest: analysisResult.assetManifest,
        projectPath: ctx.project.path,
        preserve: currentMode === "best-site" ? currentPreserve : void 0,
        customNotes: currentMode === "best-site" ? currentCustomNotes : void 0
      });
      await saveBrief(ctx.shell, ctx.project.path, briefResult.markdown);
      const plan = generateMigrationPlan(analysisResult.siteAnalysis);
      await saveMigrationPlan(ctx.shell, ctx.project.path, plan);
      setStep({ kind: "done", zipPath, extractDir, fileCount: manifest.fileCount, briefResult });
    } catch (err) {
      setStep({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    }
  };
  const checkAndPick = async () => {
    const result = await ctx.shell.exec("bash", [
      "-c",
      `test -d '${ctx.project.path}/.shipstudio' && echo exists || echo none`
    ]);
    if (result.stdout.trim() === "exists") {
      setShowConfirm(true);
    } else {
      startPickFlow();
    }
  };
  if (existingPlan === "checking") {
    return /* @__PURE__ */ jsx("div", { className: "ww2c-progress", children: "Checking for existing migration..." });
  }
  if (existingPlan !== null && step.kind === "idle") {
    return /* @__PURE__ */ jsx(
      MigrationProgress,
      {
        shell: ctx.shell,
        projectPath: ctx.project.path,
        onStartFresh: handleStartFresh
      }
    );
  }
  if (showConfirm) {
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "ww2c-progress", children: "Existing migration found. Start fresh?" }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "8px", marginTop: "8px" }, children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "ww2c-btn-ghost",
            onClick: () => setShowConfirm(false),
            style: { flex: 1 },
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "btn-primary",
            onClick: () => {
              setShowConfirm(false);
              startPickFlow();
            },
            style: { flex: 1 },
            children: "Start Fresh"
          }
        )
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    step.kind === "idle" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "ww2c-mode-group", children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: `ww2c-mode-card${mode === "pixel-perfect" ? " selected" : ""}`,
            onClick: () => setMode("pixel-perfect"),
            children: [
              /* @__PURE__ */ jsx("div", { className: "ww2c-mode-card-name", children: "Pixel Perfect" }),
              /* @__PURE__ */ jsx("div", { className: "ww2c-mode-card-desc", children: "Exact recreation of the original design" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: `ww2c-mode-card${mode === "best-site" ? " selected" : ""}`,
            onClick: () => setMode("best-site"),
            children: [
              /* @__PURE__ */ jsx("div", { className: "ww2c-mode-card-name", children: "Best Site" }),
              /* @__PURE__ */ jsx("div", { className: "ww2c-mode-card-desc", children: "Modernized with best practices" })
            ]
          }
        )
      ] }),
      mode === "best-site" && /* @__PURE__ */ jsxs("div", { className: "ww2c-preserve-section", children: [
        /* @__PURE__ */ jsx("div", { className: "ww2c-checklist", children: PRESERVE_OPTIONS.map((opt) => /* @__PURE__ */ jsx(
          PreserveCheckbox,
          {
            label: opt.label,
            checked: preserve.has(opt.key),
            onToggle: () => {
              const next = new Set(preserve);
              if (next.has(opt.key)) next.delete(opt.key);
              else next.add(opt.key);
              setPreserve(next);
            }
          },
          opt.key
        )) }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "ww2c-custom-notes",
            placeholder: "Additional notes for the AI...",
            value: customNotes,
            onChange: (e) => setCustomNotes(e.target.value),
            rows: 3
          }
        )
      ] }),
      /* @__PURE__ */ jsx("button", { className: "btn-primary", onClick: checkAndPick, style: { width: "100%", marginTop: "16px" }, children: "Select WeWeb Export (.zip)" })
    ] }),
    step.kind === "picking" && /* @__PURE__ */ jsx("div", { className: "ww2c-progress", children: "Opening file picker..." }),
    step.kind === "extracting" && /* @__PURE__ */ jsx("div", { className: "ww2c-progress", children: "Extracting ZIP..." }),
    step.kind === "validating" && /* @__PURE__ */ jsx("div", { className: "ww2c-progress", children: "Validating WeWeb export..." }),
    step.kind === "copying" && /* @__PURE__ */ jsx("div", { className: "ww2c-progress", children: step.label }),
    step.kind === "analyzing" && /* @__PURE__ */ jsxs("div", { className: "ww2c-progress", children: [
      "Analyzing pages... (",
      step.pageCount,
      ")"
    ] }),
    step.kind === "generating" && /* @__PURE__ */ jsx("div", { className: "ww2c-progress", children: "Generating brief..." }),
    step.kind === "done" && /* @__PURE__ */ jsxs("div", { className: "ww2c-results", children: [
      /* @__PURE__ */ jsx("div", { className: "ww2c-results-header", children: "Brief Generated" }),
      /* @__PURE__ */ jsxs("div", { className: "ww2c-results-stats", children: [
        step.briefResult.stats.pageCount,
        " pages |",
        " ",
        step.briefResult.stats.totalComponentCount,
        " components |",
        " ",
        step.briefResult.stats.assetCount,
        " assets |",
        " ",
        "~",
        Math.round(step.briefResult.estimatedTokens / 1e3),
        "K tokens"
      ] }),
      step.briefResult.estimatedTokens > TOKEN_WARNING_THRESHOLD && /* @__PURE__ */ jsxs("div", { className: "ww2c-results-tip", children: [
        "Brief is ~",
        Math.round(step.briefResult.estimatedTokens / 1e3),
        "K tokens — consider building page by page using the migration plan file."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "ww2c-results-output", children: [
        /* @__PURE__ */ jsx("div", { className: "ww2c-results-output-label", children: "Saved to:" }),
        /* @__PURE__ */ jsx("div", { className: "ww2c-results-path", children: ".shipstudio/assets/brief.md" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "ww2c-results-output", children: /* @__PURE__ */ jsx("div", { className: "ww2c-results-path", children: "Migration plan saved to .shipstudio/migration-plan.json" }) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "btn-primary",
          onClick: async () => {
            setCopying(true);
            try {
              await copyToClipboard(ctx.shell, step.briefResult.markdown);
              setCopied(true);
              setTimeout(() => setCopied(false), 2e3);
            } catch {
            }
            setCopying(false);
          },
          style: { width: "100%", marginTop: "8px" },
          disabled: copying,
          children: copied ? "Copied!" : copying ? "Copying..." : "Copy Brief to Clipboard"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "ww2c-btn-ghost",
          onClick: () => {
            setStep({ kind: "idle" });
          },
          style: { width: "100%", marginTop: "4px" },
          children: "Start Over"
        }
      )
    ] }),
    step.kind === "error" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "ww2c-error", children: step.message }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "btn-primary",
          onClick: () => setStep({ kind: "idle" }),
          style: { width: "100%", marginTop: "8px" },
          children: "Try Again"
        }
      )
    ] })
  ] });
}
function WeWebIcon() {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: "14",
      height: "14",
      viewBox: "0 0 474 471",
      fill: "none",
      children: [
        /* @__PURE__ */ jsx("rect", { width: "473.647", height: "471", rx: "64", fill: "currentColor" }),
        /* @__PURE__ */ jsx("path", { d: "M131.181 235.583C99.8733 235.583 73.923 259.525 71.2443 290.497L65.7194 354.117H131.851L142.231 235.416H131.348L131.181 235.583Z", fill: "var(--bg-primary, #1a1a1a)" }),
        /* @__PURE__ */ jsx("path", { d: "M385.661 116.883C350.167 116.883 322.376 147.353 325.724 182.679L341.796 354.118H407.928L385.661 116.883Z", fill: "var(--bg-primary, #1a1a1a)" }),
        /* @__PURE__ */ jsx("path", { d: "M271.312 168.783C229.792 168.783 192.457 194.398 177.724 233.24L131.851 354.118H197.982L236.824 252.661L275.665 354.118H341.796L271.312 168.783Z", fill: "var(--bg-primary, #1a1a1a)" })
      ]
    }
  );
}
function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setModalOpen(true),
        title: "WeWeb to Code",
        className: "toolbar-icon-btn",
        children: /* @__PURE__ */ jsx(WeWebIcon, {})
      }
    ),
    /* @__PURE__ */ jsx(
      Modal,
      {
        open: modalOpen,
        onClose: () => setModalOpen(false),
        title: "WeWeb to Code",
        children: /* @__PURE__ */ jsx(MainView, {})
      }
    )
  ] });
}
const name = "WeWeb to Code";
const slots = {
  toolbar: ToolbarButton
};
function onActivate() {
  console.log("[weweb-to-code] Plugin activated");
}
function onDeactivate() {
  console.log("[weweb-to-code] Plugin deactivated");
}
export {
  name,
  onActivate,
  onDeactivate,
  slots
};
