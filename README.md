# Website Bình Nóng Lạnh

Mã nguồn độc lập tại `kienphan0302/water_heater`. Website sử dụng Astro + Cloudflare Pages Functions + D1 để giới thiệu sản phẩm và nhận yêu cầu tư vấn.

- 61 sản phẩm, 7 nhóm, 32 ảnh WebP cục bộ khoảng 1,76 MB.
- Tìm kiếm tiếng Việt, lọc/sắp xếp/phân trang, 61 trang sản phẩm.
- Giới thiệu, liên hệ, cẩm nang, bảo hành, giao nhận, bảo mật và trang 404.
- Form lưu D1, chống gửi trùng và phát `generate_lead` sau khi lưu thành công.

Dữ liệu sản phẩm tham khảo từ `https://tana-daithanh.com/`, giữ nguồn và thời điểm thu thập. Giá và chính sách cần được xác nhận trước khi kinh doanh.

## Chạy trên máy

Node.js 24 trở lên:

```bash
npm ci
npm run setup
npm run check
npm test
npm run check:isolation
npm run dev
```

Thử cả API và D1 cục bộ:

```bash
npm run build
npm run db:local
npm run preview
```

Các lệnh trên không ghi vào D1 Cloudflare.

## Triển khai độc lập

Tạo hai D1 mới: `water-heater-leads` cho production và `water-heater-leads-preview` cho bản thử. Điền UUID do Cloudflare cấp:

```bash
npm run cloudflare:configure -- --production-id UUID_PRODUCTION --preview-id UUID_PREVIEW
```

Nếu tên Pages thực tế khác `water-heater`, thêm `--project-name TEN_DU_AN_THUC_TE` vào lệnh trên.

Tạo Pages project mới kết nối **repo này**, nhánh `main`, build command **`npm run build:cloudflare`**, output **`dist`**, Node **`24`**. Bản mã nguồn này không trỏ tới D1 điện mặt trời. Build triển khai sẽ dừng khi chưa nhập hai UUID riêng.

Hướng dẫn từng bước: [docs/deploy.md](docs/deploy.md). Đánh giá các thành phần: [docs/architecture.md](docs/architecture.md).

## Cá nhân hóa

| Nội dung | Vị trí |
| --- | --- |
| Thương hiệu, hotline, Zalo, email, địa chỉ | `src/config/site.ts` |
| Sản phẩm | `src/data/products.json` |
| Danh mục | `src/data/categories.json` |
| Màu sắc, bố cục | `src/styles/global.css` |
| Cẩm nang | `src/data/articles.ts` |

Tên mặc định là “Bình Nóng Lạnh”; thông tin liên hệ chưa xác nhận nên để trống. Tài khoản quản trị GA4/GTM do chủ website chỉ định; mã theo dõi mới chỉ được nhập sau khi tạo và xác minh.

## Cập nhật danh mục

Python cần `lxml` và `Pillow`:

```bash
python3 -m pip install lxml Pillow
npm run catalog:refresh
npm test
npm run build
```

Không đưa `.env`, `.dev.vars`, dữ liệu khách, cache nghiên cứu, `node_modules` hoặc `dist` vào Git.
