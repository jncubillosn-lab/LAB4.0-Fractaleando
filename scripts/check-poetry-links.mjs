import {poetryQuotes} from '../js/data/PoetryQuotes.js';

// Maintenance check, never part of application startup or the offline test suite.
// A successful HTTP response alone is insufficient: it must contain the excerpt.
const entities={nbsp:' ',amp:'&',quot:'"',apos:"'",rsquo:"'",lsquo:"'",mdash:'—',ndash:'–',hellip:'…',
 aacute:'á',eacute:'é',iacute:'í',oacute:'ó',uacute:'ú',atilde:'ã',otilde:'õ',ccedil:'ç',ntilde:'ñ',iexcl:'¡',iquest:'¿'};
const plain=html=>html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')
 .replace(/<[^>]+>/g,' ').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi,(all,name)=>{
  if(name.startsWith('#')){const n=name[1].toLowerCase()==='x'?parseInt(name.slice(2),16):Number(name.slice(1));return n<=0x10ffff?String.fromCodePoint(n):all;}
  return entities[name.toLowerCase()]??all;
 });
const normalize=text=>text.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const results=await Promise.all(poetryQuotes.map(async quote=>{
 try{
  const response=await fetch(quote.source,{redirect:'follow',signal:AbortSignal.timeout(25000)});
  const body=await response.text(),containsExcerpt=normalize(plain(body)).includes(normalize(quote.original));
  return {author:quote.author,url:quote.source,finalURL:response.url,status:response.status,
   containsExcerpt,ok:response.ok&&containsExcerpt};
 }catch(error){return {author:quote.author,url:quote.source,status:null,containsExcerpt:false,ok:false,error:error.message};}
}));
console.log(JSON.stringify({checkedAt:new Date().toISOString(),total:results.length,
 passed:results.filter(r=>r.ok).length,results},null,2));
if(results.some(result=>!result.ok))process.exitCode=1;
