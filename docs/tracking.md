# GA4 và Google Tag Manager

## Quyết định của chủ website

Sử dụng tài khoản Google do chủ website chỉ định để tạo mới GA4 và GTM cho cả website điện mặt trời và bình nóng lạnh. Đây là tài khoản quản trị, không phải một biến thay thế cho Measurement ID hoặc Container ID.

## Mã đang hoạt động — xác minh ngày 23/11/2026

| Website | Repo | GA4 mới | GTM mới |
| --- | --- | --- | --- |
| Hướng Dương Solar | `solar_power` | `G-3QGXCL4W0W` | `GTM-KQXP6PVG` |
| Bình Nóng Lạnh | `water_heater` | `G-XYT2ZXR5WL` | `GTM-PQ74L8GW` |

Đã đối chiếu container được tải trên hai website đang chạy và Measurement ID trong mã GTM đã xuất bản. Property GA4 điện mặt trời: `565561884`; bình nóng lạnh: `565549973`. Việc xác minh này chưa chứng minh quyền quản trị của một tài khoản Google hoặc dữ liệu xuất hiện trong báo cáo.

Container điện mặt trời cũ `GTM-WJT6H5J6` / `G-8TSNP33WY4` và container thử bình nóng lạnh `GTM-T8X373QV` không phải các mã đang sử dụng. Giữ tài nguyên cũ để đối chiếu lịch sử; không gắn thêm chúng vào trang đang chạy.

## Phần cần hoàn tất trong tài khoản Google

Tại thời điểm đối chiếu, hai container đã xuất bản Google tag cơ bản nhưng chưa có trigger/tag chuyển tiếp các custom event của website. Vì vậy, có page view hoặc người dùng Realtime chưa đủ để kết luận đo chuyển đổi đã hoàn tất.

Thực hiện riêng cho từng container trong bảng:

1. Tạo Custom Event trigger với tên sự kiện khớp biểu thức `^(generate_lead|click_phone|click_zalo)$`, bật tùy chọn dùng biểu thức chính quy.
2. Tạo tag **Google Analytics: GA4 Event**, điền Measurement ID cùng hàng trong bảng và Event Name là biến tích hợp **Event** (`{{Event}}`). Gắn trigger vừa tạo.
3. Tạo Data Layer Variable phiên bản 2 cho `form_name` và `page_path`, rồi ánh xạ hai tham số cùng tên trong Event Parameters. Không thêm họ tên, điện thoại, địa chỉ hoặc giá trị nhập của form. Không cần gửi `lead_id` cho báo cáo tổng hợp hiện tại.
4. Dùng Preview/Tag Assistant xác nhận mỗi sự kiện chỉ kích hoạt một lần và đúng property. Chỉ thử form với dữ liệu giả trong môi trường preview có D1 riêng; không tạo yêu cầu thử trong production khi chưa được chủ website cho phép.
5. Submit/Publish thay đổi và kiểm tra lại GA4 Realtime/DebugView. Đánh dấu riêng `generate_lead` là **key event** trong GA4; không coi lượt bấm gọi/Zalo là yêu cầu đã lưu.
6. Kiểm tra Google tag → **Allow user-provided data capabilities** và tắt thu thập tự động dữ liệu người dùng nếu chưa chủ động triển khai tính năng đó. Cờ tính năng trong mã GTM không tự chứng minh dữ liệu cá nhân đã được gửi.

Không thêm một đoạn GA4 trực tiếp bên cạnh GTM đang hoạt động. Cấu hình chuyển đổi chỉ được ghi nhận hoàn tất sau khi đã xuất bản và quan sát được sự kiện nhận đúng property.

## Cấu hình từng website

1. Dùng đúng Google quản trị, tạo property GA4 riêng, múi giờ Việt Nam và tiền tệ VND. Tạo Web stream với URL thực tế của website tương ứng, ghi lại Measurement ID.
2. Tạo GTM Web container riêng. Thêm Google tag dùng Measurement ID của chính website đó, kích hoạt trên các trang cần đo.
3. Tạo Custom Event trigger `generate_lead` và GA4 Event tag cùng tên. Đánh dấu `generate_lead` là key event trong GA4 nếu dùng để theo dõi yêu cầu tư vấn.
4. Gắn Container ID mới vào website tương ứng: điện mặt trời dùng cấu hình GTM của repo đó; bình nóng lạnh dùng `PUBLIC_WATER_HEATER_GTM_ID`.
5. Kiểm tra Preview/Tag Assistant và GA4 Realtime trước khi Publish. Mỗi website chỉ nạp một container đang hoạt động để tránh đếm trùng.

Form bình nóng lạnh chỉ phát `generate_lead` khi API xác nhận đã tạo yêu cầu; không gửi tên, điện thoại hay khu vực vào Analytics. Các nút liên hệ phát `click_phone`/`click_zalo` khi kênh đó đã được cấu hình.

Property và container chỉ được ghi nhận là đã tạo sau khi có ID thực tế từ Google. Không dùng email quản trị thay cho ID trong mã nguồn hoặc Pages variables.
