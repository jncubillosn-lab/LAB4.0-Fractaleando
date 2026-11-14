"""Browser acceptance tests against the actual relative ES module URLs of GitHub Pages."""
import http.server, socketserver, threading, time, json, math, re, struct, hashlib
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
  page.add_init_script('''window.__textMeasures=0;const measure=CanvasRenderingContext2D.prototype.measureText;
   CanvasRenderingContext2D.prototype.measureText=function(...args){window.__textMeasures++;return measure.apply(this,args)};''')
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda message:print('NAVEGADOR',message.type,message.text,flush=True) if message.type=='error' else None)
  page.goto(url,wait_until='domcontentloaded');page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.routes===217',timeout=30000)
  assert page.locator('#depth').input_value()==page.locator('#depth').get_attribute('max')
  assert page.locator('[data-view="01"]').inner_text()=='01 · Editor'
  assert page.locator('[data-view="02"]').inner_text()=='02 · Compacto'
  assert page.locator('[data-view="04"]').inner_text()=='03 · Espiral'
  page.locator('#showAllBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.visible === 210',timeout=30000)
  d0=page.evaluate('({...window.P1_PLANO_DIAGNOSTICO,audit:window.P1_PLANO_DIAGNOSTICO.audit()})')
  initial_picture=page.locator('#nodes .node,#lines .svgline').evaluate_all('(els)=>els.map(el=>[el.getAttribute("transform"),el.getAttribute("d"),el.getAttribute("aria-label"),el.querySelector("rect")?.outerHTML,[...el.querySelectorAll("tspan")].map(t=>t.outerHTML)])')
  print('PERFORMANCE_STARTUP',json.dumps({**page.evaluate('({startupMs:performance.now(),textMeasures:window.__textMeasures})'),
   'routingMs':d0['lastDurationMs'],'attempts':d0['routeCalculations'],
   'pictureSHA256':hashlib.sha256(json.dumps(initial_picture,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()}),flush=True)
  print('DIAGNOSTICO_NAVEGADOR', {k:d0[k] for k in ['visible','routes','pending','lastOperation','lastDurationMs','initialBuilds','routeCalculations']},d0['audit'],errors,flush=True)
  assert d0['routes']==217 and d0['pending']==0, d0
  d=page.evaluate('window.P1_PLANO_DIAGNOSTICO.audit()')
  assert d['boxes']==d['invalid']==d['portsRepeated']==0,d
  assert page.locator('#lines circle').count()==d['crossings']
  assert page.locator('#lines mask').count()>0
  assert page.locator('#lines .svgline').evaluate_all('(els)=>els.every(el=>!/[QC]/.test(el.getAttribute("d")))')
  assert page.locator('#nodes .node text').evaluate_all('(els)=>new Set(els.map(el=>getComputedStyle(el).fontSize)).size===1&&getComputedStyle(els[0]).fontSize==="24px"')
  t=page.evaluate('window.P1_PLANO_DIAGNOSTICO.topology()')
  assert t['valid'] and t['crossings']==d['crossings'] and t['referenceEdges']==217,t
  assert t['ports']==434,t
  print('TOPOLOGIA_INICIAL',t,flush=True)
  before=page.evaluate('window.P1_PLANO_DIAGNOSTICO.routeCalculations')
  page.locator('#depth').evaluate('(e)=>{e.value="1";e.dispatchEvent(new Event("input",{bubbles:true}))}')
  camera_before=page.locator('#camera').get_attribute('transform')
  with page.expect_download() as png:page.locator('#pngBtn').click()
  raw=Path(png.value.path()).read_bytes()
  assert raw[:8]==b'\x89PNG\r\n\x1a\n'
  assert max(struct.unpack('>II',raw[16:24]))==4096
  png_info=page.evaluate('window.P1_PLANO_DIAGNOSTICO.pngExport')
  assert png_info['nodes']==210 and png_info['edges']==217,png_info
  assert png_info['fontPixels']>=10,png_info
  assert page.locator('#depth').input_value()=='1'
  assert page.locator('#camera').get_attribute('transform')==camera_before
  print('PNG 4K completo con 210 conceptos aunque se filtre la pantalla; letra',png_info['fontPixels'],flush=True)
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
  page.wait_for_function('document.querySelectorAll("#nodes .node").length===16',timeout=30000)
  with page.expect_download() as siblings:page.locator('#jsonBtn').click()
  graph=json.loads(Path(siblings.value.path()).read_text(encoding='utf8'))
  pending=[r['key'] for r in graph['planeCheckpoint']['routes'] if not r['points']]
  assert not pending,{'pending':pending,'nodes':[{k:n.get(k) for k in ['id','x','y','clockStep']} for n in graph['nodes']]}
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.routes')==15
  assert page.locator('#nodes .selected').get_attribute('data-node-id')=='b0'
  assert page.locator('#nodeText').input_value()==parent_text
  assert page.evaluate('document.activeElement.id')!='nodeText'
  for node_id,transform in original.items():
   actual=page.locator('#nodes [data-node-id="'+node_id+'"]').get_attribute('transform')
   old_xy=[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',transform)]
   new_xy=[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',actual)]
   assert all(abs(a-b)<.011 for a,b in zip(old_xy,new_xy)),{'id':node_id,'before':transform,'after':actual}
  parent=next(n for n in graph['nodes'] if n['id']=='b0')
  children=[n for n in graph['nodes'] if n['parent']=='b0']
  assert len(children)==12 and all(n['branch']==parent['branch'] for n in children),children
  hours=[round((math.atan2(n['x']-parent['x'],parent['y']-n['y'])*12/math.pi+24)%24)%24 for n in children]
  steps=[n['clockStep'] for n in children]
  assert hours==[(step*7)%24 for step in steps],hours
  assert steps[0] in (0,1) and all(b-a in (1,2) for a,b in zip(steps,steps[1:])),steps
  routes={r['key']:r for r in graph['planeCheckpoint']['routes']}
  child_routes=[routes['b0|'+n['id']] for n in children]
  assert len({r['toPort']['side'] for r in child_routes})>=3,child_routes
  # Exact reflection is covered by unobstructed cardinal unit fixtures.
  # A packed scene can legitimately require another free face around a box.
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.pending')==0
  page.locator('#undoBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.routes===14',timeout=30000)
  assert page.locator('#nodes .selected').get_attribute('data-node-id')=='b0'
  with page.expect_download() as undone:page.locator('#jsonBtn').click()
  undo_graph=json.loads(Path(undone.value.path()).read_text(encoding='utf8'))
  positions={n['id']:(n['x'],n['y']) for n in graph['nodes']}
  assert all(positions[n['id']]==(n['x'],n['y']) for n in undo_graph['nodes']),undo_graph
  print('Más concepto: doce hermanos, entradas por las cuatro caras y cardinales enfrentados; selección y deshacer estables',flush=True)
  # The three controls affect new links only; relation semantics and boxes stay intact.
  before_styles=page.evaluate('window.P1_PLANO_DIAGNOSTICO.routeCalculations')
  node_positions=page.locator('#nodes .node').evaluate_all('(els)=>els.map(el=>el.getAttribute("transform"))')
  page.locator('#lineDotted').click()
  assert page.locator('#lineDotted').get_attribute('aria-pressed')=='true'
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.routeCalculations')==before_styles
  assert page.locator('#nodes .node').evaluate_all('(els)=>els.map(el=>el.getAttribute("transform"))')==node_positions
  page.locator('#nodes [data-node-id="f0"]').click()
  page.locator('#linkBtn').click()
  page.locator('#nodes [data-node-id="t0"]').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.topology().referenceEdges===15',timeout=30000)
  assert page.locator('#lines [data-edge-key="f0|t0"] .svgline').get_attribute('stroke-dasharray')=='0 5'
  for endpoint in ('f0','t0'):
   page.locator('#nodes [data-node-id="'+endpoint+'"]').click()
   assert 'active' in page.locator('#lines [data-edge-key="f0|t0"] .svgline').get_attribute('class')
  page.locator('#lineDashed').click()
  page.locator('#nodes [data-node-id="f0"]').click()
  page.locator('#addBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.topology().referenceEdges===16',timeout=30000)
  assert page.locator('#lines [data-edge-key="f0|n13"] .svgline').get_attribute('stroke-dasharray')=='7 5'
  page.locator('#lineSolid').click()
  page.locator('#addBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.topology().referenceEdges===17',timeout=30000)
  assert page.locator('#lines [data-edge-key="f0|n14"] .svgline').get_attribute('stroke-dasharray') is None
  page.locator('#nodes [data-node-id="n14"]').click()
  old_height=float(page.locator('#nodes [data-node-id="n14"] rect').get_attribute('height'))
  page.locator('#nodeText').fill('Un concepto de prueba con una descripción suficientemente larga para crecer en altura sin reducir el tamaño de letra.')
  page.locator('#nodeText').press('Tab')
  page.wait_for_function('(old)=>+document.querySelector("#nodes [data-node-id=n14] rect").getAttribute("height")>old',arg=old_height,timeout=30000)
  assert page.locator('#nodes [data-node-id="n14"] text').evaluate('(el)=>getComputedStyle(el).fontSize')=='24px'
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.pending')==0
  with page.expect_download() as styled:page.locator('#jsonBtn').click()
  styled_graph=json.loads(Path(styled.value.path()).read_text(encoding='utf8'))
  assert next(e for e in styled_graph['edges'] if e['from']=='f0' and e['to']=='t0')['style']=='dotted'
  assert next(e for e in styled_graph['edges'] if e['to']=='n13')['style']=='dashed'
  assert next(e for e in styled_graph['edges'] if e['to']=='n14')['style']=='solid'
  page.locator('#fileInput').set_input_files(styled.value.path())
  page.wait_for_function("""()=>document.querySelector('#lines [data-edge-key="f0|t0"] .svgline')?.getAttribute('stroke-dasharray')==='0 5'""",timeout=30000)
  assert page.locator('#lines [data-edge-key="f0|n13"] .svgline').get_attribute('stroke-dasharray')=='7 5'
  print('Cruces unificados; letra fija y cuadro creciente; tres estilos guardados y restaurados',flush=True)
  for mode in ('02','04'):
   page.locator('[data-view="'+mode+'"]').click()
   page.wait_for_function('(m)=>window.P1_PLANO_DIAGNOSTICO.views().current?.mode===m||document.querySelector("#derivedStatus").textContent.startsWith("No se completó")',arg=mode,timeout=120000)
   if page.evaluate('window.P1_PLANO_DIAGNOSTICO.views().current?.mode')!=mode:
    raise AssertionError(page.locator('#derivedStatus').inner_text())
   assert page.locator('#derivedLines .svgline').count()==17
   for endpoint in ('f0','t0'):
    page.locator('#derivedNodes [data-node-id="'+endpoint+'"]').click()
    assert 'hierarchy-focus' in page.locator('#derivedLines [data-edge-key="f0|t0"]').get_attribute('class')
  print('El vínculo nuevo entre pares aparece y se resalta desde cualquiera de sus puntas en las tres vistas',flush=True)
  # Real 0.2.10 export: a split word and a freely moved root below its children.
  # Migration must enlarge the box locally, preserving the edited positions.
  page.locator('[data-view="01"]').click()
  fixture=Path(__file__).parent/'fixtures'/'word-wrap-0.2.10.json'
  previous=json.loads(fixture.read_text(encoding='utf8'))
  page.locator('#fileInput').set_input_files(fixture)
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO.routes===3&&document.querySelectorAll("#nodes .node").length===4',timeout=30000)
  word=page.locator('#nodes [data-node-id="b0"]')
  assert word.locator('tspan').all_text_contents()==['Especialización']
  assert float(word.locator('rect').get_attribute('width'))>170
  assert word.locator('text').evaluate('(el)=>getComputedStyle(el).fontSize')=='24px'
  with page.expect_download() as migrated:page.locator('#jsonBtn').click()
  current=json.loads(Path(migrated.value.path()).read_text(encoding='utf8'))
  assert [(n['id'],n['x'],n['y']) for n in current['nodes']]==[(n['id'],n['x'],n['y']) for n in previous['nodes']]
  # Changing only the required width must also update geometry while typing.
  word.click()
  old_width=float(word.locator('rect').get_attribute('width'))
  page.locator('#nodeText').fill('Electroencefalografista')
  page.wait_for_function('(old)=>+document.querySelector("#nodes [data-node-id=b0] rect").getAttribute("width")>old',arg=old_width,timeout=30000)
  assert word.locator('tspan').all_text_contents()==['Electroencefalografista']
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.pending')==0
  print('Palabras completas: ancho automático, edición y posiciones de 0.2.10 conservadas',flush=True)
  assert not errors,errors
  b.close()
 srv.shutdown()
