import catalogMeta from '../data/catalog-meta.json';

export const site = {
  brand: 'BÌNH NÓNG LẠNH',
  shortBrand: 'Bình Nóng Lạnh',
  company: '',
  description: 'Khám phá máy nước nóng, bồn nước, máy lọc nước và thiết bị gia đình. So sánh thông tin sản phẩm và gửi yêu cầu tư vấn theo nhu cầu của bạn.',
  phone: '',
  phoneDisplay: '',
  zalo: '',
  email: '',
  address: '',
  sourceUrl: 'https://tana-daithanh.com/',
  catalogDate: new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(catalogMeta.capturedAt)),
  readyToIndex: import.meta.env.PUBLIC_SITE_READY_TO_INDEX === 'true',
};
