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
 const submit=form.querySelector('button[type="submit"]');
 let busy=false,cursor=null,selectedDocument=null,submission=null;
 const message=text=>{status.textContent=text;};
 function setBusy(value){
  busy=value;dialog.setAttribute('aria-busy',String(value));
  close.disabled=value;submit.disabled=value;name.disabled=value;more.disabled=value;
  for(const button of list.querySelectorAll('button'))button.disabled=value;
 }
 function open(mode){
  selectedDocument=documentKey();submission=null;cursor=null;list.replaceChildren();
  form.hidden=mode!=='save';list.hidden=mode==='save';more.hidden=true;
  heading.textContent=mode==='save'?'Guardar en biblioteca':'Biblioteca pública';
  message('');setBusy(false);dialog.showModal();
  if(mode==='save'){name.value='';name.focus();}else void loadPage();
 }
 function unchanged(){
  if(selectedDocument!==documentKey())throw Error('El diagrama cambió durante la consulta. Vuelve a abrir la biblioteca.');
 }
 async function loadPage(){
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
  if(busy)return;
  if(!confirm('¿Abrir «'+file.name+'»? Guarda antes tu diagrama actual si deseas conservarlo.'))return;
  setBusy(true);message('Abriendo el diagrama…');
  try{
   const result=await client.read(file.id);unchanged();
   if(typeof result.content!=='string')throw Error('El archivo recibido no es válido.');
   graphFiles.openText(result.content);dialog.close();
  }catch(error){message(error.message);}
  finally{setBusy(false);}
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  try{
   unchanged();
   const label=name.value.trim();if(!label){name.focus();return;}
   const content=graphFiles.serialize();
   if(!submission||submission.name!==label||submission.content!==content)
    submission={name:label,content,requestId:client.newRequestId()};
   setBusy(true);message('Guardando en la biblioteca…');
   const result=await client.save(submission);
   if(!result.file?.id)throw Error('La biblioteca no confirmó el archivo guardado.');
   dialog.close();submission=null;toast('Se guardó una copia nueva en la biblioteca.');
  }catch(error){message(error.message+' El diagrama sigue abierto; puedes reintentar o guardar el JSON local.');}
  finally{setBusy(false);}
 });
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
 more.addEventListener('click',()=>void loadPage());
 saveButton.onclick=()=>open('save');openButton.onclick=()=>open('list');
}
