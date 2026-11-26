# Quản trị nội dung Water Heater

Mở https://app.pagescms.org/kienphan0302/water_heater/main. Save lưu trực tiếp lên main; Cloudflare tự build khi Git integration bật.

- Sản phẩm: sửa tên, giá, mô tả, thông số, dung tích và ảnh thay thế. Không đổi ID/slug hay xóa sản phẩm. Bỏ trống ảnh thay thế để dùng ảnh gốc; ảnh thay thế xuất hiện đầu thư viện ảnh.
- Kiểm tra priceMax và regularPrice khi thay giá. Giá không công bố giữ null (hiển thị Liên hệ), không dùng số 0.
- Bài viết SEO: tạo bài mới, dùng filename không dấu dạng ten-bai-viet.json. URL là /kien-thuc/<slug>/. Sửa các mục nội dung, meta SEO, ảnh; không đổi tên bài đã xuất bản. Thứ tự nhỏ xuất hiện trước.
- Banner: chỉnh tiêu đề, mô tả, chữ nút, ảnh và SEO trang chủ. Đích nút không đổi. Để trống ảnh để dùng banner cũ.
- Liên hệ: sửa hotline, Zalo, email công khai, địa chỉ và tên công ty. Email nhận lead là cấu hình riêng của Cloudflare.
- Media: tải ảnh WebP đã nén vào thư mục CMS; không xóa ảnh đang dùng. Không tải dữ liệu khách hàng hoặc khóa API.
- Sau Save kiểm tra commit và Cloudflare Deployments. Trước khi sửa code trên máy chạy git pull origin main. Build chạy npm run check:cms trước Astro; chạy thêm npm run check và npm test khi sửa code.
- Lệnh catalog:refresh lấy lại danh mục nguồn; cần sao lưu và hợp nhất giá, nội dung và ảnh CMS đã chỉnh thủ công để không ghi đè. Các kiểm thử danh mục gốc có số đếm cố định; nếu chủ động thay số sản phẩm hoặc giá còn thiếu, cần cập nhật kỳ vọng kiểm thử tương ứng.
