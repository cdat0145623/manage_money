# Thu Chi — Spec v1 + Scope Amendment v2

Ngày: 11/11/2026. Trạng thái: v1 đã triển khai; amendment v2 đã được người dùng chốt để triển khai tiếp.

Tổng hợp bằng skill to-spec; định hướng UI/UX theo ui-ux-pro-max. Phần v1 bên dưới là lịch sử scope đã triển khai; phần amendment v2 ở cuối là nguồn chốt cho đợt tiếp theo. Issue tracker là nơi theo dõi triển khai, còn file này là bản spec local.

## Problem Statement

Người dùng cần ghi nhận chi tiêu cá nhân bằng tay hoặc theo lịch tái diễn, kiểm soát ngân sách theo kênh và theo dõi chi phí sử dụng được phân bổ qua nhiều tháng. Cần phân biệt tiền đã chi với chi phí phân bổ, tìm được khoản hết phân bổ và xem báo cáo theo kênh, phân loại, nhãn. Nhập và xem trên điện thoại phải thuận tiện, không phải zoom ra để đọc bảng; đồng thời hỗ trợ tablet và desktop.

## Solution

Một ứng dụng tiếng Việt cho một người dùng, đăng nhập và dùng chung dữ liệu trên nhiều thiết bị. Bốn trang: Tổng quan, Khoản chi, Báo cáo & phân bổ, Ngân sách. Form thêm/sửa dùng chung; quản lý lịch tái diễn là tab trong Khoản chi. Đăng nhập là màn hình phụ.

Ngân sách mặc định hằng tháng: Ứng dụng mua sắm 10.000.000đ; Mua chuyển khoản 5.000.000đ; Nhờ chi hộ 5.000.000đ. Ngân sách kiểm soát tiền thực chi; báo cáo chi phí phân bổ là chỉ số riêng, chưa có hạn mức riêng. Không cộng thực chi và phân bổ thành một tổng.

## User Stories

1. Là người dùng cá nhân, tôi muốn đăng nhập để chỉ mình truy cập dữ liệu chi tiêu.
2. Là người dùng, tôi muốn xem cùng dữ liệu trên điện thoại và máy tính để chuyển thiết bị thuận tiện.
3. Là người dùng, tôi muốn nhập ngày, diễn giải và số tiền để ghi nhận mỗi khoản thực chi.
4. Là người dùng, tôi muốn chọn đúng một kênh để biết ngân sách nào chịu khoản chi.
5. Là người dùng, tôi muốn chọn Phát sinh 1 lần hoặc Tái diễn để phân biệt tính chất khoản chi.
6. Là người dùng, tôi muốn chọn một nhãn Asset, Tools hoặc Allocation để thống kê theo nhóm.
7. Là người dùng, tôi muốn nhập số tháng phân bổ để biết chi phí sử dụng mỗi tháng.
8. Là người dùng, tôi muốn thấy chi phí mỗi tháng và tháng kết thúc trước khi lưu để kiểm tra dữ liệu.
9. Là người dùng, tôi muốn lưu từng khoản ngay để không phải chờ cuối tháng.
10. Là người dùng, tôi muốn sửa khoản nhập sai và biết tháng nào bị ảnh hưởng để giữ báo cáo đúng.
11. Là người dùng, tôi muốn tìm theo diễn giải và lọc theo thời gian, kênh, phân loại, nhãn để tìm giao dịch.
12. Là người dùng, tôi muốn tự ghi nhận mỗi kỳ tái diễn để kiểm soát khoản có số tiền biến động.
13. Là người dùng, tôi muốn thiết lập lịch tự tạo khoản chờ xác nhận để giảm nhập lại.
14. Là người dùng, tôi muốn sửa số tiền và ngày khi xác nhận khoản tự tạo để ghi đúng thanh toán thực tế.
15. Là người dùng, tôi muốn bỏ qua một kỳ hoặc ngừng lịch để không tiếp tục nhận khoản không còn dùng.
16. Là người dùng, tôi muốn mỗi lịch chỉ có một khoản cho mỗi kỳ để tránh chi phí trùng.
17. Là người dùng, tôi muốn chu kỳ thanh toán tháng/năm độc lập số tháng phân bổ để ghi đúng dịch vụ trả trước.
18. Là người dùng, tôi muốn xem ngân sách, đã chi và còn lại của từng kênh để kiểm soát tháng hiện tại.
19. Là người dùng, tôi muốn điều chỉnh ngân sách riêng từng tháng để không thay đổi lịch sử tháng khác.
20. Là người dùng, tôi muốn sao chép ngân sách tháng trước để thiết lập nhanh.
21. Là người dùng, tôi muốn vẫn ghi khoản vượt ngân sách và nhận cảnh báo để báo cáo không thiếu thực tế.
22. Là người dùng, tôi muốn thống kê thực chi theo kênh, phân loại hoặc nhãn để biết tiền đi đâu.
23. Là người dùng, tôi muốn xem phân bổ của cả các khoản mua từ tháng trước để biết đủ chi phí tháng đang xem.
24. Là người dùng, tôi muốn xem đã phân bổ và còn lại theo tháng chọn để theo dõi từng khoản.
25. Là người dùng, tôi muốn lọc khoản chưa bắt đầu, đang phân bổ, đã hết và kết thúc trong tháng để quản lý thời hạn.
26. Là người dùng, tôi muốn xem lịch phân bổ tương lai của khoản đã chi và phân biệt nó với thanh toán dự kiến.
27. Là người dùng, tôi muốn ghi hoàn tiền toàn phần/một phần gắn với khoản mua để giữ lịch sử.
28. Là người dùng, tôi muốn thấy chi gộp, hoàn tiền và chi ròng riêng để hiểu số liệu ngân sách.
29. Là người dùng, tôi muốn hoàn tiền điều chỉnh phân bổ từ tháng hoàn để không đổi báo cáo tháng trước.
30. Là người dùng điện thoại, tôi muốn nhập bằng form một cột và đọc thẻ khoản chi để không phải zoom ra.
31. Là người dùng tablet/desktop, tôi muốn bố cục tận dụng chiều rộng để so sánh dữ liệu dễ hơn.
32. Là người dùng, tôi muốn thấy trạng thái đang lưu, lỗi và danh sách trống rõ ràng để biết thao tác có thành công.
33. Là người dùng, tôi muốn mở ứng dụng qua đường dẫn Cloudflare từ local sau khi hoàn thành để truy cập ngoài máy chạy ứng dụng.

## Implementation Decisions

### Các lựa chọn đã được đồng ý

Theo câu trả lời “đồng ý các đề xuất”: 1A, 2A, 3A, 4aA, 4bA, 4cA, 5A, 6aA, 6bA, 7A, 8A, 9A, 10B, 11A, 12A, 13B, 14A, 15A.

- Một sổ cá nhân; chưa có cộng tác hoặc phân quyền nhóm.
- Một khoản có đúng một kênh và một nhãn chính; không có danh mục khoản mục riêng.
- Giữ cả ba nhãn Asset/Tools/Allocation. Nhãn không quyết định cách tính; mọi nhãn đều được phân bổ.
- Nhờ chi hộ chỉ là kênh ngân sách, chưa quản lý công nợ. Ngày chi là ngày khoản mua được thanh toán, kể cả thanh toán bởi người chi hộ; chưa phải sổ dòng tiền tài khoản ngân hàng cá nhân.
- Mặc định số tháng phân bổ là 1. Phân bổ bắt đầu từ tháng mua và tính đủ kỳ dù mua giữa/cuối tháng; không chọn tháng bắt đầu khác trong v1.
- Không chuyển dư hay bù ngân sách giữa kênh/tháng. Vượt hạn mức vẫn được lưu và có cảnh báo.
- Tái diễn hỗ trợ nhập tay và tự tạo chờ xác nhận; chỉ khoản đã xác nhận được tính vào thực chi/phân bổ.
- Ngừng tái diễn hoặc ngừng sử dụng không tự thay đổi lịch phân bổ của khoản đã chi.
- Được sửa khoản cũ, tính lại báo cáo liên quan; chưa chốt sổ.
- Hoàn tiền giữ giao dịch gốc, không sửa hồi tố chi phí các tháng trước tháng hoàn.
- Lưu dữ liệu gốc ngay; không lưu bảng tổng hợp tháng là nguồn dữ liệu chính.

### Quy tắc chi tiết đề xuất bổ sung để triển khai — duyệt cùng spec

- VND, lưu số đồng nguyên; ngày nghiệp vụ theo Asia/Ho_Chi_Minh, tháng theo lịch dương. Số tiền mua dương, số tháng nguyên dương, diễn giải không rỗng.
- Chia đều: các kỳ đầu lấy phần nguyên của giá trị/số tháng; kỳ cuối nhận phần dư để tổng khớp chính xác.
- Báo cáo tháng cộng khoản đã xác nhận có lịch phân bổ giao với tháng đó, không chỉ giao dịch mua trong tháng.
- Tháng cuối vẫn có chi phí và trạng thái đang phân bổ với nhãn “Kỳ cuối”; tháng sau là đã hết. Trạng thái tính tương đối với tháng chọn.
- Ngân sách còn lại = hạn mức tháng − (chi gộp tháng − hoàn tiền tháng), theo kênh gốc. Hoàn tiền của khoản cũ có thể làm chi ròng tháng âm; hiển thị rõ, không ép về 0.
- Tái diễn có diễn giải mẫu, số tiền dự kiến, kênh, nhãn, chu kỳ tháng/năm, ngày đến hạn đầu, số tháng phân bổ, chế độ thủ công/tự động và trạng thái hoạt động/ngừng.
- Ngày đến hạn 29–31 ở tháng thiếu ngày được đưa về ngày cuối tháng, nhưng không làm trôi ngày neo của kỳ sau.
- Phương án tối giản: khi đăng nhập/mở lại ứng dụng, tạo bù các kỳ đã đến hạn thành khoản chờ xác nhận. Không có worker chạy khi ứng dụng đóng và không gửi thông báo nền trong v1. Đây là cách thực hiện tự động được đề xuất, chưa phải quyết định có sẵn từ người dùng.
- Kỳ được định danh bằng lịch và kỳ gốc, không bằng ngày thanh toán đã sửa. Ràng buộc duy nhất ở database chống tạo trùng khi mở nhiều thiết bị. Nhập tay từ lịch sử dụng cùng định danh kỳ; khoản nhập độc lập không được tự suy đoán là cùng kỳ.
- Bỏ qua kỳ phải được ghi nhận để mở lại ứng dụng không tạo lại. Ngừng lịch chặn sinh kỳ mới; các khoản chờ cũ được xem và xử lý riêng.
- Thay mẫu lịch chỉ áp dụng kỳ chưa tạo; thay khoản đã xác nhận là thao tác sửa riêng có thông báo ảnh hưởng.
- Hoàn tiền có khoản mua gốc, ngày, số tiền dương và ghi chú; ngày không trước ngày mua; tổng hoàn không vượt giá trị mua. Quy tắc này kiểm tra nguyên tử ở database để chống hai thao tác đồng thời.
- Điều chỉnh hoàn tiền ở tháng R: giữ nguyên phân bổ trước R. Lấy số chưa phân bổ trước R trừ tiền hoàn tại R. Nếu không âm, chia lại phần còn lại từ R đến tháng kết thúc gốc; nếu âm, ghi phần âm là giảm chi phí tại R và các kỳ sau bằng 0. Nếu lịch đã hết, toàn bộ tiền hoàn là giảm chi phí tại R. Các lần hoàn xử lý theo thứ tự tháng.
- Ví dụ mua 6 triệu tháng 11, phân bổ 6 kỳ: tháng 11 và 12 mỗi tháng 1 triệu. Hoàn 2 triệu tháng 1: 4 triệu chưa phân bổ trừ 2 triệu, còn 2 triệu chia cho tháng 1–4, mỗi tháng 500.000đ. Tổng chi phí ròng là 4 triệu.
- Sửa khoản có hoàn tiền phải giữ mọi ràng buộc, không cho giá trị gốc thấp hơn tổng đã hoàn. Ghi lỗi rõ thay vì tự sửa/xóa khoản hoàn.
- Hủy giao dịch nhập nhầm là thao tác riêng có xác nhận; không dùng thay cho trả hàng. Không cho hủy khoản gốc đang có hoàn tiền liên kết. Hủy kỳ tái diễn không làm tự sinh lại kỳ đó.

### Màn hình và tương tác

| Trang | Nội dung chính | Bộ lọc |
|---|---|---|
| Tổng quan | Tháng chọn; ngân sách/chi gộp/hoàn/chi ròng/còn lại; 3 thẻ kênh; phân bổ tháng; số khoản chờ; khoản kết thúc phân bổ; chi gần đây | Tháng, kênh |
| Khoản chi | Tab giao dịch, chờ xác nhận, lịch tái diễn; thêm/sửa/xác nhận/bỏ qua/hủy nhập nhầm; chi tiết và hoàn tiền | Ngày hoặc tháng, kênh, phân loại, nhãn, tìm diễn giải; trạng thái theo tab |
| Báo cáo & phân bổ | Hai chế độ thực chi/phân bổ; nhóm kênh/phân loại/nhãn; bảng chi tiết, xu hướng theo tháng; đã phân bổ/còn lại | Khoảng tháng, kênh, phân loại, nhãn, diễn giải; trạng thái phân bổ và kết thúc trong tháng |
| Ngân sách | Tháng; hạn mức ba kênh; tổng; đã chi/còn lại; sao chép tháng trước | Tháng |

- Form khoản chi: ngày chi, diễn giải, số tiền, kênh, phân loại, nhãn, số tháng phân bổ; chi phí/kỳ và tháng cuối chỉ đọc. Chỉ hiện trường lịch khi người dùng cần thiết lập tái diễn.
- Khi bấm số tổng theo kênh, mở danh sách chi tiết với bộ lọc tương ứng. Giữ bộ lọc khi quay lại.
- Trạng thái đang tải/lưu, trống, lỗi, thử lại phải có; lỗi đặt gần trường nhập. Không báo lưu thành công trước khi database xác nhận; giữ nội dung form khi lỗi mạng.
- Chỉ hiển thị tổng chính xác của toàn bộ phạm vi lọc; không lấy một trang dữ liệu rồi coi là toàn bộ báo cáo.

### Định hướng UI/UX để duyệt

- Giao diện sáng, nền trung tính, thẻ trắng, chữ đậm rõ; xanh cho hành động chính, xanh lá cho số dư, đỏ/cam kèm chữ cho vượt hạn mức. Màu không là dấu hiệu duy nhất.
- Font hệ thống hỗ trợ tiếng Việt, số tiền dùng chữ số có độ rộng đều; thân bài và input 16px, nhãn rõ; không tải font chỉ để trang trí.
- Mobile: một cột, thẻ giao dịch thay cho bảng rộng; thanh điều hướng dưới 4 mục, nút thêm dễ chạm; form toàn màn hình, bộ lọc trong sheet có nút Áp dụng/Xóa lọc.
- Tablet: bố cục hai cột ở tổng quan, danh sách và chi tiết khi đủ rộng. Desktop: sidebar, bảng với các cột cần thiết, chi tiết/form ở panel.
- Không cuộn ngang toàn trang, không vô hiệu hóa zoom, không dựa vào hover. Vùng chạm tối thiểu 44×44px; tính safe-area để thanh dưới không che nội dung hoặc nút lưu.
- Focus rõ, dùng bàn phím được, nhãn truy cập cho nút icon; tương phản chữ thường tối thiểu 4.5:1; tôn trọng reduced-motion.
- Biểu đồ chỉ phục vụ so sánh/xu hướng; luôn có số liệu đọc được, không dựa riêng tooltip. Không thêm animation framework.
- Nguồn thiết kế: đã chạy tìm design-system và thu hẹp query một lần. Kết quả có palette tài chính phù hợp nhưng pattern landing page và font trang trí không phù hợp ứng dụng nhập liệu. Không lưu nguyên kết quả đó. Định hướng trên là đề xuất biên tập từ yêu cầu cùng nguyên tắc responsive/accessibility mặc định của skill, chưa phải mockup đã được người dùng duyệt.

### Công nghệ và vận hành đề xuất

- React + Vite + TypeScript, Supabase Postgres và Auth; không backend riêng trong v1. Đây là phương án công nghệ đề xuất để duyệt cùng scope, không suy diễn việc có Docker là yêu cầu đổi database.
- UI và báo cáo tính trên client từ dữ liệu gốc; database giữ kiểm tra dữ liệu, quyền sở hữu, chống trùng kỳ và tính nguyên tử của hoàn tiền. Không coi kiểm tra client là ranh giới bảo mật.
- Các nhóm dữ liệu tối thiểu: khoản chi, ngân sách tháng/kênh, lịch tái diễn và kỳ, hoàn tiền. Ba kênh và ba nhãn cố định. Khóa người sở hữu cho dữ liệu riêng tư; kiểm tra liên kết cùng chủ sở hữu.
- Supabase Auth và RLS cho mọi dữ liệu được API công khai; frontend chỉ dùng publishable key, không chứa secret/service-role key. Tài khoản cá nhân được thiết lập theo nguồn xác thực người dùng cung cấp; chưa mở đăng ký đại trà.
- Có thể dùng SQL function nhỏ cho thao tác cần nguyên tử; không thêm tầng backend chỉ để chuyển tiếp CRUD.
- Môi trường Supabase cụ thể chưa được cung cấp. Đề xuất Supabase hosted cho dữ liệu/Auth; ứng dụng web chạy local. Nếu cần dữ liệu hoàn toàn local thì phải điều chỉnh phương án kết nối/Auth trong spec, không âm thầm đổi sang localStorage hoặc DB khác.
- Docker có sẵn là lựa chọn chạy dev nếu phù hợp image/runtime đã có; chưa bắt buộc container hóa. Kiểm tra process/container, mount, command và port thực tế trước chạy test. Ưu tiên hot reload; Docker build nếu cần vẫn theo quy trình duyệt build của người dùng.
- Sau triển khai và nghiệm thu, dùng cloudflared đã cài để public đúng cổng web local; không tải/cài cloudflared. Không public cổng database hoặc trang quản trị.
- Ưu tiên tunnel tạm để thử nếu máy hỗ trợ; tunnel tên miền cố định chỉ dùng khi người dùng chỉ định cấu hình và nguồn xác thực. Không tìm credential trong browser/Keychain. Xác minh binary, cách chạy và URL thực tế khi triển khai.
- Cloudflare chỉ cung cấp đường truy cập; đăng nhập vẫn bảo vệ ứng dụng. Link phụ thuộc máy local và tiến trình còn chạy; không cam kết online 24/7 hoặc URL cố định.
- Không chọn port hoặc claim runtime đang chạy ở bước viết spec. Không triển khai, mở tunnel, tải package hay build Docker trong bước này.

## Testing Decisions

Đề xuất điểm kiểm thử chính: luồng người dùng qua UI tới database thật của môi trường test riêng. Kiểm tra kết quả nhìn thấy và dữ liệu sau tải lại, không test chi tiết component hay mock thay cho persistence. Dự án chưa có test/tiền lệ để tái sử dụng.

Thêm một nhóm kiểm thử nhỏ cho phép tính phân bổ/hoàn tiền bằng dữ liệu cố định vì đây là logic tiền và biên tháng; không tạo bộ test cho từng hàm/component. Kiểm tra quyền truy cập qua API là bắt buộc vì UI không chứng minh được RLS.

Tiêu chí nghiệm thu đề xuất:

1. Nhập khoản một lần, tải lại/đổi thiết bị vẫn thấy đúng; tổng lọc và ngân sách khớp dữ liệu, kể cả danh sách nhiều trang.
2. Mua laptop 24 triệu ngày 15/11/2026, 12 tháng: tháng 11 thực chi 24 triệu; mỗi tháng 2 triệu từ 11/2026–10/2027; tháng 11/2027 không phân bổ nữa.
3. Khoản 100.000đ chia 3 tháng: 33.333, 33.333, 33.334; tổng đúng 100.000đ.
4. Thay ngân sách tháng 12 không đổi tháng 11; vượt hạn mức vẫn lưu, có cảnh báo; không tự chuyển dư.
5. Tạo kỳ tái diễn tự động còn chờ không ảnh hưởng thực chi/phân bổ; xác nhận một lần mới ảnh hưởng. Mở lại hoặc mở đồng thời hai phiên không sinh trùng; bỏ qua kỳ không bị tái tạo.
6. Kiểm tra ngày 31, tháng 2/năm nhuận, chu kỳ năm và bắt kịp kỳ khi mở lại; ngày nghiệp vụ không lệch do timezone.
7. Hoàn 2 triệu trong ví dụ 6 triệu nêu trên cho tổng chi phí 4 triệu; tháng trước giữ nguyên. Kiểm tra hoàn toàn phần, nhiều lần, hoàn sau hết phân bổ và ngăn tổng hoàn vượt giá trị mua kể cả ghi đồng thời.
8. Chọn tháng lịch sử thấy đúng trạng thái và kỳ cuối; số đã phân bổ + còn lại khớp giá trị ròng theo thời điểm báo cáo.
9. Người chưa đăng nhập không đọc/ghi được dữ liệu; tài khoản khác không truy cập được dữ liệu hoặc tạo liên kết tới dữ liệu không thuộc mình.
10. Kiểm tra viewport 375, 768, 1024, 1440px; không cuộn ngang toàn trang ở mức zoom mặc định; form dùng được khi bàn phím mở; zoom vẫn hoạt động; điều hướng bàn phím và lỗi nhập liệu rõ.
11. Kiểm tra lỗi mạng không mất nội dung đang nhập, không báo lưu thành công giả, thử lại không tạo giao dịch trùng.
12. Sau triển khai, URL Cloudflare mở được màn đăng nhập; chỉ người đăng nhập mới xem dữ liệu; không lộ secret hoặc cổng quản trị.

Trước mỗi lần test/API/browser: báo preflight process/container, command/image, Compose nếu có, source mount, port, DB đích và trạng thái; dùng runtime dev/hot reload đã xác minh. Test tạo dữ liệu nhận diện riêng, không tác động dữ liệu thật của người dùng. Không có test/runtime nào đã chạy ở bước viết tài liệu.

Các điểm kiểm thử và tiêu chí trên cần người dùng duyệt cùng scope trước triển khai, theo bước 2 của to-spec.

## Out of Scope

- Thu nhập, sổ tài khoản ngân hàng, đồng bộ ngân hàng, OCR hóa đơn, đa tiền tệ.
- Công nợ chi hộ, chia một giao dịch nhiều kênh, nhiều nhãn trên một khoản, danh mục phân cấp.
- Chuyển dư ngân sách, ngân sách phân bổ riêng, chốt sổ, nhật ký kiểm toán đầy đủ.
- Tự ghi khoản đến hạn thành đã chi, worker/scheduler khi app đóng, email/push nhắc hạn.
- Phân bổ theo ngày, đổi tháng bắt đầu khác tháng mua, tự dừng phân bổ khi ngừng dùng.
- Nhiều người chung sổ, phân quyền nhóm, đăng ký đại trà.
- Offline-first, app native, PWA, dark mode, xuất Excel/PDF trong v1.
- Next.js/backend riêng, Redis/queue/microservice; không thêm để dự phòng.
- Deploy Vercel, tên miền riêng, cam kết uptime 24/7 ở đợt local này.
- Tạo Git repo, commit/push/PR, đăng issue hoặc cài lại Cloudflare.

## Further Notes

- Người dùng đã đồng ý các khuyến nghị nghiệp vụ và đã chốt amendment v2 ở cuối tài liệu để triển khai tiếp.
- Phương án tự tạo kỳ khi mở app, định hướng UI sáng, React/Vite + Supabase hosted và tiêu chí nghiệm thu là các quyết định v1 đã dùng; không mở rộng chúng trong amendment này.
- Supabase project/nguồn cấu hình và tài khoản đăng nhập chưa được chỉ định. Đây là thông tin vận hành cần trước kết nối DB thật, không phải lý do trì hoãn việc viết spec.
- CODEX_HOME không được đặt trong shell kiểm tra; đã đọc instruction global tại profile .codex và instruction người dùng. Không truy cập credential hoặc thực hiện hành động nhạy cảm ở bước này.
- Trình tự tiếp theo của v2: lập kế hoạch ngắn → migration → triển khai UI/logic/persistence → kiểm thử runtime thật → cập nhật issue và bàn giao kết quả.

## Scope Amendment v2 — Sidebar thu gọn và hạng mục người dùng quản lý

Phần này là scope hiện hành cho đợt triển khai tiếp theo và supersede các câu trong v1 nói rằng chưa có hạng mục khoản mục riêng hoặc không quản lý hạng mục. Các quyết định v1 khác vẫn giữ nguyên.

### Problem Statement

Người dùng cần thu gọn sidebar trên màn hình rộng khi không dùng để có thêm không gian cho nội dung. Mỗi khoản chi cũng cần một **hạng mục** do chính tài khoản quản lý, tách biệt với kênh chi tiêu, phân loại và nhãn. Hạng mục phải có thể tạo ngay trong form thêm khoản chi, xuất hiện ngay trong lựa chọn sau khi tạo, dùng được cho khoản chi thường và lịch tái diễn, đồng thời dùng được khi lọc và thống kê.

### Solution

Giữ bốn khu vực hiện có. Sidebar desktop/tablet có trạng thái mở và thu gọn; trạng thái được nhớ ở trình duyệt. Trên mobile vẫn dùng thanh điều hướng dưới như hiện tại. Hạng mục được quản lý ngay trong trang **Khoản chi**, không tạo thêm mục điều hướng cấp cao. Form thêm/sửa khoản chi và form lịch tái diễn có trường Hạng mục cùng thao tác “Tạo hạng mục”. Danh sách và báo cáo có bộ lọc hạng mục.

### User Stories

1. Là người dùng desktop/tablet, tôi muốn bấm một nút trên sidebar để thu gọn/mở rộng sidebar mà không làm mất trang đang xem.
2. Là người dùng, tôi muốn lần sau mở cùng trình duyệt vẫn giữ trạng thái sidebar tôi đã chọn.
3. Là người dùng keyboard hoặc screen reader, tôi muốn nút sidebar có tên truy cập, focus rõ và tooltip khi sidebar đã thu gọn.
4. Là người dùng mobile, tôi muốn giữ thanh điều hướng dưới và không bị thêm sidebar ngang gây tràn màn hình.
5. Là người dùng, tôi muốn gắn một hạng mục tùy chọn cho khoản chi để phân biệt mục đích sử dụng.
6. Là người dùng, tôi muốn chọn hạng mục đã tạo trước đó trong form khoản chi.
7. Là người dùng, tôi muốn tạo hạng mục ngay tại form khoản chi mà không phải rời form hoặc mất dữ liệu đang nhập.
8. Là người dùng, tôi muốn sau khi tạo thành công hạng mục mới thì hạng mục đó được chọn ngay và xuất hiện trong các lần mở select tiếp theo.
9. Là người dùng, tôi muốn quản lý danh sách hạng mục của riêng mình trong trang Khoản chi.
10. Là người dùng, tôi muốn đổi tên hạng mục và thấy tên mới trong cả lịch sử cũ.
11. Là người dùng, tôi muốn lưu trữ hạng mục không còn dùng để nó không xuất hiện cho khoản mới nhưng vẫn giữ lịch sử cũ.
12. Là người dùng, tôi muốn hạng mục có thể gắn cho cả khoản chi một lần và lịch tái diễn.
13. Là người dùng, tôi muốn lọc danh sách khoản chi theo hạng mục.
14. Là người dùng, tôi muốn nhóm hoặc lọc báo cáo theo hạng mục để biết chi phí theo mục đích.
15. Là người dùng, tôi muốn khoản cũ chưa có hạng mục vẫn hiển thị rõ là “Chưa phân loại” và không bị mất khi nâng cấp dữ liệu.
16. Là người dùng, tôi muốn lỗi tạo hạng mục hoặc lỗi lưu khoản chi hiển thị gần trường liên quan, giữ nguyên nội dung form và không tạo bản ghi giả.

### Implementation Decisions

- Sidebar chỉ thu gọn trên tablet/desktop. Trạng thái mở hiển thị logo, tên, icon và nhãn; trạng thái thu gọn chỉ hiển thị icon, có tooltip/aria-label. Mobile giữ bottom navigation bốn mục.
- Nút thu gọn đặt ở vùng đầu sidebar, kích thước chạm tối thiểu 44×44px. Layout dùng một biến kích thước sidebar để main content, header và breakpoint cập nhật cùng nhau; không nhân bản CSS theo từng trang.
- Lưu trạng thái sidebar bằng `localStorage`. Nếu storage lỗi, dùng trạng thái mở mặc định và ứng dụng vẫn chạy.
- Hạng mục là thực thể riêng, khác với `channel`, `kind` và `tag`. Tên được chuẩn hóa khoảng trắng ở đầu/cuối, không rỗng, không phân biệt hoa thường khi kiểm tra trùng trong cùng tài khoản.
- Hạng mục là tùy chọn ở v2. Giá trị null trong dữ liệu cũ hoặc khoản mới được hiển thị là “Chưa phân loại”; không ép backfill giả.
- Người dùng quản lý hạng mục ngay trong trang Khoản chi: nút “Quản lý hạng mục” mở panel/sheet quản lý; không thêm mục Hạng mục vào sidebar.
- Form khoản chi và form lịch tái diễn có cùng select Hạng mục. Cạnh select có “+ Tạo hạng mục”; dialog/sheet tạo nhanh chỉ cần tên. Sau khi API xác nhận, client cập nhật nguồn dữ liệu dùng chung, đóng dialog, chọn hạng mục mới và giữ các field khác.
- Nếu tạo nhanh thất bại, không thêm option cục bộ; giữ form đang nhập, focus lại lỗi và cho phép thử lại. Nhiều lần tạo liên tiếp dùng cùng flow tạo đơn lẻ, không thêm endpoint bulk.
- Đổi tên hạng mục cập nhật bản ghi hạng mục và làm lịch sử hiển thị tên mới. Lưu trữ là soft archive; hạng mục archived không xuất hiện trong select khoản mới nhưng vẫn xuất hiện ở dữ liệu lịch sử và bộ lọc khi cần.
- Không hard delete hạng mục đã từng được tham chiếu. Không cho tạo hạng mục trùng tên sau khi chỉ khác hoa thường hoặc khoảng trắng.
- Database thêm bảng `categories` gồm id, user_id, name, archived, created_at; unique theo `(user_id, normalized_name)`; RLS chỉ cho chủ sở hữu đọc/ghi. Khoản chi và lịch tái diễn thêm nullable `category_id` với liên kết cùng chủ sở hữu. Kỳ tái diễn sinh từ lịch kế thừa category_id tại thời điểm tạo kỳ.
- Migration tạo bảng và cột trước khi client đọc trường mới. Không sửa migration đã chạy; thêm migration kế tiếp có kiểm tra owner-safe foreign key và index cho filter.
- Load dữ liệu lấy categories cùng các bảng hiện có. Mutation dùng cơ chế idempotent hiện tại cho create/rename/archive và liên kết category khi tạo/sửa expense hoặc schedule. Không thêm backend riêng.
- Category filter có option “Tất cả hạng mục” và “Chưa phân loại”; hạng mục archived vẫn lọc được bản ghi lịch sử. Reports cho phép group-by category bên cạnh channel/kind/tag.
- V1 không thêm màu, icon, cây phân cấp, ngân sách riêng theo hạng mục, nhiều hạng mục trên một khoản hoặc chuyển đổi lịch sử tự động.

### Testing Decisions

Seam chính đã chốt: browser flow của tài khoản test đi qua UI → mutation/RLS → tải lại dữ liệu. Luồng này phải chứng minh cả responsive layout và persistence, không thay bằng mock.

Tiêu chí nghiệm thu:

1. Desktop/tablet bấm thu gọn/mở rộng sidebar, main content không bị che hoặc cuộn ngang; reload vẫn giữ trạng thái. Mobile không xuất hiện sidebar ngang mới và bottom nav vẫn dùng được.
2. Trong form khoản chi, tạo hạng mục mới, thấy option ngay, option được chọn, lưu khoản chi, reload vẫn thấy đúng hạng mục.
3. Tạo hạng mục thất bại không làm mất dữ liệu form và không tạo option giả; nút tạo có trạng thái loading/disabled trong lúc request.
4. Tạo hạng mục trùng tên bị từ chối rõ ràng; hai request đồng thời không tạo bản ghi trùng.
5. Đổi tên hạng mục làm lịch sử hiển thị tên mới; archive ẩn khỏi khoản mới nhưng không xóa liên kết cũ.
6. Gán hạng mục cho lịch tái diễn; kỳ được sinh ra giữ đúng hạng mục; sửa category của lịch không làm đổi các kỳ đã xác nhận ngoài thao tác sửa riêng.
7. Lọc Khoản chi theo hạng mục, “Chưa phân loại” và “Tất cả” trả đúng tổng; Reports group/filter theo hạng mục khớp danh sách chi tiết.
8. Dữ liệu cũ không có category_id vẫn đọc được và hiển thị “Chưa phân loại”; tài khoản khác không đọc hoặc gán hạng mục của nhau.
9. Kiểm tra viewport 375, 768, 1024 và 1440px; không zoom để dùng select, dialog, sidebar; focus/aria label và trạng thái lỗi rõ.

Trước mỗi test/API/browser vẫn áp dụng runtime preflight trong AGENTS.md. Dữ liệu test phải dùng tài khoản/database test riêng, gắn nhận diện rõ và giữ lại để kiểm tra; không test trực tiếp dữ liệu production.

### Out of Scope

- Trang Hạng mục riêng ở sidebar hoặc route cấp cao.
- Màu/icon hạng mục, cây hạng mục, hạng mục con, nhiều hạng mục trên một khoản.
- Ngân sách riêng theo hạng mục, phân quyền chia sẻ hạng mục, import/export hạng mục.
- Hard delete hoặc tự gộp hai hạng mục đã tồn tại.
- Worker nền, thông báo, offline-first, package UI mới hoặc backend mới chỉ cho tính năng này.

### Further Notes

- Scope này không thay đổi flow Auth/Supabase session đã chốt ở issue #1; category chỉ dùng user_id hiện tại và RLS.
- Nếu migration production không được áp dụng trước khi deploy client, load dữ liệu sẽ lỗi vì thiếu bảng/cột; migration là bước bắt buộc trước smoke test thật.
- Nút “Quản lý hạng mục” nằm trong Khoản chi để giữ điều hướng ngắn; nếu sau này số lượng hạng mục lớn hoặc có cấu trúc phân cấp, khi đó mới tách route riêng.
- Issue tracker: [issue #2](https://github.com/cdat0145623/manage_money/issues/2) đã được tạo với nhãn `ready-for-agent`; không commit/push trong bước chốt spec.
