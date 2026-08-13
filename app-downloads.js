/* BoardCAD Web output download actions. Loaded before app.js; functions resolve app state at call time. */
function downloadPdf() {
  if (!state.board) return;
  downloadBlob(`${safeName(state.board.name)}.pdf`, makePdf(state.board), "application/pdf");
}

function downloadTemplatePdf() {
  if (!state.board) return;
  downloadBlob(`${safeName(state.board.name)}-templates.pdf`, makeTemplatePdf(state.board), "application/pdf");
  els.status.textContent = "実寸テンプレートPDFを書き出しました。A4横ページへ自動分割しています。";
}

function downloadBrd() {
  if (!state.board) return;
  downloadBlob(defaultBrdFilename(), makeBrd(state.board), "text/plain");
  els.status.textContent = "BRDを書き出しました。Bezier制御点を保持し、ノーズ/テールのデッキ・ハル接合を保存用に補正しています。";
}

function downloadBrdAs() {
  if (!state.board) return;
  const fallback = defaultBrdFilename();
  const raw = window.prompt("Save BRD as", fallback);
  if (raw === null) return;
  const trimmed = raw.trim();
  if (!trimmed) {
    els.status.textContent = "保存ファイル名を入力してください。";
    return;
  }
  const filename = /\.brd$/i.test(trimmed) ? trimmed : `${trimmed}.brd`;
  downloadBlob(filename, makeBrd(state.board), "text/plain");
  els.status.textContent = `BRDを ${filename} として書き出しました。`;
}

function defaultBrdFilename() {
  const source = state.board?.name || state.board?.filename || "board";
  const base = safeName(String(source).replace(/\.brd$/i, ""));
  return `${base}.brd`;
}

function downloadOtl() {
  if (!state.board) return;
  downloadBlob(`${safeName(state.board.name)}.otl`, makeOtl(state.board), "text/plain");
  els.status.textContent = "Outlineを.otlとして書き出しました。";
}

function downloadPfl() {
  if (!state.board) return;
  downloadBlob(`${safeName(state.board.name)}.pfl`, makePfl(state.board), "text/plain");
  els.status.textContent = "Profileを.pflとして書き出しました。";
}

function downloadDxfOutlineSpline() {
  if (!state.board) return;
  downloadBlob(`${safeName(state.board.name)}-outline-spline.dxf`, makeDxfOutlineSpline(state.board), "application/dxf");
  els.status.textContent = "Outline DXF Splineを書き出しました。";
}

function downloadDxfProfileSpline() {
  if (!state.board) return;
  downloadBlob(`${safeName(state.board.name)}-profile-spline.dxf`, makeDxfProfileSpline(state.board), "application/dxf");
  els.status.textContent = "Profile DXF Splineを書き出しました。";
}

function downloadDxfCrossSectionSpline() {
  if (!state.board || !currentCrossSection()) return;
  const pos = fmt(currentCrossSection().position).replace(".", "_");
  downloadBlob(`${safeName(state.board.name)}-cross-section-${pos}-spline.dxf`, makeDxfCrossSectionSpline(currentCrossSection()), "application/dxf");
  els.status.textContent = "Cross section DXF Splineを書き出しました。";
}

function downloadDxfOutline() {
  if (!state.board) return;
  downloadBlob(`${safeName(state.board.name)}-outline-polyline.dxf`, makeDxfOutline(state.board), "application/dxf");
  els.status.textContent = "Outline DXF Polylineを書き出しました。";
}

function downloadDxfProfile() {
  if (!state.board) return;
  downloadBlob(`${safeName(state.board.name)}-profile-polyline.dxf`, makeDxfProfile(state.board), "application/dxf");
  els.status.textContent = "Profile DXF Polylineを書き出しました。";
}

function downloadDxfCrossSection() {
  if (!state.board || !currentCrossSection()) return;
  const pos = fmt(currentCrossSection().position).replace(".", "_");
  downloadBlob(`${safeName(state.board.name)}-cross-section-${pos}-polyline.dxf`, makeDxfCrossSection(currentCrossSection()), "application/dxf");
  els.status.textContent = "Cross section DXF Polylineを書き出しました。";
}

function downloadLaserGCode() {
  if (!state.board) return;
  downloadBlob(`${safeName(state.board.name)}-laser-outline.nc`, makeLaserGCode(state.board), "text/plain");
}

function downloadCncGCode() {
  if (!state.board) return;
  const axes = Number(els.cncAxes.value) || 4;
  const surface = els.cncSurface.value || "bottom";
  state.cncGCode = makeCncGCode(state.board);
  els.sendCncButton.disabled = !state.serial.connected;
  downloadBlob(`${safeName(state.board.name)}-${axes}axis-${surface}.nc`, state.cncGCode, "text/plain");
}

Object.assign(window, {
  downloadPdf,
  downloadTemplatePdf,
  downloadBrd,
  downloadBrdAs,
  downloadOtl,
  downloadPfl,
  downloadDxfOutlineSpline,
  downloadDxfProfileSpline,
  downloadDxfCrossSectionSpline,
  downloadDxfOutline,
  downloadDxfProfile,
  downloadDxfCrossSection,
  downloadLaserGCode,
  downloadCncGCode
});
