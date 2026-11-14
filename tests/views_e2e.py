"""Acceptance against the built Pages modules, worker and local WASM."""
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
  page=browser.new_page(viewport={'width':1600,'height':1000},accept_downloads=True)
  page.on('dialog',lambda d:d.accept())
  errors=[];bad=[];requests=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
  page.on('request',lambda r:requests.append(r.url))
  page.goto('http://127.0.0.1:'+str(srv.server_address[1])+'/index.html',wait_until='domcontentloaded')
  build=page.locator('meta[name="application-build"]').get_attribute('content')
  assert '0.2.2' in page.locator('meta[name="application-version"]').get_attribute('content')
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.routes===3',timeout=60000)
  page.locator('#showAllBtn').click()
  page.wait_for_function('window.P1_PLANO_DIAGNOSTICO?.routes===217',timeout=60000)
  baseline=page.evaluate('window.P1_PLANO_DIAGNOSTICO.topology()')
  original=page.locator('#nodes [data-node-id="p1"]').get_attribute('transform')
  assert baseline['valid'] and baseline['crossings']==71
  results={}
  for mode in ('02','04'):
   page.locator('[data-view="'+mode+'"]').click()
   page.wait_for_function('(mode)=>window.P1_PLANO_DIAGNOSTICO.views().current?.mode===mode',arg=mode,timeout=120000)
   result=page.evaluate('window.P1_PLANO_DIAGNOSTICO.views().current');results[mode]=result
   print('VISTA',mode,json.dumps({k:result[k] for k in ['nodes','engine','meanGap','capacityPasses','pending','audit','topology']},ensure_ascii=False)[:2500],flush=True)
   assert result['nodes']==210 and result['overlaps']==0 and result['radialOrder'],result
   assert result['pending']==0 and result['audit']['drawn']==217,result
   assert result['audit']['invalid']==result['audit']['boxes']==result['audit']['portsRepeated']==0,result
   assert result['meanGap']<475,result
   assert page.locator('#derivedNodes .node').count()==210
   assert page.locator('#derivedLines path').count()==217
   assert page.locator('#nodes').evaluate('(el)=>getComputedStyle(el).display')=='none'
   assert result['topology']['hasReference'] and result['topology']['crossings']==71
   assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.topology()')==baseline
   assert page.locator('#derivedLines circle').count()==result['audit']['crossings']
   before=page.evaluate('window.P1_PLANO_DIAGNOSTICO.routeCalculations')
   page.locator('#depth').evaluate('(el)=>{el.value="1";el.dispatchEvent(new Event("input",{bubbles:true}))}')
   page.locator('#showAllBtn').click()
   assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.routeCalculations')==before
   output=os.environ.get('P1_SCREENSHOTS')
   if output:
    Path(output).mkdir(parents=True,exist_ok=True)
    page.screenshot(path=str(Path(output)/('Fractaleando_0_2_2_'+mode+'.png')))
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
  # Existing cached 02 must be immediate and identical to the base used by 04.
  page.locator('[data-view="02"]').click()
  assert page.evaluate('window.P1_PLANO_DIAGNOSTICO.views().current.meanGap')==results['02']['meanGap']
  assert any('libavoid.wasm?build='+build in url for url in requests),requests
  assert not bad,bad
  assert not errors,errors
  browser.close()
 srv.shutdown()
