# GA4 và Google Tag Manager

## Quyết định của chủ website

Sử dụng tài khoản Google do chủ website chỉ định để tạo mới GA4 và GTM cho cả website điện mặt trời và bình nóng lạnh. Đây là tài khoản quản trị, không phải một biến thay thế cho Measurement ID hoặc Container ID.

| Website | Repo | GA4 mới | GTM mới |
| --- | --- | --- | --- |
| Hướng Dương Solar | `solar_power` | Chờ tạo/xác minh | Chờ tạo/xác minh |
| Bình Nóng Lạnh | `water_heater` | Chờ tạo/xác minh | Chờ tạo/xác minh |

Cấu hình điện mặt trời trước chuyển đổi: Measurement ID `G-8TSNP33WY4`, GTM `GTM-WJT6H5J6`. Chưa thay các mã này cho tới khi có mã mới thực tế. Không xóa tài nguyên cũ; chúng giữ lịch sử trước chuyển đổi. Dữ liệu mới sẽ bắt đầu trong property mới.

## Cấu hình từng website

1. Dùng đúng Google quản trị, tạo property GA4 riêng, múi giờ Việt Nam và tiền tệ VND. Tạo Web stream với URL thực tế của website tương ứng, ghi lại Measurement ID.
2. Tạo GTM Web container riêng. Thêm Google tag dùng Measurement ID của chính website đó, kích hoạt trên các trang cần đo.
3. Tạo Custom Event trigger `generate_lead` và GA4 Event tag cùng tên. Đánh dấu `generate_lead` là key event trong GA4 nếu dùng để theo dõi yêu cầu tư vấn.
4. Gắn Container ID mới vào website tương ứng: điện mặt trời dùng cấu hình GTM của repo đó; bình nóng lạnh dùng `PUBLIC_WATER_HEATER_GTM_ID`.
5. Kiểm tra Preview/Tag Assistant và GA4 Realtime trước khi Publish. Mỗi website chỉ nạp một container đang hoạt động để tránh đếm trùng.

Form bình nóng lạnh chỉ phát `generate_lead` khi API xác nhận đã tạo yêu cầu; không gửi tên, điện thoại hay khu vực vào Analytics. Các nút liên hệ phát `click_phone`/`click_zalo` khi kênh đó đã được cấu hình.

Property và container chỉ được ghi nhận là đã tạo sau khi có ID thực tế từ Google. Không dùng email quản trị thay cho ID trong mã nguồn hoặc Pages variables.
