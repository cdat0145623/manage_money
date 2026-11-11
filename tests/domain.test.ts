import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allocation, dueDate, totals, allocationPosition } from '../src/domain.ts';
import type { Expense, Refund } from '../src/domain.ts';
const e: Expense = { id: 'e', description: 'Laptop', amount: 24000000, date: '2026-11-15', channel: 'shopping', kind: 'once', tag: 'Asset', category_id: null, months: 12, status: 'confirmed', schedule_id: null, period: null, version: 1 };
test('24 triệu phân bổ đủ 12 kỳ từ tháng mua, không lẫn thực chi', () => {
 const rows = allocation(e, []);
 assert.equal(rows['2026-11'], 2000000);
 assert.equal(rows['2027-10'], 2000000);
 assert.equal(rows['2027-11'], undefined);
 assert.equal(Object.values(rows).reduce((a,b)=>a+b,0),24000000);
 assert.deepEqual(totals([e], [], '2026-11', '2026-11'), { gross: 24000000, refunds: 0, net: 24000000, allocated: 2000000 });
});
test('hoàn tiền chỉ chia lại kỳ còn lại, giữ lịch sử', () => {
 const purchase={...e,amount:6000000,months:6};
 const refund:Refund={id:'r',expense_id:'e',amount:2000000,date:'2027-01-10',note:''};
 assert.deepEqual(allocation(purchase,[refund]),{'2026-11':1000000,'2026-12':1000000,'2027-01':500000,'2027-02':500000,'2027-03':500000,'2027-04':500000});
 assert.equal(allocationPosition(purchase,[refund],'2026-12').remaining,4000000);
});
test('làm tròn đồng, hoàn sau hết kỳ và không tính khoản chờ',()=>{
 assert.deepEqual(allocation({...e,amount:100000,months:3},[]),{'2026-11':33333,'2026-12':33333,'2027-01':33334});
 const r:Refund={id:'r',expense_id:'e',amount:24000000,date:'2027-12-01',note:''};
 assert.equal(allocation(e,[r])['2027-12'],-24000000);
 assert.deepEqual(allocation({...e,status:'pending'},[]),{});
 assert.equal(totals([e],[r],'2027-12','2027-12').net,-24000000);
});
test('ngày neo 31 và năm nhuận không trôi sau tháng ngắn',()=>{
 assert.equal(dueDate('2028-01-31',1,'monthly'),'2028-02-29');
 assert.equal(dueDate('2028-01-31',2,'monthly'),'2028-03-31');
 assert.equal(dueDate('2028-02-29',1,'yearly'),'2029-02-28');
 assert.equal(dueDate('2028-02-29',4,'yearly'),'2032-02-29');
});
test('hoàn vượt phần chưa phân bổ tạo giảm chi phí, giữ tổng ròng',()=>{
 const p={...e,amount:6000000,months:6};
 const rs:Refund[]=[{id:'a',expense_id:'e',amount:5000000,date:'2027-01-10',note:''},{id:'b',expense_id:'e',amount:1000000,date:'2027-02-10',note:''}];
 const rows=allocation(p,rs);
 assert.equal(rows['2027-01'],-1000000);
 assert.equal(rows['2027-02'],-1000000);
 assert.equal(Object.values(rows).reduce((a,b)=>a+b,0),0);
 assert.equal(allocationPosition(p,rs,'2027-02').remaining,0);
});
