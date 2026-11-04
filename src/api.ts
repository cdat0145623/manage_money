import { createClient } from '@supabase/supabase-js';
import type { Data } from './domain.ts';
export const localTest = import.meta.env.VITE_LOCAL_TEST === 'true';
const url=import.meta.env.VITE_SUPABASE_URL, key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured=localTest || !!(url && key);
export const supabase=!localTest && url && key ? createClient(url,key) : null;
async function local(path:string,body?:unknown) {
 const response=await fetch(`/local-api/${path}`,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await response.json(); if(!response.ok) throw new Error(data.error || 'Không thể kết nối. Vui lòng thử lại.');return data;
}
export async function getSession():Promise<boolean> {
 if(localTest)return (await local('session')).authenticated;
 if(!supabase)return false;
 const {data,error}=await supabase.auth.getSession();if(error)throw error;return !!data.session;
}
export async function login(email:string,password:string) {
 if(localTest){await local('login',{password});return;}
 if(!supabase)throw new Error('Chưa cấu hình kết nối.');
 const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw new Error('Không đăng nhập được. Kiểm tra email, mật khẩu và kết nối.');
}
export async function logout(){if(localTest)await local('logout',{});else {const result=await supabase?.auth.signOut();if(result?.error)throw result.error;}}
export async function loadData():Promise<Data> {
 if(localTest)return local('data');
 if(!supabase)throw new Error('Chưa cấu hình Supabase.');
 // Read every page. A truncated 1,000-row response must never become a financial total.
 const pairs=await Promise.all(['expenses','refunds','schedules','budgets'].map(async table=>{
  const rows:unknown[]=[];
  for(let offset=0;;offset+=500){
   let q=supabase!.from(table).select('*').order(table==='budgets'?'month':'id');
   if(table==='budgets')q=q.order('channel');
   const {data,error}=await q.range(offset,offset+499);if(error)throw error;
   rows.push(...data);if(data.length<500)break;
  }
  return [table,rows];
 }));
 const raw=Object.fromEntries(pairs) as unknown as Data;
 return {
  expenses: raw.expenses.map(e=>({...e,amount:Number(e.amount),months:Number(e.months),period:e.period===null?null:Number(e.period),version:Number(e.version)})),
  refunds: raw.refunds.map(r=>({...r,amount:Number(r.amount)})),
  schedules: raw.schedules.map(s=>({...s,amount:Number(s.amount),months:Number(s.months),version:Number(s.version)})),
  budgets: raw.budgets.map(b=>({...b,amount:Number(b.amount)})),
 };
}
export async function mutate(action:string,payload:unknown,request_id:string) {
 if(localTest){await local('mutate',{action,payload,request_id});return;}
 if(!supabase)throw new Error('Chưa cấu hình Supabase.');
 const {error}=await supabase.rpc('mutate',{action,payload,request_id});if(error)throw new Error(error.message);
}
