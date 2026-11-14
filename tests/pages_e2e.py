"""Browser acceptance tests against the actual relative ES module URLs of GitHub Pages."""
import http.server, socketserver, threading, time, json, math, re
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ.get('P1_SITE_ROOT',Path(__file__).resolve().parents[1]))
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
with http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet) as srv:
 threading.Thread(target=srv.serve_forever,daemon=True).start()
 url=f'http://127.0.0.1:{srv.server_address[1]}/index.html'
 with sync_playwright() as p:
  b=p.chromium.launch(**({'executable_path':os.environ['P1_BROWSER_PATH']} if os.environ.get('P1_BROWSER_PATH') else {'channel':'chrome'}), headless=True)
  page=b.new_page(viewport={'width':1360,'height':820},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url,wait_until='domcontentloaded');page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.routes === 3',timeout=30000)
  page.locator('#showAllBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.visible === 210',timeout=30000)
  d0=page.evaluate('({...window.P1_PLANO_DIAGNOSTICO,audit:window.P1_PLANO_DIAGNOSTICO.audit()})')
  print('DIAGNOSTICO_NAVEGADOR', {k:d0[k] for k in ['visible','routes','pending','lastOperation','lastDurationMs','initialBuilds','routeCalculations']},d0['audit'],errors,flush=True)
  assert d0['routes']==217 and d0['pending']==0, d0
  d=page.evaluate('window.P1_PLANO_DIAGNOSTICO.audit()')
  assert d['boxes']==d['invalid']==d['portsRepeated']==0,d
  assert page.locator('#lines circle').count()==d['crossings']
  t=page.evaluate('window.P1_PLANO_DIAGNOSTICO.topology()')
  assert t['valid'] and t['crossings']==d['crossings'] and t['referenceEdges']==217,t
  assert t['ports']==434,t
  print('TOPOLOGIA_INICIAL',t,flush=True)
  before=page.evaluate('window.P1_PLANO_DIAGNOSTICO.routeCalculations')
  page.locator('#depth').evaluate('(e)=>{e.value="1";e.dispatchEvent(new Event("input",{bubbles:true}))}')
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.routeCalculations')==before
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.topology().crossings')==t['crossings']
  page.locator('[data-node-id="p1"]').evaluate('(e)=>e.dispatchEvent(new MouseEvent("click",{bubbles:true}))')
  page.locator('#addBtn').click();page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.checkpoint>=2',timeout=30000)
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.pending')==0
  after=page.evaluate('window.P1_PLANO_DIAGNOSTICO.topology()')
  assert after['valid'] and after['referenceEdges']==218,after
  with page.expect_download() as download:page.locator('#jsonBtn').click()
  assert download.value.suggested_filename.endswith('.json')
  data=json.loads(Path(download.value.path()).read_text(encoding='utf8'))
  assert data['schema']=='p1.graph.v1'
  assert data['topologyRegister']['schema']=='p1.topology.v1'
  assert len(data['topologyRegister']['edges'])==218
  assert data['topologyRegister']['crossings']
  page.locator('#fileInput').set_input_files(download.value.path())
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.topology().referenceEdges === 218',timeout=30000)
  restored=page.evaluate('window.P1_PLANO_DIAGNOSTICO.topology()')
  assert restored['valid'] and restored['crossings']==after['crossings'],restored
  page.on('dialog',lambda dialog:dialog.accept())
  builds_before=page.evaluate('window.P1_PLANO_DIAGNOSTICO.initialBuilds')
  page.locator('#newBtn').click()
  page.wait_for_function('(previous)=>window.P1_PLANO_DIAGNOSTICO.initialBuilds>previous&&window.P1_PLANO_DIAGNOSTICO.routes===3&&document.querySelectorAll("#nodes .node").length===4',arg=builds_before,timeout=30000)
  page.locator('#nodes [data-node-id="b0"]').click()
  original=page.locator('#nodes .node').evaluate_all('(els)=>Object.fromEntries(els.map(el=>[el.dataset.nodeId,el.getAttribute("transform")]))')
  parent_text=page.locator('#nodeText').input_value()
  # Repeated clicks in one frame must create siblings, with independent slots.
  page.locator('#addBtn').evaluate('(el)=>{for(let i=0;i<12;i++)el.click()}')
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.routes===15',timeout=30000)
  assert page.locator('#nodes .selected').get_attribute('data-node-id')=='b0'
  assert page.locator('#nodeText').input_value()==parent_text
  assert page.evaluate('document.activeElement.id')!='nodeText'
  for node_id,transform in original.items():
   actual=page.locator('#nodes [data-node-id="'+node_id+'"]').get_attribute('transform')
   old_xy=[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',transform)]
   new_xy=[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',actual)]
   assert all(abs(a-b)<.011 for a,b in zip(old_xy,new_xy)),{'id':node_id,'before':transform,'after':actual}
  with page.expect_download() as siblings:page.locator('#jsonBtn').click()
  graph=json.loads(Path(siblings.value.path()).read_text(encoding='utf8'))
  parent=next(n for n in graph['nodes'] if n['id']=='b0')
  children=[n for n in graph['nodes'] if n['parent']=='b0']
  assert len(children)==12 and all(n['branch']==parent['branch'] for n in children),children
  hours=[round((math.atan2(n['x']-parent['x'],parent['y']-n['y'])*6/math.pi+12)%12)%12 for n in children]
  assert hours==[0,5,10,3,8,1,6,11,4,9,2,7],hours
  routes={r['key']:r for r in graph['planeCheckpoint']['routes']}
  child_routes=[routes['b0|'+n['id']] for n in children]
  assert {r['toPort']['side'] for r in child_routes}=={'top','right','bottom','left'},child_routes
  for hour,side in [(0,'bottom'),(3,'left'),(6,'top'),(9,'right')]:
   assert child_routes[hours.index(hour)]['toPort']['side']==side,child_routes[hours.index(hour)]
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.pending')==0
  page.locator('#undoBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.routes===14',timeout=30000)
  assert page.locator('#nodes .selected').get_attribute('data-node-id')=='b0'
  with page.expect_download() as undone:page.locator('#jsonBtn').click()
  undo_graph=json.loads(Path(undone.value.path()).read_text(encoding='utf8'))
  positions={n['id']:(n['x'],n['y']) for n in graph['nodes']}
  assert all(positions[n['id']]==(n['x'],n['y']) for n in undo_graph['nodes']),undo_graph
  print('Más concepto: doce hermanos, entradas por las cuatro caras y cardinales enfrentados; selección y deshacer estables',flush=True)
  assert not errors,errors
  b.close()
 srv.shutdown()
