// Test-only bridge: PostgreSQL is real; authentication is local, not Supabase Auth.
import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { mutation, snapshot } from './db.mjs';
mkdirSync('output',{recursive:true});
const path='output/local-test-password.txt';
if(!existsSync(path)) writeFileSync(path,randomBytes(18).toString('base64url'),{mode:0o600});
const password=readFileSync(path,'utf8').trim();
const sessions=new Map(); let attempts=[];
const server=createServer(async(req,res)=>{
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
 const send=(status,data)=>{res.writeHead(status);res.end(JSON.stringify(data));};
 try {
  if(req.method!=='GET') {
   const origin=req.headers.origin;const host=req.headers['x-forwarded-host']||req.headers.host;
   const originHost=origin?new URL(origin).host:'';
   const configuredOrigin=(process.env.ALLOWED_ORIGIN||'').replace(/^https?:\/\//,'').replace(/\/$/,'');
   const allowedOrigin=originHost==='127.0.0.1:5173'||originHost==='localhost:5173'||originHost===host||originHost===configuredOrigin;
   if(!allowedOrigin) return send(403,{error:'Nguồn yêu cầu không hợp lệ.'});
  }
  const cookie=req.headers.cookie?.split('; ').find(c=>c.startsWith('thu_chi_test='))?.slice(13);
  const session=cookie&&sessions.get(cookie);
  const authenticated=session && session>Date.now();
  let body=''; for await(const chunk of req){body+=chunk;if(body.length>32000)return send(413,{error:'Yêu cầu quá lớn.'});}
  const payload=body?JSON.parse(body):{};
  if(req.url==='/local-api/login' && req.method==='POST') {
   attempts=attempts.filter(t=>Date.now()-t<60000);if(attempts.length>=10)return send(429,{error:'Thử lại sau một phút.'}); attempts.push(Date.now());
   const supplied=Buffer.from(String(payload.password||'')); const expected=Buffer.from(password);
   if(supplied.length!==expected.length || !timingSafeEqual(supplied,expected)) return send(401,{error:'Mật khẩu chưa đúng.'});
   const token=randomBytes(32).toString('hex');sessions.set(token,Date.now()+8*3600000);
   res.setHeader('Set-Cookie',`thu_chi_test=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${req.headers['x-forwarded-proto']==='https'?'; Secure':''}`);
   return send(200,{ok:true});
  }
  if(req.url==='/local-api/session')return send(200,{authenticated:!!authenticated});
  if(!authenticated)return send(401,{error:'Phiên đã hết hạn. Vui lòng đăng nhập lại.'});
  if(req.url==='/local-api/logout' && req.method==='POST'){sessions.delete(cookie);res.setHeader('Set-Cookie','thu_chi_test=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return send(200,{ok:true});}
  if(req.url==='/local-api/data' && req.method==='GET')return send(200,await snapshot());
  if(req.url==='/local-api/mutate' && req.method==='POST') {
   if(!/^[a-f0-9-]{36}$/.test(payload.request_id||''))return send(400,{error:'Mã thao tác không hợp lệ.'});
   const result=await mutation(payload.action,payload.payload,payload.request_id);return send(200,result ? JSON.parse(result) : {ok:true});
  }
  send(404,{error:'Không tìm thấy.'});
 }catch(e){send(400,{error:e.message?.startsWith('ERROR:')?e.message.split('\n')[0].replace('ERROR:','').trim():'Không thể xử lý. Kiểm tra kết nối DB và thử lại.'});}
});
server.listen(5174,'127.0.0.1',()=>console.log('Local test API: 127.0.0.1:5174. Password file: output/local-test-password.txt (not logged).'));
