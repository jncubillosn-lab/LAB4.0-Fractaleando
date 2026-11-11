"""Validación transaccional: el arrastre no puede invertir relaciones topológicas de 01."""
import http.server,socketserver,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
with socketserver.TCPServer(('127.0.0.1',0),Quiet) as srv:
 threading.Thread(target=srv.serve_forever,daemon=True).start()
 with sync_playwright() as p:
  browser=p.chromium.launch(channel='chrome', headless=True)
  page=browser.new_page(viewport={'width':1440,'height':900})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:'+str(srv.server_address[1])+'/index.html',wait_until='domcontentloaded')
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.routes===3',timeout=60000)
  node=page.locator('#nodes [data-node-id="p1"]')
  original=node.get_attribute('transform')
  box=node.bounding_box()
  assert box is not None
  x=box['x']+box['width']/2;y=box['y']+box['height']/2
  # El núcleo originalmente está por encima de sus hijos J1. Desplazarlo
  # por debajo invertiría ese orden y no debe consolidarse.
  page.mouse.move(x,y)
  page.mouse.down()
  page.mouse.move(x,y+330,steps=12)
  page.mouse.up()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.checkpoint>=2',timeout=60000)
  now=node.get_attribute('transform')
  info=page.evaluate('({topology:window.P1_PLANO_DIAGNOSTICO.topology(),audit:window.P1_PLANO_DIAGNOSTICO.audit(),last:window.P1_PLANO_DIAGNOSTICO.lastOperation})')
  print('ARRASTRE_TOPOLOGICO',info,'before',original,'after',now,flush=True)
  assert info['topology']['valid'],info
  assert info['audit']['invalid']==0 and info['audit']['portsRepeated']==0,info
  assert 'rechazado' in info['last'].lower(),info
  assert now==original,(now,original)
  assert not errors,errors
  browser.close()
 srv.shutdown()
