"""Audit regressions through the real Editor, file controls and both derived views."""
import http.server, threading, json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(os.environ.get('P1_SITE_ROOT',Path(__file__).resolve().parents[1]/'_site'))
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)

with http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet) as srv:
 threading.Thread(target=srv.serve_forever,daemon=True).start()
 with sync_playwright() as p:
  browser=p.chromium.launch(**({'executable_path':os.environ['P1_BROWSER_PATH']} if os.environ.get('P1_BROWSER_PATH') else {'channel':'chrome'}),headless=True)
  page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  errors=[];downloads=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.on('download',lambda d:downloads.append(d))
  page.add_init_script('''(()=>{
   const NativeWorker=window.Worker;let delay=true;
   window.Worker=class extends NativeWorker{
    constructor(url,options){super(url,options);
     if(delay&&String(url).includes('initial-route.worker.js')){
      delay=false;const send=this.postMessage.bind(this);
      this.postMessage=(...args)=>{window.__resumeRouting=()=>send(...args)};
     }
    }
   };
  })()''')
  page.goto('http://127.0.0.1:'+str(srv.server_address[1])+'/index.html',wait_until='domcontentloaded')
  page.wait_for_function('typeof window.__resumeRouting==="function"')
  for button in ['pngBtn','svgBtn']:
   page.locator('#'+button).click()
   page.wait_for_function('document.querySelector("#toast").textContent.includes("Espera a que termine")')
   assert not downloads,'An incomplete scene was downloaded'
  page.evaluate('()=>{window.__resumeRouting();delete window.__resumeRouting}')
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.initialBuilds===1&&document.querySelectorAll("#nodes .node").length===1',timeout=30000)
  page.locator('#resetBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.routes===217',timeout=60000)
  def graph():
   with page.expect_download() as d:page.locator('#jsonBtn').click()
   return json.loads(Path(d.value.path()).read_text(encoding='utf8'))
  def wait_editor(nodes,routes):
   page.wait_for_function('([n,r])=>document.querySelectorAll("#nodes .node").length===n&&window.P1_PLANO_DIAGNOSTICO.routes===r&&window.P1_PLANO_DIAGNOSTICO.pending===0',arg=[nodes,routes],timeout=30000)
  fixture=Path(__file__).parent/'fixtures'/'word-wrap-0.2.10.json'
  page.locator('#fileInput').set_input_files(fixture);wait_editor(4,3)
  page.locator('#nodes [data-node-id="b0"]').click();page.locator('#addBtn').click();wait_editor(5,4)
  for count in [5,6]:
   before=graph()
   positions={n['id']:(n['x'],n['y']) for n in before['nodes']}
   page.locator('#fileInput').set_input_files(fixture);wait_editor(4,3)
   page.locator('#undoBtn').click();wait_editor(count,count-1)
   restored=graph()
   assert {n['id']:(n['x'],n['y']) for n in restored['nodes']}==positions
   page.locator('#addBtn').click();wait_editor(count+1,count)
   current=graph();ids=[n['id'] for n in current['nodes']]
   assert len(ids)==len(set(ids))
   assert len({tuple(sorted([e['from'],e['to']])) for e in current['edges']})==len(current['edges'])
  invalid=graph();invalid['edges'].append(dict(invalid['edges'][0]))
  page.locator('#fileInput').set_input_files({'name':'duplicate.json','mimeType':'application/json','buffer':json.dumps(invalid).encode()})
  page.wait_for_function('document.querySelector("#toast").textContent.includes("duplicados")')
  wait_editor(7,6)
  # Saving in the same event turn as a size-changing edit must flush geometry.
  page.locator('#nodes [data-node-id="n3"]').click()
  with page.expect_download() as saved:
   page.locator('#nodeText').evaluate('''el=>{el.value='Electroencefalografistainternacional';el.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#jsonBtn').click()}''')
  saved_graph=json.loads(Path(saved.value.path()).read_text(encoding='utf8'))
  page.locator('#fileInput').set_input_files(saved.value.path());wait_editor(7,6)
  assert {n['id']:(n['x'],n['y']) for n in graph()['nodes']}=={n['id']:(n['x'],n['y']) for n in saved_graph['nodes']}
  special=json.loads(fixture.read_text(encoding='utf8'))
  names=['constructor','toString','__proto__'];mapping=dict(zip(['b0','f0','t0'],names))
  for node in special['nodes']:
   node['id']=mapping.get(node['id'],node['id'])
   node['text']=node['id'];node['parent']=mapping.get(node['parent'],node['parent'])
  for edge in special['edges']:edge['to']=mapping.get(edge['to'],edge['to'])
  for field in ['planeCheckpoint','topologyRegister','derivedViews']:special.pop(field,None)
  page.locator('#fileInput').set_input_files({'name':'special-ids.json','mimeType':'application/json','buffer':json.dumps(special).encode()})
  wait_editor(4,3)
  assert set(page.locator('#nodes .node').evaluate_all('(els)=>els.map(el=>el.dataset.nodeId)'))==set(['p1']+names)
  for mode in ['02','04']:
   page.locator('[data-view="'+mode+'"]').click()
   page.wait_for_function('(m)=>window.P1_PLANO_DIAGNOSTICO.views().current?.mode===m||document.querySelector("#derivedStatus").textContent.startsWith("No se completó")',arg=mode,timeout=30000)
   assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.views().current?.mode')==mode,page.locator('#derivedStatus').inner_text()
   assert page.locator('#derivedNodes .node').count()==4
   assert page.locator('#derivedLines .svgline').count()==3
  assert not errors,errors
  print('Integridad: exportación en carga, importar/deshacer/crear, geometría guardada, duplicados e IDs especiales en las tres vistas',flush=True)
  browser.close()
 srv.shutdown()
