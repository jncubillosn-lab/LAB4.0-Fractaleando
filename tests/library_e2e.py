"""Library UI acceptance against a simulated service; no Google account needed."""
import http.server, threading, os, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(os.environ.get('P1_SITE_ROOT',Path(__file__).resolve().parents[1]))
ENDPOINT='https://script.google.com/macros/s/library-test/exec'
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)

with http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet) as server:
 threading.Thread(target=server.serve_forever,daemon=True).start()
 with sync_playwright() as p:
  browser=p.chromium.launch(**({'executable_path':os.environ['P1_BROWSER_PATH']} if os.environ.get('P1_BROWSER_PATH') else {'channel':'chrome'}),headless=True)
  context=browser.new_context(accept_downloads=True,viewport={'width':1360,'height':820})
  context.route('**/js/data/LibraryConfig.js*',lambda route:route.fulfill(content_type='text/javascript',body='export const libraryConfig={deploymentUrl:'+json.dumps(ENDPOINT)+'};'))
  calls=[];files=[]
  def service(route):
   request=json.loads(route.request.post_data);calls.append(request)
   action=request['action']
   if action=='save':
    found=next((f for f in files if f['requestId']==request['requestId']),None)
    if not found:
     found={'id':'file_'+str(len(files)+1),'name':request['name']+'.json','createdTime':'2026-11-16T00:00:00Z','content':request['content'],'requestId':request['requestId']};files.append(found)
    result={'file':{k:found[k] for k in ['id','name','createdTime']}}
   elif action=='list':result={'files':[{k:f[k] for k in ['id','name','createdTime']} for f in files],'nextCursor':None}
   else:
    found=next(f for f in files if f['id']==request['id']);result={'file':{'id':found['id']},'content':found['content']}
   route.fulfill(content_type='application/json',headers={'Access-Control-Allow-Origin':'*'},body=json.dumps({'ok':True,**result}))
  context.route(ENDPOINT,service)
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda dialog:dialog.accept())
  url=f'http://127.0.0.1:{server.server_address[1]}/index.html'
  page.goto(url)
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.initialBuilds===1&&document.querySelector("#loadingIndicator").hidden')
  assert calls==[]
  page.locator('#nodeText').fill('Mi núcleo compartido');page.locator('#nodeText').press('Tab')
  page.wait_for_function('document.querySelector("#nodes .node")?.getAttribute("aria-label")==="Mi núcleo compartido"')
  with page.expect_download() as downloaded:page.locator('#jsonBtn').click()
  expected=Path(downloaded.value.path()).read_text(encoding='utf-8')
  page.locator('#cloudSaveBtn').click()
  dialog=page.locator('#libraryDialog');assert dialog.is_visible()
  assert dialog.locator('input').count()==1 and dialog.locator('input[type=file]').count()==0
  dialog.locator('input').fill('Diagrama compartido');dialog.locator('button[type=submit]').click()
  page.wait_for_function('!document.querySelector("#libraryDialog").open')
  assert len(files)==1 and files[0]['content']==expected
  assert set(calls[-1])=={'action','name','content','requestId'}
  page.locator('#newBtn').click()
  page.wait_for_function('document.querySelector("#nodes .node")?.getAttribute("aria-label")==="¿Qué quieres fractalear hoy?"')
  page.locator('#libraryBtn').click();dialog.get_by_role('button',name='Diagrama compartido.json',exact=True).click()
  page.wait_for_function('!document.querySelector("#libraryDialog").open&&document.querySelector("#nodes .node")?.getAttribute("aria-label")==="Mi núcleo compartido"')
  assert [r['action'] for r in calls]==['save','list','read']
  assert not errors,errors
  output=os.environ.get('P1_SCREENSHOTS')
  if output:
   Path(output).mkdir(parents=True,exist_ok=True);page.locator('#cloudSaveBtn').click()
   page.screenshot(path=str(Path(output)/'Fractalear_biblioteca_preparada.png'))
  print('Biblioteca simulada: sin llamadas al arrancar; solo nombre; JSON idéntico; guardar, listar y abrir con el lector actual.',flush=True)
  browser.close()
 server.shutdown()
