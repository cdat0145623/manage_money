import { spawn } from 'node:child_process';
export const TEST_USER = '10000000-0000-4000-8000-000000000001';
export function sqlText(value) { return "'"+String(value).replaceAll("'","''")+"'"; }
export function query(sql, user=TEST_USER) {
 if (!/^[a-f0-9-]{36}$/.test(user)) throw new Error('Invalid test user');
 return new Promise((resolve,reject)=>{
  const p=spawn('docker',['exec','-i','thu-chi-test-db','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres','-d','thu_chi_test']);
  let out='',err=''; p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);p.on('error',reject);
  p.on('close',code=>code===0?resolve(out.trim()):reject(new Error(err.replace(/CONTEXT:[\s\S]*/, '').trim())));
  p.stdin.end(`BEGIN; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = ${sqlText(user)}; ${sql} COMMIT;`);
 });
}
export const mutation=(action,payload,id,user)=>query(`SELECT public.mutate(${sqlText(action)}, ${sqlText(JSON.stringify(payload))}::jsonb, ${sqlText(id)}::uuid);`,user);
export async function snapshot(user=TEST_USER) {
 const tables=['expenses','schedules','refunds','budgets'];
 const sql=`SELECT jsonb_build_object(${tables.map(t=>`${sqlText(t)},(SELECT coalesce(jsonb_agg(to_jsonb(x) - 'user_id'),'[]'::jsonb) FROM (SELECT * FROM public.${t}) x)`).join(',')});`;
 return JSON.parse(await query(sql,user));
}
