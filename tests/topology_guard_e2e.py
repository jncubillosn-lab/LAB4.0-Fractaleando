"""El editor cambia la geometría local; las vistas derivadas mantienen su protección."""
import http.server,threading,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ.get('P1_SITE_ROOT',Path(__file__).resolve().parents[1]))
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
with http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet) as srv:
 threading.Thread(target=srv.serve_forever,daemon=True).start()
 with sync_playwright() as p:
  browser=p.chromium.launch(**({'executable_path':os.environ['P1_BROWSER_PATH']} if os.environ.get('P1_BROWSER_PATH') else {'channel':'chrome'}),headless=True)
  page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.goto('http://127.0.0.1:'+str(srv.server_address[1])+'/index.html',wait_until='domcontentloaded')
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.initialBuilds===1&&document.querySelectorAll("#nodes .node").length===1',timeout=30000)
  page.locator('#fileInput').set_input_files(Path(__file__).parent/'fixtures'/'three-branches.json')
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.routes===3&&document.querySelectorAll("#nodes .node").length===4',timeout=60000)
  page.locator('#nodes [data-node-id="b0"]').click();page.locator('#addBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.routes===4',timeout=30000)
  def graph():
   with page.expect_download() as d:page.locator('#jsonBtn').click()
   return json.loads(Path(d.value.path()).read_text(encoding='utf8'))
  before=graph();builds=page.evaluate('window.P1_PLANO_DIAGNOSTICO.initialBuilds')
  source_routes={r['key']:r for r in before['planeCheckpoint']['routes']}
  node=page.locator('#nodes [data-node-id="p1"]');original=node.get_attribute('transform');box=node.bounding_box()
  bottom=max(page.locator('#nodes .node').evaluate_all('(els)=>els.map(el=>el.getBoundingClientRect().bottom)'))
  stage=page.locator('#stage').bounding_box();target_y=bottom+100
  assert target_y+box['height']/2<stage['y']+stage['height'],(target_y,stage)
  checkpoint_before_drag=page.evaluate('window.P1_PLANO_DIAGNOSTICO.checkpoint')
  page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down()
  page.mouse.move(box['x']+box['width']/2,target_y,steps=12);page.mouse.up()
  page.wait_for_function('(previous)=>window.P1_PLANO_DIAGNOSTICO.checkpoint>previous',arg=checkpoint_before_drag,timeout=30000)
  after=graph();info=page.evaluate('({pending:window.P1_PLANO_DIAGNOSTICO.pending,affected:window.P1_PLANO_DIAGNOSTICO.lastAffectedRoutes,builds:window.P1_PLANO_DIAGNOSTICO.initialBuilds,audit:window.P1_PLANO_DIAGNOSTICO.audit(),topology:window.P1_PLANO_DIAGNOSTICO.topology()})')
  assert node.get_attribute('transform')!=original
  assert after['edges']==before['edges']
  assert [(n['id'],n.get('parent')) for n in after['nodes']]==[(n['id'],n.get('parent')) for n in before['nodes']]
  nodes={n['id']:n for n in after['nodes']};assert nodes['p1']['y']>nodes['f0']['y']
  routes={r['key']:r for r in after['planeCheckpoint']['routes']}
  assert routes['f0|p1']['fromPort']['side']=='top',routes['f0|p1']
  assert routes['f0|p1']['toPort']['side']=='bottom',routes['f0|p1']
  assert routes['b0|n1']==source_routes['b0|n1']
  assert info['builds']==builds and info['affected']<len(after['edges']),info
  assert info['pending']==0 and info['audit']['invalid']==info['audit']['boxes']==info['audit']['portsRepeated']==0,info
  assert info['topology']['valid'],info
  page.locator('#undoBtn').click();page.wait_for_function('(t)=>document.querySelector("#nodes [data-node-id=p1]").getAttribute("transform")===t',arg=original)
  for mode in ('02','04'):
   page.locator('[data-view="'+mode+'"]').click()
   page.wait_for_function('(m)=>window.P1_PLANO_DIAGNOSTICO.views().current?.mode===m||document.querySelector("#derivedStatus").textContent.startsWith("No se completó")',arg=mode,timeout=120000)
   assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.views().current?.mode')==mode,page.locator('#derivedStatus').inner_text()
   child=page.locator('#derivedNodes [data-node-id="f0"]');position=child.get_attribute('transform');b=child.bounding_box()
   page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2);page.mouse.down();page.mouse.move(b['x']+b['width']/2+70,b['y']+b['height']/2+70,steps=8);page.mouse.up()
   assert child.get_attribute('transform')==position
   assert page.locator('#nodeText').is_disabled() and page.locator('#addBtn').is_disabled()
  print('Editor libre: cruza posiciones, adapta ambas caras, conserva vínculos y ruta ajena, deshace sin reconstrucción global; 02/03 protegidos',flush=True)
  # Import from 03 with a damaged optional checkpoint: recover the concepts
  # and return to a truly editable 01, rather than only changing its heading.
  fixture=Path(__file__).parent/'fixtures'/'word-wrap-0.2.10.json'
  damaged=json.loads(fixture.read_text(encoding='utf8'))
  damaged['planeCheckpoint']['positions']=[None]
  page.locator('#fileInput').set_input_files({'name':'damaged-checkpoint.json','mimeType':'application/json','buffer':json.dumps(damaged).encode()})
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.views().mode==="01"&&window.P1_PLANO_DIAGNOSTICO.routes===3&&document.querySelectorAll("#nodes .node").length===4',timeout=30000)
  assert not page.locator('#addBtn').is_disabled()
  page.locator('#nodes [data-node-id="b0"]').click();page.locator('#addBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.routes===4',timeout=30000)
  page.locator('[data-view="02"]').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.views().current?.mode==="02"',timeout=30000)
  page.locator('#newBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.views().mode==="01"&&window.P1_PLANO_DIAGNOSTICO.routes===0&&document.querySelectorAll("#nodes .node").length===1',timeout=30000)
  # Cancel a running calculation and immediately start another one.
  page.locator('[data-view="04"]').evaluate("""el=>{el.click();document.querySelector('[data-view="01"]').click()}""")
  page.locator('[data-view="02"]').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.views().current?.mode==="02"',timeout=30000)
  assert page.locator('#derivedNodes .node').count()==1
  page.locator('[data-view="01"]').click()
  # A worker that cannot start must keep the existing main-thread fallback.
  page.evaluate('''()=>{window.__savedWorker=window.Worker;window.Worker=class {constructor(){throw new DOMException("test unavailable","AbortError")}}}''')
  page.locator('#newBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.routes===0&&document.querySelectorAll("#nodes .node").length===1',timeout=30000)
  page.evaluate('()=>{window.Worker=window.__savedWorker;delete window.__savedWorker}')
  page.locator('#nodes [data-node-id="p1"]').click();page.locator('#addBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.routes===1',timeout=30000)
  assert not page.locator('#nodeText').is_disabled()
  print('Ciclo de vida: importar desde 03, Nueva desde 02, caché dañada, cancelación y fallback conservan la edición',flush=True)
  assert not errors,errors
  browser.close()
 srv.shutdown()
