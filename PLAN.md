# Thu Chi Implementation Plan

Spec: SPEC.md — đã được người dùng duyệt qua yêu cầu triển khai.
Thực hiện inline bằng implement; không Git/commit theo yêu cầu project local.

- [x] Logic domain: types, tiền nguyên, lịch tháng/năm, phân bổ, hoàn tiền; test node:test tại seam phép tính đã duyệt.
- [x] Persistence: migration Supabase, RLS, RPC nguyên tử/idempotent, client phân trang đầy đủ; kiểm thử SQL trong DB test độc lập.
- [x] UI React: đăng nhập; 4 trang; form, lịch/chờ xác nhận, hoàn tiền, ngân sách và báo cáo; CSS responsive, accessibility.
- [x] Typecheck thường xuyên, UI/browser hot reload, full tests cuối; manual standards/spec review.
- [x] Public local bằng Cloudflare quick tunnel có sẵn; Supabase hosted chờ cấu hình người dùng.

Review focus: refund cạnh tranh; retry sau mất response; lịch ngày 31/năm nhuận; phân trang/tổng; giao dịch cũ và tháng lịch sử.
Không backend riêng, worker, localStorage giả database hoặc tải cloudflared. Nếu thiếu Supabase, giữ màn hình cấu hình rõ ràng; test UI với fixture chỉ là test, không báo là persistence thật.
