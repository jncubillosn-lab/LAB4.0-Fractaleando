"""Acceptance against the built Pages modules, worker and local WASM."""
import http.server, threading, json, os, re, base64
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ.get('P1_SITE_ROOT',Path(__file__).resolve().parents[1]/'_site'))
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
with http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet) as srv:
 threading.Thread(target=srv.serve_forever,daemon=True).start()
 print('E2E: iniciando Playwright',flush=True)
 with sync_playwright() as p:
  print('E2E: abriendo Chrome',flush=True)
  browser=p.chromium.launch(**({'executable_path':os.environ['P1_BROWSER_PATH']} if os.environ.get('P1_BROWSER_PATH') else {'channel':'chrome'}),headless=True)
  page=browser.new_page(viewport={'width':1600,'height':1000},accept_downloads=True)
  page.on('dialog',lambda d:d.accept())
  errors=[];bad=[];requests=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
  page.on('request',lambda r:requests.append(r.url))
  print('E2E: abriendo sitio construido',flush=True)
  page.goto('http://127.0.0.1:'+str(srv.server_address[1])+'/index.html',wait_until='domcontentloaded')
  build=page.locator('meta[name="application-build"]').get_attribute('content')
  assert '0.2.5' in page.locator('meta[name="application-version"]').get_attribute('content')
  page.wait_for_function('[...document.fonts].filter(f=>f.family==="Rajdhani"&&f.status==="loaded").length===2')
  def check_labels(selector):
   labels=page.locator(selector).evaluate_all("""els=>els.map(el=>{
    const rect=el.querySelector('rect'),text=el.querySelector('text'),style=getComputedStyle(text);
    const ctx=document.createElement('canvas').getContext('2d');
    ctx.font=style.fontWeight+' '+style.fontSize+' '+style.fontFamily;ctx.textAlign='center';
    const x=+rect.getAttribute('x'),y=+rect.getAttribute('y'),w=+rect.getAttribute('width'),h=+rect.getAttribute('height');
    const margins=[...text.querySelectorAll('tspan')].map(t=>{
     const m=ctx.measureText(t.textContent),ty=+t.getAttribute('y');
     return [-m.actualBoundingBoxLeft-x,x+w-m.actualBoundingBoxRight,ty-m.actualBoundingBoxAscent-y,y+h-ty-m.actualBoundingBoxDescent];
    }).flat();
    return {id:el.dataset.nodeId,family:style.fontFamily,size:parseFloat(style.fontSize),margin:Math.min(...margins)};
   })""")
   assert all('Rajdhani' in label['family'] and label['margin']>=8.5 for label in labels),[l for l in labels if l['margin']<8.5]
   assert next(l['size'] for l in labels if l['id']=='p1')==30,labels
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.routes===3',timeout=60000)
  page.locator('#showAllBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.routes===217',timeout=60000)
  print('E2E: 01 completo',flush=True)
  baseline=page.evaluate('window.P1_PLANO_DIAGNOSTICO.topology()')
  original=page.locator('#nodes [data-node-id="p1"]').get_attribute('transform')
  assert baseline['valid'] and baseline['crossings']==71
  check_labels('#nodes .node')
  results={}
  for mode in ('02','04'):
   print('E2E: calculando',mode,flush=True)
   page.locator('[data-view="'+mode+'"]').click()
   page.wait_for_function('(mode)=>window.P1_PLANO_DIAGNOSTICO.views().current?.mode===mode',arg=mode,timeout=120000)
   result=page.evaluate('window.P1_PLANO_DIAGNOSTICO.views().current');results[mode]=result
   print('VISTA',mode,json.dumps({k:result[k] for k in ['nodes','engine','meanGap','capacityPasses','pending','audit','topology']},ensure_ascii=False)[:2500],flush=True)
   assert result['nodes']==210 and result['overlaps']==0 and result['radialOrder'],result
   assert result['pending']==0 and result['audit']['drawn']==217,result
   assert result['audit']['invalid']==result['audit']['boxes']==result['audit']['portsRepeated']==0,result
   assert result['meanGap']<475,result
   assert page.locator('#derivedNodes .node').count()==210
   assert page.locator('#derivedLines .svgline').count()==217
   assert page.locator('#nodes').evaluate('(el)=>getComputedStyle(el).display')=='none'
   assert result['topology']['hasReference'] and result['topology']['crossings']==71
   assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.topology()')==baseline
   assert page.locator('#derivedLines circle').count()==result['audit']['crossings']
   check_labels('#derivedNodes .node')
   cuts=page.locator('#derivedLines [data-over-edge-key]').evaluate_all("""els=>els.map(el=>{
    const group=[...document.querySelectorAll('#derivedLines > g')].find(g=>g.dataset.edgeKey===el.dataset.overEdgeKey);
    const upper=group.querySelector('.svgline');
    const scale=+document.querySelector('#derivedLines').dataset.crossingScale;
    const dash=5/scale;
    return {same:el.getAttribute('d')===upper.getAttribute('d'),width:(+el.getAttribute('stroke-width'))*scale,
     dashed:el.getAttribute('stroke-dasharray')===(upper.classList.contains('transverse')?dash+' '+dash:null)};
   })""")
   assert cuts and all(c['same'] and c['dashed'] and c['width']<=3.4001 for c in cuts),cuts
   # Select J3 by click: actual ancestry plus its J4 neighbours, with no reroute.
   before_selection=page.evaluate('window.P1_PLANO_DIAGNOSTICO.views().current.calculations')
   positions=page.locator('#derivedNodes .node').evaluate_all('(els)=>els.map(el=>el.getAttribute("transform"))')
   page.locator('#derivedNodes [data-node-id="b42"]').click()
   focused=page.locator('#derivedNodes .hierarchy-focus').evaluate_all('(els)=>els.map(el=>el.dataset.nodeId).sort()')
   assert focused==sorted(['p1','b0','b4','b42','b421','b422','b423']),focused
   bold_edges=page.locator('#derivedLines .hierarchy-focus').evaluate_all('(els)=>els.map(el=>el.dataset.edgeKey).sort()')
   assert bold_edges==sorted(['b0|p1','b0|b4','b4|b42','b42|b421','b42|b422','b42|b423']),bold_edges
   assert page.locator('#nodeText').is_disabled()
   assert page.locator('#addBtn').is_disabled()
   assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.views().current.calculations')==before_selection
   assert page.locator('#derivedNodes .node').evaluate_all('(els)=>els.map(el=>el.getAttribute("transform"))')==positions
   page.locator('#derivedNodes [data-node-id="b42"]').press('Enter')
   assert page.locator('#derivedNodes [data-node-id="b42"]').get_attribute('aria-pressed')=='true'
   if mode=='02':
    assert result['coreSpacing']['factor']==.5,result
    assert all(not link['constrained'] and abs(link['ratio']-.5)<.001 for link in result['coreSpacing']['links']),result['coreSpacing']
    widths=page.locator('#derivedLines .svgline').evaluate_all('(els)=>els.map(el=>[el.dataset.hierarchyLevel,el.style.getPropertyValue("--hierarchy-width")])')
    values=[float(row[1]) for row in widths]
    assert min(values)==1.35 and max(values)==2.05,values
    normal_core=page.locator('#derivedLines g:not(.hierarchy-focus) > path[data-hierarchy-level="1"]').first
    assert abs(float(normal_core.evaluate('(el)=>parseFloat(getComputedStyle(el).strokeWidth)'))-2.05)<.001
    focused=page.locator('#derivedLines .hierarchy-focus .svgline').first
    assert abs(float(focused.evaluate('(el)=>parseFloat(getComputedStyle(el).strokeWidth)'))-2.8)<.001
    with page.expect_download() as weighted_svg:page.locator('#svgBtn').click()
    weighted=Path(weighted_svg.value.path()).read_text(encoding='utf8')
    assert '@font-face' in weighted and 'data:font/ttf;base64,' in weighted and 'SIL OPEN FONT LICENSE' in weighted
    assert re.search(r'--hierarchy-width:\s*2\.05',weighted) and re.search(r'--hierarchy-width:\s*1\.35',weighted)
   before=page.evaluate('window.P1_PLANO_DIAGNOSTICO.routeCalculations')
   page.locator('#depth').evaluate('(el)=>{el.value="1";el.dispatchEvent(new Event("input",{bubbles:true}))}')
   assert page.locator('#derivedLines [data-over-edge-key]').evaluate_all("""els=>els.every(el=>{
    const upper=[...document.querySelectorAll('#derivedLines > g')].find(g=>g.dataset.edgeKey===el.dataset.overEdgeKey);
    return (el.style.display==='none')===(upper.style.display==='none');
   })""")
   page.locator('#showAllBtn').click()
   assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.routeCalculations')==before
   if mode=='02':assert page.locator('#derivedLines .svgline').evaluate_all('(els)=>els.map(el=>[el.dataset.hierarchyLevel,el.style.getPropertyValue("--hierarchy-width")])')==widths
   output=os.environ.get('P1_SCREENSHOTS')
   if output:
    Path(output).mkdir(parents=True,exist_ok=True)
    page.screenshot(path=str(Path(output)/('Fractaleando_0_2_5_'+mode+'.png')))
  assert results['04']['baseBounds']==results['02']['bounds']
  assert results['04']['baseMeanGap']==results['02']['meanGap']
  page.locator('#themeBtn').click()
  assert page.locator('#themeBtn').get_attribute('aria-pressed')=='true'
  with page.expect_download() as exp_svg:page.locator('#svgBtn').click()
  svg=Path(exp_svg.value.path()).read_text(encoding='utf8')
  assert '#171917' in svg and '#e9e9e4' in svg
  assert 'EN REVISIÓN' in svg
  page.locator('[data-view="01"]').click()
  assert page.locator('#nodes [data-node-id="p1"]').get_attribute('transform')==original
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.topology()')==baseline
  page.locator('#nodes [data-node-id="b42"]').click()
  assert 'selected' in page.locator('#nodes [data-node-id="b42"]').get_attribute('class')
  assert page.locator('#lines .svgline.active').count()>0
  # Existing cached 02 must be immediate and identical to the base used by 04.
  page.locator('[data-view="02"]').click()
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.views().current.meanGap')==results['02']['meanGap']
  assert any('libavoid.wasm?build='+build in url for url in requests),requests
  assert not bad,bad
  assert not errors,errors
  # Raster acceptance: a crossing at a 45-degree bend remains short after zoom.
  # Reading SVG attributes alone misses Chrome's mask scaling behaviour.
  page.evaluate("""async build=>{
   const {drawCircuitSvg,scaleCrossings}=await import('./js/ui/CircuitSvg.js?build='+build);
   const ns='http://www.w3.org/2000/svg',el=(name,attrs={})=>{
    const n=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
   const svg=el('svg',{id:'crossing-probe',width:300,height:200});
   svg.style.cssText='position:fixed;left:400px;top:100px;z-index:9999;background:white';
   const style=el('style');style.textContent='#crossing-probe .svgline{fill:none;stroke:black;stroke-opacity:1;stroke-width:1.35;vector-effect:non-scaling-stroke}';
   svg.append(style);const g=el('g');svg.append(g);document.body.append(svg);
   const edges=[{from:'a',to:'b'},{from:'c',to:'d'}],key=e=>[e.from,e.to].join('|');
   const routes=new Map([['a|b',{points:[{x:-1000,y:0},{x:1000,y:0}]}],['c|d',{points:[{x:0,y:-1000},{x:0,y:0},{x:1000,y:1000}]}]]);
   drawCircuitSvg({ordered:edges,routes,linesEl:g,sEl:el,edgeKey:key,mode:'04'});
   for(const n of g.querySelectorAll('[id]'))n.id='probe-'+n.id;
   for(const n of g.querySelectorAll('[mask],[clip-path]'))for(const attr of ['mask','clip-path']){
    const value=n.getAttribute(attr);if(value)n.setAttribute(attr,value.replace('url(#','url(#probe-')));}
   window.scaleCrossingProbe=z=>{g.setAttribute('transform','translate(150 100) scale('+z+')');scaleCrossings(g,z);};
  }""",build)
  for zoom in (.125,1.728,.22,2.5):
   page.evaluate('z=>window.scaleCrossingProbe(z)',zoom)
   raster=page.locator('#crossing-probe').screenshot()
   gap=page.evaluate("""async b64=>{
    const image=new Image();image.src='data:image/png;base64,'+b64;await image.decode();
    const c=document.createElement('canvas');c.width=300;c.height=200;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
    const pixels=ctx.getImageData(135,99,30,3).data;let longest=0,run=0;
    for(let x=0;x<30;x++){let ink=false;for(let y=0;y<3;y++)if(pixels[(y*30+x)*4]<230)ink=true;
     run=ink?0:run+1;longest=Math.max(longest,run);}return longest;
   }""",base64.b64encode(raster).decode())
   assert gap<=3,{'zoom':zoom,'white_gap_pixels':gap}
  page.locator('#crossing-probe').evaluate('(el)=>el.remove()')
  print('Cruces rasterizados: cortes de hasta 3 px en cuatro escalas',flush=True)
  browser.close()
 srv.shutdown()
