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

export function bindGraphFiles({fileInput, loadButton, saveButton, snapshot, onImport, toast}) {
  let revision = 0;
  loadButton.onclick = () => fileInput.click();
  saveButton.onclick = () => {
    downloadFile('p1-grafo.json', JSON.stringify(snapshot(), null, 2), 'application/json;charset=utf-8');
    toast('Se exportó el grafo completo, independiente de la vista.');
  };
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const ticket = ++revision;
    try {
      const text = await file.text();
      if (ticket !== revision) return;
      onImport(parseGraphFile(text));
      toast('Grafo importado.');
    } catch (error) {
      if (ticket === revision) toast('No se pudo importar: ' + error.message);
    } finally {
      if (ticket === revision) fileInput.value = '';
    }
  });
  return {
    cancel() {
      revision++;
      fileInput.value = '';
    }
  };
}
