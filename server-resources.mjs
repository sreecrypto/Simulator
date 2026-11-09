import https from 'node:https';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {parseResource} from './src/resources.js';
export function isPublicAddress(ip){
  if(ip.startsWith('::ffff:'))return isPublicAddress(ip.slice(7));
  if(isIP(ip)===4){const [a,b]=ip.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&[0,168].includes(b)||a===100&&b>=64&&b<=127||a===198&&[18,19].includes(b));}
  if(isIP(ip)===6)return /^[23]/i.test(ip)&&!ip.toLowerCase().startsWith('2001:db8:');
  return false;
}
export async function fetchModelResource(input,{resolve=lookup,request=https.request}={}){
  let url=new URL(input.url);let text;
  if(url.hostname==='github.com'&&/^\/[^/]+\/[^/]+\/blob\//.test(url.pathname))url=new URL('https://raw.githubusercontent.com'+url.pathname.replace('/blob/','/'));
  for(let redirects=0;redirects<=3;redirects++){
    if(url.protocol!=='https:'||url.username||url.password||url.port&&url.port!=='443'||isIP(url.hostname)||url.hostname==='localhost'||url.hostname.endsWith('.local'))throw new Error('Model resources must use a public HTTPS URL without credentials.');
    const addresses=await resolve(url.hostname,{all:true});if(!addresses.length||addresses.some(a=>!isPublicAddress(a.address)))throw new Error('Private/reserved network model URLs are blocked.');
    const result=await new Promise((resolveResult,reject)=>{
      const pinned=addresses[0];const req=request(url,{headers:{'User-Agent':'CircuitStudio/0.3','Accept':'text/plain,application/json'},lookup:(host,options,callback)=>options?.all?callback(null,[pinned]):callback(null,pinned.address,pinned.family),timeout:15000},res=>{
        if([301,302,303,307,308].includes(res.statusCode)){res.resume();resolveResult({redirect:res.headers.location});return;}
        if(res.statusCode!==200){res.resume();reject(new Error(`Model source returned HTTP ${res.statusCode}.`));return;}
        if(Number(res.headers['content-length']||0)>300000){res.destroy();reject(new Error('Model exceeds 300 KB.'));return;}
        let body='';res.setEncoding('utf8');res.on('data',chunk=>{body+=chunk;if(Buffer.byteLength(body)>300000){res.destroy();reject(new Error('Model exceeds 300 KB.'));}});res.on('end',()=>resolveResult({body}));res.on('error',reject);
      });req.on('timeout',()=>req.destroy(new Error('Model download timed out.')));req.on('error',reject);req.end();
    });
    if(result.redirect){url=new URL(result.redirect,url);continue;}text=result.body;break;
  }
  if(text===undefined)throw new Error('Too many model source redirects.');
  return parseResource({name:input.name||url.pathname.split('/').at(-1),sourceUrl:url.href,license:input.license,spice:text});
}
export async function searchModelResources(query){
  if(process.env.MODEL_SEARCH_ENABLED==='0')throw new Error('External model search is disabled on this server.');
  if(typeof query!=='string'||!query.trim()||query.length>200)throw new Error('Model search query must be 1–200 characters.');
  const headers={'Content-Type':'application/json'};if(process.env.FIRECRAWL_API_KEY)headers.Authorization=`Bearer ${process.env.FIRECRAWL_API_KEY}`;
  const response=await fetch('https://api.firecrawl.dev/v2/search',{method:'POST',headers,signal:AbortSignal.timeout(30000),body:JSON.stringify({query:`${query} SPICE model .lib .cir .mod`,sources:['web'],limit:5,scrapeOptions:{formats:['links']}})});
  if(!response.ok)throw new Error(`Model search returned HTTP ${response.status}. Configure FIRECRAWL_API_KEY if the anonymous allowance is exhausted.`);
  const data=await response.json();if(!data.success)throw new Error('Model search failed.');
  const results=[];for(const item of data.data?.web||[]){results.push({url:item.url,title:String(item.title||'').slice(0,200),description:String(item.description||'').slice(0,500)});for(const link of item.links||[])if(typeof link==='string'&&/\.(lib|mod|cir|sp|txt)(?:\?|$)/i.test(link))results.push({url:link,title:'Model download linked from '+item.url,description:''});}
  return [...new Map(results.filter(r=>typeof r.url==='string'&&r.url.startsWith('https:')).map(r=>[r.url,r])).values()].slice(0,20);
}
