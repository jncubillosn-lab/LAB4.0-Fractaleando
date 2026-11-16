/**
 * Frontera entre archivos y estado de la herramienta.
 * La descarga serializa la instantánea completa; importar valida antes de
 * invocar onImport. El ejemplo se lee solo por petición del usuario y comparte
 * la cancelación con las demás lecturas, para que una respuesta tardía no
 * reemplace otro documento que ya está abierto.
 */
import {parseGraphFile} from '../io/GraphFile.js';

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  try {
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

export function downloadFile(filename, data, mime) {
  downloadBlob(filename, new Blob([data], {type: mime}));
}

export function bindGraphFiles({fileInput, loadButton, saveButton, snapshot, onImport, toast, beforeSave = () => {}, fetcher = fetch}) {
  // Una lectura lenta no puede sustituir un Nuevo, una importación o una apertura
  // de Biblioteca más reciente. El mismo contador protege archivos y ejemplo.
  let revision = 0, pendingExample = null;
  const invalidate = () => { revision++; pendingExample?.abort(); pendingExample = null; return revision; };
  const serialize = () => {beforeSave();return JSON.stringify(snapshot(), null, 2);};
  const importText = text => {onImport(parseGraphFile(text));toast('Grafo importado.');};
  loadButton.onclick = () => fileInput.click();
  const exportJson = () => {
    downloadFile('p1-grafo.json', serialize(), 'application/json;charset=utf-8');
    toast('Se exportó el grafo completo, independiente de la vista.');
  };
  saveButton.onclick = exportJson;
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const ticket = invalidate();
    try {
      const text = await file.text();
      if (ticket !== revision) return;
      importText(text);
    } catch (error) {
      if (ticket === revision) toast('No se pudo importar: ' + error.message);
    } finally {
      if (ticket === revision) fileInput.value = '';
    }
  });
  return {
    serialize,
    exportJson,
    // El ejemplo es un JSON exportado desde el propio editor. Se descarga solo
    // al pulsar Ejemplo y se valida con el mismo contrato de los archivos locales.
    // Devuelve datos; app.js decide cuándo reemplazar el lienzo y limpiar su historial.
    async readExample(url) {
      const ticket = invalidate(), controller = new AbortController();
      pendingExample = controller;
      try {
        const response = await fetcher(url, {signal: controller.signal});
        if (!response.ok) throw new Error('No se pudo leer el archivo de ejemplo.');
        const text = await response.text();
        if (ticket !== revision) return null;
        return parseGraphFile(text);
      } catch (error) {
        if (ticket === revision) toast('No se pudo abrir el ejemplo: ' + error.message);
        return null;
      } finally {
        if (pendingExample === controller) pendingExample = null;
      }
    },
    openText(text) {invalidate();fileInput.value = '';importText(text);},
    cancel() {
      invalidate();
      fileInput.value = '';
    }
  };
}
