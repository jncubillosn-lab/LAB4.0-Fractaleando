/**
 * Flujo de consentimiento y catálogo, separado del transporte de Google.
 * terms explica el acceso público; name prepara la instantánea; confirm espera
 * una decisión explícita. Solo el botón Sí llama a saveConfirmed y client.save.
 * No, Escape, cierre y exportación local no envían el diagrama. Durante el envío
 * se bloquean dobles activaciones y el reintento mantiene la misma solicitud.
 */
import {createPublicLibrary,validLibraryUrl} from '../io/PublicLibrary.js';

export function bindPublicLibrary({config,saveButton,openButton,group,dialog,graphFiles,documentKey,toast,
 clientFactory=createPublicLibrary}){
 if(!validLibraryUrl(config.deploymentUrl))return;
 group.hidden=false;
 // The client is constructed without fetching. Drive is contacted on demand.
 const client=clientFactory({url:config.deploymentUrl});
 const find=selector=>dialog.querySelector(selector);
 const heading=find('[data-library-title]'),form=find('form'),name=find('input'),status=find('[role="status"]');
 const list=find('[data-library-list]'),more=find('[data-library-more]'),close=find('[data-library-close]');
 const stepLabel=find('[data-library-step]'),filename=find('[data-library-filename]');
 const panels=Array.from(dialog.querySelectorAll('[data-library-panel]'));
 const titles={terms:'Antes de compartir tu diagrama',name:'Nombra tu diagrama',
  confirm:'¿Compartir este archivo públicamente?',list:'Biblioteca pública'};
 let busy=false,mode=null,cursor=null,selectedDocument=null,submission=null;
 const message=text=>{status.textContent=text;};
 function setBusy(value){
  busy=value;dialog.setAttribute('aria-busy',String(value));
  for(const control of dialog.querySelectorAll('button,input'))control.disabled=value;
 }
 function showStep(next){
  mode=next;
  for(const panel of panels)panel.hidden=panel.dataset.libraryPanel!==next;
  heading.textContent=titles[next]||'';
  const step={terms:'1 de 3 · Condiciones de uso',name:'2 de 3 · Nombre del archivo',confirm:'3 de 3 · Confirmación final'}[next];
  stepLabel.hidden=!step;stepLabel.textContent=step||'';
  dialog.classList.toggle('library-dialog--terms',next==='terms');
  if(next==='name')name.focus();
  if(next==='confirm')find('[data-library-no]').focus();
 }
 function finish(title,text){
  submission=null;message('');showStep('done');heading.textContent=title;
  find('[data-library-receipt]').textContent=text;
 }
 function open(next){
  if(busy)return;
  selectedDocument=documentKey();submission=null;cursor=null;list.replaceChildren();
  name.value='';more.hidden=true;message('');setBusy(false);showStep(next);dialog.showModal();
  if(next==='list')void loadPage();
 }
 function unchanged(){
  if(selectedDocument!==documentKey())throw Error('El diagrama cambió durante la consulta. Vuelve a abrir la biblioteca.');
 }
 async function loadPage(){
  if(busy||mode!=='list')return;
  setBusy(true);message('Consultando la biblioteca…');
  try{
   const page=await client.list(cursor);
   if(!Array.isArray(page.files))throw Error('El catálogo recibido no es válido.');
   for(const file of page.files){
    const item=document.createElement('li'),button=document.createElement('button'),date=document.createElement('span');
    button.type='button';button.textContent=file.name;button.addEventListener('click',()=>void openFile(file));
    const when=new Date(file.createdTime);date.textContent=Number.isFinite(when.getTime())?when.toLocaleString('es-CO'):'';
    item.append(button,date);list.append(item);
   }
   cursor=page.nextCursor||null;more.hidden=!cursor;
   message(list.children.length?'Selecciona un diagrama para abrirlo.':'La biblioteca todavía no tiene diagramas.');
  }catch(error){message(error.message+' Puedes cerrar y volver a intentarlo.');}
  finally{setBusy(false);}
 }
 async function openFile(file){
  if(busy||mode!=='list')return;
  if(!confirm('¿Abrir «'+file.name+'»? Guarda antes tu diagrama actual si deseas conservarlo.'))return;
  setBusy(true);message('Abriendo el diagrama…');
  try{
   const result=await client.read(file.id);unchanged();
   if(typeof result.content!=='string')throw Error('El archivo recibido no es válido.');
   graphFiles.openText(result.content);dialog.close();
  }catch(error){message(error.message);}
  finally{setBusy(false);}
 }
 // Preparing the named snapshot never sends it. Only the explicit Yes handler can save.
 form.addEventListener('submit',event=>{
  event.preventDefault();if(busy||mode!=='name')return;
  try{
   unchanged();
   const label=name.value.trim();if(!label){name.focus();return;}
   const content=graphFiles.serialize();
   if(!submission||submission.name!==label||submission.content!==content)
    submission={name:label,content,requestId:client.newRequestId()};
   filename.textContent=/\.json$/i.test(label)?label:label+'.json';
   message('');showStep('confirm');
  }catch(error){message(error.message);}
 });
 async function saveConfirmed(){
  if(busy||mode!=='confirm'||!submission)return;
  try{
   unchanged();
   setBusy(true);message('Guardando en la biblioteca…');
   const result=await client.save(submission);
   if(!result.file?.id)throw Error('La biblioteca no confirmó el archivo guardado.');
   finish('Tu diagrama ya está en la biblioteca pública','Se guardó una copia nueva de «'+filename.textContent+'». Puedes consultarla en Biblioteca.');
   toast('Se guardó una copia nueva en la biblioteca.');
  }catch(error){message(error.message+' El diagrama sigue abierto. Puedes reintentar con «Sí» o volver con «No»; el reintento conserva la misma solicitud.');}
  finally{setBusy(false);if(mode==='done')find('[data-library-done]').focus();}
 }
 find('[data-library-continue]').addEventListener('click',()=>{
  if(!busy&&mode==='terms'){message('');showStep('name');}
 });
 find('[data-library-export]').addEventListener('click',()=>{
  if(busy||mode!=='terms')return;
  try{
   unchanged();graphFiles.exportJson();
   finish('Tu archivo se exportó en este dispositivo','Se descargó el JSON completo. No se envió a la biblioteca pública. Puedes continuar después con Importar JSON.');
   find('[data-library-done]').focus();
  }catch(error){message(error.message);}
 });
 find('[data-library-no]').addEventListener('click',()=>{
  if(!busy&&mode==='confirm'){message('');showStep('name');}
 });
 find('[data-library-back]').addEventListener('click',()=>{
  if(!busy&&mode==='name'){message('');showStep('terms');}
 });
 find('[data-library-yes]').addEventListener('click',()=>void saveConfirmed());
 const closeDialog=()=>{if(!busy)dialog.close();};
 close.addEventListener('click',closeDialog);
 find('[data-library-done]').addEventListener('click',closeDialog);
 dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
 dialog.addEventListener('close',()=>{mode=null;submission=null;});
 more.addEventListener('click',()=>void loadPage());
 saveButton.onclick=()=>open('terms');openButton.onclick=()=>open('list');
}
