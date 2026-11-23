# Phương án hai website độc lập

Mục tiêu: hai website marketing nhận yêu cầu tư vấn, dễ cập nhật, chi phí thấp và có thể mở rộng.

| Thành phần | Phương án chọn | Lý do |
| --- | --- | --- |
| Tài khoản GitHub / Cloudflare | Giữ chung tài khoản sở hữu | Dễ quản lý; không cần tài khoản mới để tách ứng dụng |
| Mã nguồn | `solar_power` và `water_heater` | Lịch sử, phát hành và phân quyền riêng |
| Giao diện | Giữ Astro; ảnh WebP trong từng repo | Phù hợp danh mục/marketing; chưa cần CMS |
| Hosting/API | Mỗi repo một Pages project | Build, domain, binding và rollback riêng |
| Dữ liệu khách | `solar-leads` và `water-heater-leads` riêng | Tránh đọc/ghi chéo và dễ sao lưu riêng |
| Kiểm thử bình nóng lạnh | D1 `water-heater-leads-preview` | Form thử không tạo khách giả trong production |
| Email | Có thể cùng nhà cung cấp, cấu hình và người nhận riêng | Phân biệt hai luồng khách |
| GA4/GTM | Tạo mới cho cả hai web, property/container riêng | Theo lựa chọn của chủ website; tránh trộn báo cáo |
| Tài khoản Google | Tài khoản do chủ website chỉ định | Chủ website yêu cầu dùng chung tài khoản quản trị |
| Domain | Domain riêng từng web; dùng URL Pages trước | Chuyển domain sau khi form đã kiểm tra |
| Cập nhật | `main` cho production; nhánh tính năng cho preview | Kiểm tra trước phát hành và khôi phục riêng |

Giữ kiến trúc Pages + Functions + D1 hiện tại. Chưa cần thêm VPS, WordPress, giỏ hàng hoặc hệ thống quản trị cho lần tách này.

Thứ tự: chuyển mã nguồn → cấu hình D1 riêng → triển khai Pages mới → kiểm tra form/dữ liệu → chuyển URL/domain → ngừng API của bản thử cũ. Việc tạo tài nguyên Cloudflare và Google cần được xác minh trong các tài khoản tương ứng trước khi coi toàn bộ việc tách là hoàn tất.

Tài liệu chính thức:

- https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/
- https://developers.cloudflare.com/pages/functions/wrangler-configuration/
- https://developers.cloudflare.com/d1/best-practices/import-export-data/
