import {loadNodeTypography,exportedNodeFonts} from './NodeTypography.js';
import {scaleCrossings} from './CircuitSvg.js';
import {pngExportPlan,completeGraphClone,svgStyleTag,exportScene} from './PngExport.js';
import {downloadFile,downloadBlob} from './GraphFiles.js';

const EXPORT_STYLE=`
.svgline{fill:none;stroke:#1c1c1b;stroke-width:var(--hierarchy-width,1.35);stroke-opacity:.50;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.svgline.active{stroke-width:calc(var(--hierarchy-width,1.35) * 1px + .75px);stroke-opacity:1}
.svgline.transverse{stroke-opacity:.52}
.node rect{fill:#f7f6f1;stroke:#1c1c1b;stroke-width:1.4}
.node.core rect{stroke-width:2.4}.node.anchor rect{stroke-width:1.9}.node.selected rect{stroke-width:2.7}
.node text{font-family:Rajdhani,Arial,sans-serif;font-size:var(--node-font-size,24px);fill:#1c1c1b;text-anchor:middle;dominant-baseline:alphabetic;font-weight:600}
.node.core text{font-size:var(--node-font-size,24px);font-weight:700}.node.anchor text{font-size:var(--node-font-size,24px);font-weight:600}
.node.hierarchy-focus rect{stroke-width:2.8;stroke-opacity:1}
.node.hierarchy-focus text{font-weight:700}
.node.selected.hierarchy-focus rect{stroke-width:3.5}
.hierarchy-focus .svgline{stroke-width:calc(var(--hierarchy-width,1.35) * 1px + .75px);stroke-opacity:1}
`;

function exportColor(name) {
  const dark = document.documentElement.dataset.theme === 'dark';
  return dark ? (name === 'paper' ? '#171917' : '#e9e9e4') :
    (name === 'paper' ? '#f7f6f1' : '#1c1c1b');
}

function exportStyles() {
  return exportedNodeFonts() + EXPORT_STYLE
    .replaceAll('#f7f6f1', exportColor('paper'))
    .replaceAll('#1c1c1b', exportColor('ink'));
}

// View/scene dependencies are supplied explicitly; this controller owns file
// creation and temporary resources, never edits the graph or its camera.
export function bindDiagramExports({
  svgButton, pngButton, stage, camera, linesEl, nodesEl, plane, derived, state, diag, toast, sEl,
  beforeExport = () => {}, loading
}) {
  function exportValidationNotice(notice = derived.exportNotice()) {
    return notice ? `<desc>${notice}</desc><g><rect x="0" y="0" width="100%" height="34" fill="${exportColor('paper')}"/><text x="16" y="23" fill="${exportColor('ink')}" font-family="Arial,sans-serif" font-size="14">${notice}</text></g>` : '';
  }

  function exportCamera(node = camera) {
    return new XMLSerializer().serializeToString(node)
      .replaceAll('fill="var(--paper)"', 'fill="' + exportColor('paper') + '"');
  }

  function makeExportSvg(outputW, outputH, notice) {
    const sourceW = Math.max(1, stage.clientWidth);
    const sourceH = Math.max(1, stage.clientHeight);
    const scale = Math.min(outputW / sourceW, outputH / sourceH);
    const x = (outputW - sourceW * scale) / 2;
    const y = (outputH - sourceH * scale) / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${outputW}" height="${outputH}" viewBox="0 0 ${outputW} ${outputH}"><rect width="${outputW}" height="${outputH}" fill="${exportColor('paper')}"/>${svgStyleTag(exportStyles())}<g transform="translate(${x} ${y}) scale(${scale})">${exportCamera()}</g>${exportValidationNotice(notice)}</svg>`;
  }

  function completePngSvg(bounds, scene) {
    const {width, height, scale, offsetX, offsetY} = bounds;
    const graph = completeGraphClone({
      lines: scene.mode === '01' ? linesEl : derived.derivedLines,
      nodes: scene.mode === '01' ? nodesEl : derived.derivedNodes,
      sEl
    });
    scaleCrossings(graph, 1);
    graph.removeAttribute('transform');
    const style = exportStyles().replace(/vector-effect\s*:\s*non-scaling-stroke\s*;?/g, '');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${exportColor('paper')}"/>${svgStyleTag(style)}<g transform="translate(${offsetX.toFixed(2)} ${offsetY.toFixed(2)}) scale(${scale})">${exportCamera(graph)}</g>${exportValidationNotice(scene.notice)}</svg>`;
  }

  svgButton.onclick = async () => {
    const job=loading?.begin('Exportando SVG','Preparando la vista y su tipografía…');
    try {
      await job?.paint();
      beforeExport();
      await loadNodeTypography();
      await new Promise(requestAnimationFrame);
      const scene=exportScene({plane,derived,state});
      downloadFile('fractalear-vista.svg',
        makeExportSvg(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight),scene.notice),
        'image/svg+xml;charset=utf-8');
      toast('Vista actual exportada en SVG.');
    } catch (error) { toast('No se pudo exportar SVG: '+error.message); }
    finally { job?.finish(); }
  };

  pngButton.onclick = async () => {
    if (pngButton.disabled) return;
    const label=pngButton.textContent||'PNG 4K';
    pngButton.disabled = true;
    pngButton.textContent = 'PNG…';
    const job=loading?.begin('Exportando PNG 4K','Preparando el grafo completo…');
    let temporaryURL = null;
    try {
      await job?.paint();
      beforeExport();
      await loadNodeTypography();
      if (state.renderQueued) {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
      const scene = exportScene({plane,derived,state,complete:true});
      const bounds = pngExportPlan({
        rects: scene.rects, routes: scene.routes,
        notice: Boolean(scene.notice)
      });
      const svgText = completePngSvg(bounds,scene);
      temporaryURL = URL.createObjectURL(new Blob([svgText], {type: 'image/svg+xml;charset=utf-8'}));
      const picture = new Image();
      await new Promise((resolve, reject) => {
        picture.onload = resolve;
        picture.onerror = () => reject(new Error('No se pudo convertir el diagrama SVG en imagen.'));
        picture.src = temporaryURL;
      });
      const canvas = document.createElement('canvas');
      canvas.width = bounds.width;
      canvas.height = bounds.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('El navegador no puede crear el lienzo PNG de este tamaño. Prueba SVG.');
      context.fillStyle = exportColor('paper');
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(picture, 0, 0, bounds.width, bounds.height);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(value => value ? resolve(value) :
          reject(new Error('No se pudo codificar este PNG de gran tamaño. Puedes exportar SVG.')), 'image/png');
      });
      diag.pngExport = {...bounds, fontPixels: 24 * bounds.scale};
      downloadBlob(`fractalear-${scene.mode === '04' ? '03' : scene.mode}-4k-${bounds.width}x${bounds.height}.png`, blob);
      toast(`PNG 4K: ${bounds.width} × ${bounds.height} px · ${bounds.nodes} conceptos · ${bounds.edges} vínculos.`);
    } catch (error) {
      console.error('Error exportando PNG completo:', error);
      toast('No se pudo exportar PNG: ' + error.message);
    } finally {
      if (temporaryURL) URL.revokeObjectURL(temporaryURL);
      job?.finish();
      pngButton.disabled = false;
      pngButton.textContent = label;
    }
  };
}
