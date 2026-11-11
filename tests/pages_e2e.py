"""Browser acceptance tests against the actual relative ES module URLs of GitHub Pages."""
import http.server, socketserver, threading, time, json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
with socketserver.TCPServer(('127.0.0.1',0),Quiet) as srv:
 threading.Thread(target=srv.serve_forever,daemon=True).start()
 url=f'http://127.0.0.1:{srv.server_address[1]}/index.html'
 with sync_playwright() as p:
  b=p.chromium.launch(channel='chrome', headless=True)
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
  assert not errors,errors
  b.close()
 srv.shutdown()
