# Tách và triển khai website bình nóng lạnh

## Trạng thái cấu hình

Repo đang triển khai là `kienphan0302/water_heater`, nhánh `main`. Dự án Pages riêng đã hoạt động tại **https://water-heater-e3j.pages.dev/**. Solar tiếp tục dùng **https://solar-power-5w7.pages.dev/** từ repo `solar_power`.

Hai D1 đã có UUID thực tế trong `wrangler.jsonc`:

| Môi trường | D1 | Database ID |
| --- | --- | --- |
| Production | `water-heater-leads` | `0739d172-362d-4366-bc8e-17a829fb5aa1` |
| Preview | `water-heater-leads-preview` | `c719ab23-25ce-4e1a-9948-f9754640feac` |

Không tạo lại tài nguyên đã tồn tại. Các bước bên dưới phục vụ đối chiếu, khởi tạo schema còn thiếu hoặc dựng lại khi cần. Chưa xác minh email thông báo được cấu hình và chưa thực hiện phép thử ghi lead production.

Bản thử cũ ở nhánh `website/binh-nong-lanh-20261123` của `solar_power` cần chuyển hướng sang Pages mới và ngừng API ghi D1 điện mặt trời. Không merge nhánh đó vào `main` của điện mặt trời. Giữ dữ liệu cũ để đối chiếu, không tự xóa hoặc di chuyển dữ liệu khách.

## 1. Tạo D1 riêng

Cloudflare → **Storage & databases → D1 SQL Database → Create database**. Tạo:

| Database | Dùng cho |
| --- | --- |
| `water-heater-leads` | Yêu cầu khách hàng thật |
| `water-heater-leads-preview` | Kiểm thử trước phát hành |

Mở Console từng database và chạy toàn bộ `schema.sql`. Ghi lại Database ID thực tế. Có thể dùng Wrangler trong phiên đã có quyền Cloudflare:

```bash
npx wrangler d1 create water-heater-leads
npx wrangler d1 create water-heater-leads-preview
npm run cloudflare:configure -- --production-id UUID_PRODUCTION --preview-id UUID_PREVIEW
npx wrangler d1 execute water-heater-leads --remote --file=schema.sql
npx wrangler d1 execute water-heater-leads-preview --env=preview --remote --file=schema.sql
```

Thay các UUID bằng kết quả Cloudflare cấp. Công cụ cấu hình từ chối dùng lại D1 điện mặt trời hoặc dùng chung D1 giữa production và preview. Commit và push `wrangler.jsonc` sau khi cập nhật.

## 2. Tạo Pages project riêng

Cloudflare → **Workers & Pages → Create application → Pages → Connect to Git**. Nếu giao diện đang ở Workers, chọn lối vào Pages.

| Mục | Cấu hình |
| --- | --- |
| Repository | `kienphan0302/water_heater` |
| Project name | `water-heater` (URL thực tế `water-heater-e3j.pages.dev`) |
| Production branch | `main` |
| Root directory | Gốc repo |
| Build command | `npm run build:cloudflare` |
| Build output directory | `dist` |
| Node version | `24` |

Nếu danh sách GitHub chưa có repo mới, cấp quyền Cloudflare Workers & Pages cho repo `water_heater`, giữ quyền hiện có của `solar_power`. Nếu tên Pages thực tế khác `water-heater`, chạy lại công cụ cấu hình với `--project-name TEN_DU_AN_THUC_TE` rồi commit.

Wrangler là nguồn cấu hình D1. Binding của ứng dụng là `DB` ở cả production và preview; mỗi môi trường trỏ tới UUID riêng. Sau build thành công, dùng đúng URL do Cloudflare trả về.

## 3. Biến môi trường

| Tên | Mục đích |
| --- | --- |
| `NODE_VERSION` | `24` |
| `PUBLIC_WATER_HEATER_SITE_URL` | `https://water-heater-e3j.pages.dev` hiện tại; đổi khi có custom domain |
| `PUBLIC_WATER_HEATER_GTM_ID` | `GTM-PQ74L8GW` |
| `PUBLIC_SITE_READY_TO_INDEX` | `false` khi chưa chốt nội dung/domain; `true` ở production khi hoàn tất |
| `PUBLIC_WATER_HEATER_TURNSTILE_SITE_KEY` | Site key nếu bật Turnstile |
| `WATER_HEATER_TURNSTILE_SECRET_KEY` | Secret tương ứng, lưu dưới dạng secret |
| `WATER_HEATER_RESEND_API_KEY` | Khóa gửi email, lưu dưới dạng secret |
| `WATER_HEATER_FROM_EMAIL` | Địa chỉ gửi đã xác minh |
| `WATER_HEATER_NOTIFY_EMAIL` | Email nhận yêu cầu bình nóng lạnh |

Preview dùng cấu hình email kiểm thử riêng. Gmail quản trị GA4/GTM không tự động là email nhận khách.

## 4. Kiểm tra và chuyển hệ thống

1. Mở trang chủ, danh mục và trang chi tiết trên URL mới, kiểm tra giao diện điện thoại.
2. Mở `/api/health`: `formReady` phải là `true`, `databaseStatus` là `ready`. Endpoint xác thực các cột bằng truy vấn `LIMIT 0`, không đọc dòng khách hoặc ghi dữ liệu. Trả HTTP 503 khi thiếu binding/schema hoặc D1 không truy cập được. `notificationsReady` chỉ phản ánh đủ biến cấu hình email, không chứng minh gửi email thành công.
3. Thử form tên `[TEST]` trong preview và kiểm tra dòng chỉ xuất hiện trong D1 preview. Chỉ ghi thử production khi chủ website cho phép rõ ràng; kiểm thử unit dùng mock không thay thế hoàn toàn phép thử tích hợp.
4. Kiểm tra nhánh preview dùng D1 preview, khác D1 production.
5. Chỉ sau các bước trên mới đổi liên kết/domain và ngừng form ở bản thử cũ.

## 5. Dữ liệu ở bản thử cũ

Chỉ các dòng `source_path LIKE '/binh-nong-lanh/%'` thuộc website bình nóng lạnh. Đếm trước:

```sql
SELECT COUNT(*) AS total
FROM leads
WHERE source_path LIKE '/binh-nong-lanh/%';
```

Nếu chỉ có `[TEST]`, bắt đầu D1 mới sạch và giữ dữ liệu thử cũ để đối chiếu. Nếu có khách thật, sao chép riêng các dòng thuộc nguồn trên sang D1 mới, giữ ID/trạng thái, đối chiếu số lượng và ID; không gửi lại email khi sao chép. Không nhập toàn bộ `solar-leads` vào website mới. Không lưu file dữ liệu khách vào repo.

Sau khi URL mới hoạt động đúng, chuyển bản thử cũ thành trang chuyển hướng và tắt API ghi vào D1 cũ. Chỉ sửa nhánh bình nóng lạnh cũ; giữ `main`, domain, dự án `solar-power` và D1 `solar-leads` của điện mặt trời.

## 6. GA4 và Tag Manager mới cho cả hai website

Theo lựa chọn của chủ website ngày 23/11/2026: dùng tài khoản Google do chủ website chỉ định, tạo mới GA4/GTM cho cả hai web. Mỗi website có property GA4 và container GTM riêng. Hướng dẫn và bảng mã: [tracking.md](tracking.md).

## 7. Pipeline build bị trùng

Đã quan sát cùng một commit có **Cloudflare Pages thành công** và **Workers Builds: water-heater thất bại**. Kiến trúc này triển khai qua Pages; trong Cloudflare, kiểm tra Worker `water-heater` và ngắt build Git tự động của riêng Worker bị tạo trùng sau khi xác nhận không có luồng nào cần nó. Giữ dự án Pages, D1 và quyền GitHub App của cả hai repo. Không đổi Pages thành `wrangler deploy` để chữa dấu kiểm Workers.

Canonical mặc định dùng URL Pages ổn định, không dùng `CF_PAGES_URL` vì biến đó có thể là URL của một bản build. Khi thêm domain, cập nhật `PUBLIC_WATER_HEATER_SITE_URL` rồi build lại.
