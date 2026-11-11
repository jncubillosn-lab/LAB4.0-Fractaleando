"""Browser acceptance tests against the actual relative ES module URLs of GitHub Pages."""
import http.server, socketserver, threading, time
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
  b=p.chromium.launch(headless=True)
  page=b.new_page(viewport={'width':1360,'height':820},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url,wait_until='domcontentloaded');page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.routes === 3',timeout=30000)
  page.locator('#showAllBtn').click();page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.routes === 217',timeout=30000)
  d=page.evaluate('window.P1_PLANO_DIAGNOSTICO.audit()')
  assert d['boxes']==d['invalid']==d['portsRepeated']==0,d
  assert page.locator('#lines circle').count()==d['crossings']
  before=page.evaluate('window.P1_PLANO_DIAGNOSTICO.routeCalculations')
  page.locator('#depth').evaluate('(e)=>{e.value="1";e.dispatchEvent(new Event("input",{bubbles:true}))}')
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.routeCalculations')==before
  page.locator('[data-node-id="p1"]').evaluate('(e)=>e.dispatchEvent(new MouseEvent("click",{bubbles:true}))')
  page.locator('#addBtn').click();page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.checkpoint>=2',timeout=30000)
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.pending')==0
  with page.expect_download() as download:page.locator('#jsonBtn').click()
  assert download.value.suggested_filename.endswith('.json')
  assert not errors,errors
  b.close()
 srv.shutdown()
