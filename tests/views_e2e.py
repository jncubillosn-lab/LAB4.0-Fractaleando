"""Ensayos E2E de las tres vistas reales en navegador y tema oscuro."""
import http.server, socketserver, threading, json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
with socketserver.TCPServer(('127.0.0.1',0),Quiet) as srv:
 threading.Thread(target=srv.serve_forever,daemon=True).start()
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  page.on('dialog',lambda dialog:dialog.accept())
  errors=[];page.on('pageerror',lambda exc:errors.append(str(exc)))
  page.goto('http://127.0.0.1:'+str(srv.server_address[1])+'/index.html',wait_until='domcontentloaded')
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.routes===3',timeout=60000)
  page.locator('#showAllBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.routes===217',timeout=60000)
  baseline=page.evaluate('window.P1_PLANO_DIAGNOSTICO.topology()')
  original=page.locator('#nodes [data-node-id="p1"]').get_attribute('transform')
  assert baseline['valid'] and baseline['crossings']==71
  # Visitas conservan el grafo y puntos de control independientes.
  for mode in ('02','03','04'):
   page.locator('[data-view="'+mode+'"]').click()
   page.wait_for_function('(mode)=>window.P1_PLANO_DIAGNOSTICO.views().mode===mode && window.P1_PLANO_DIAGNOSTICO.views().current!==null',mode,timeout=90000)
   result=page.evaluate('window.P1_PLANO_DIAGNOSTICO.views().current')
   print('VISTA',mode,json.dumps(result,ensure_ascii=False)[:1800],flush=True)
   assert result['nodes']==210,result
   assert result['overlaps']==0,result
   if mode in ('03','04'):assert result['radialOrder'],result
   assert result['audit']['boxes']==0,result
   assert result['audit']['invalid']==0,result
   assert result['topology']['hasReference'],result
   # El filtro de profundidad no vuelve a calcular el enrutamiento.
   before=page.evaluate('window.P1_PLANO_DIAGNOSTICO.routeCalculations')
   page.locator('#depth').evaluate('(el)=>{el.value="1";el.dispatchEvent(new Event("input",{bubbles:true}))}')
   assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.routeCalculations')==before
   page.locator('#showAllBtn').click()
  page.locator('#themeBtn').click()
  assert page.locator('#themeBtn').get_attribute('aria-pressed')=='true'
  bg=page.locator('body').evaluate('(el)=>getComputedStyle(el).backgroundColor')
  assert bg=='rgb(23, 25, 23)',bg
  page.locator('#themeBtn').click()
  assert page.locator('#themeBtn').get_attribute('aria-pressed')=='false'
  page.locator('[data-view="01"]').click()
  assert page.locator('#nodes [data-node-id="p1"]').get_attribute('transform')==original
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.topology().crossings')==71
  # Cuarto brazo J1 sin asumir que el origen siempre tiene tres.
  page.locator('#newBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.routes===3',timeout=60000)
  page.locator('#nodes [data-node-id="p1"]').click()
  page.locator('#addBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.routes===4',timeout=60000)
  page.locator('[data-view="04"]').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.views().current!==null',timeout=60000)
  four=page.evaluate('window.P1_PLANO_DIAGNOSTICO.views().current')
  assert four['arms']==4 and four['nodes']==5 and four['radialOrder'] and four['overlaps']==0,four
  print('VISTA_CUATRO_BRAZOS',json.dumps(four,ensure_ascii=False)[:1500],flush=True)
  page.locator('[data-view="01"]').click()
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.pending')==0
  assert not errors,errors
  browser.close()
 srv.shutdown()
