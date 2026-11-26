import contact from './contact.json';
import catalogMeta from '../data/catalog-meta.json';

export const site = {
  brand: 'BÌNH NÓNG LẠNH',
  shortBrand: 'Bình Nóng Lạnh',
  company: contact.company,
  description: contact.description,
  // Public business contact details confirmed by the owner on 23/11/2026.
  phone: contact.phone,
  phoneDisplay: /^0\d{9}$/.test(contact.phone) ? contact.phone.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3') : contact.phone,
  zalo: contact.zalo,
  email: contact.email,
  address: contact.address,
  hcmAddress: contact.hcmAddress,
  sourceUrl: 'https://tana-daithanh.com/',
  catalogDate: new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(catalogMeta.capturedAt)),
  readyToIndex: import.meta.env.PUBLIC_SITE_READY_TO_INDEX === 'true',
};
