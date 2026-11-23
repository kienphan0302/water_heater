import catalogMeta from '../data/catalog-meta.json';

export const site = {
  brand: 'BÌNH NÓNG LẠNH',
  shortBrand: 'Bình Nóng Lạnh',
  company: 'Công ty TNHH Năng Lượng Xanh Hướng Dương',
  description: 'Khám phá máy nước nóng, bồn nước, máy lọc nước và thiết bị gia đình. So sánh thông tin sản phẩm và gửi yêu cầu tư vấn theo nhu cầu của bạn.',
  // Public business contact details confirmed by the owner on 23/11/2026.
  phone: '0385195555',
  phoneDisplay: '0385 195 555',
  zalo: 'https://zalo.me/0385195555',
  email: 'huongduongsolar8386@gmail.com',
  address: 'Căn 14 B26 Khu nhà ở Tân Lập, xã Hoài Đức, TP. Hà Nội',
  hcmAddress: '45 Nguyễn Thị Căn, Tân Thới Hiệp 21, Quận 12, TP. Hồ Chí Minh',
  sourceUrl: 'https://tana-daithanh.com/',
  catalogDate: new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(catalogMeta.capturedAt)),
  readyToIndex: import.meta.env.PUBLIC_SITE_READY_TO_INDEX === 'true',
};
