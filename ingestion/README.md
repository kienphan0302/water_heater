# Dữ liệu sản phẩm tham khảo

Nguồn công khai: <https://tana-daithanh.com/>. Bộ nhập kết hợp sitemap sản phẩm với toàn bộ trang danh mục để tìm đủ SKU, kể cả sản phẩm không xuất hiện trong các nhóm chính của trang nguồn.

## Tệp đầu ra

- `catalog.json`: sản phẩm, giá chính trên từng trang, thông số ngắn, ảnh và đường dẫn nguồn. Mô tả ngắn được biên soạn lại từ dữ kiện sản phẩm.
- `categories.json`: 7 nhóm chính phục vụ điều hướng và toàn bộ 13 danh mục nguồn, bao gồm quan hệ sản phẩm.
- `image-provenance.json`: nguồn, đường dẫn WebP cục bộ, kích thước và dung lượng của từng ảnh.
- `crawl-report.json`: số lượng, phạm vi bao phủ, trang phân trang, lỗi và các lưu ý chất lượng dữ liệu.

Ảnh WebP được lưu tại `public/images/catalog/`, giữ đúng tỷ lệ và có cạnh dài không quá 1600px. Tệp HTML trong `raw_cache/` chỉ dùng để nghiên cứu và khôi phục tác vụ; không đưa các tệp này vào website hay bản phát hành.

## Nhập lại dữ liệu

Môi trường Python cần `lxml` và `Pillow`.

```bash
python ingestion/import_catalog.py --refresh
```

Bỏ `--refresh` để tiếp tục dùng các trang đã thu thập trong bộ nhớ đệm. Bộ nhập chỉ đọc tài nguyên công khai, dùng tối đa 3 yêu cầu đồng thời, có thời gian chờ và số lần thử hữu hạn; không đăng nhập, gửi form liên hệ hoặc tạo đơn hàng.

Giá chưa được công bố được lưu là `null`. Các bảng giá khuyến mãi cũ hoặc bảng thông số cho cả dòng sản phẩm trong phần mô tả dài không thay thế giá/thông số của SKU đang xem. Điều kiện bảo hành và báo giá cuối cùng cần được đơn vị bán xác nhận khi tư vấn.

Một số nhãn nguồn không thống nhất: danh mục có slug Aroni nhưng tiêu đề KRONI; một số SKU nằm trong nhóm Uncategorized. Tên và thương hiệu từng SKU được giữ theo thông tin của trang sản phẩm, còn nhóm điều hướng được chuẩn hóa theo loại thiết bị. Không nhập số điện thoại, email, mã theo dõi hoặc đánh giá khách hàng của cửa hàng nguồn.
