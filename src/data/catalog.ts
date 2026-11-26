import rawProducts from './products.json';
import rawCategories from './categories.json';
import rawSourceCategories from './source-categories.json';

export interface ProductImage { sourceUrl: string; localPath: string; alt: string; }
export interface ProductSpec { label: string; value: string; }
export interface ProductVariant { id?: string | number; name?: string; price?: number | null; attributes?: Record<string, string>; }
export interface Category { key: string; name: string; sourceUrl?: string; description?: string; mainKey?: string; }
export interface Product {
  id: number | string; slug: string; name: string; categoryKey: string;
  categories: Category[]; brand?: string; price: number | null; regularPrice?: number | null;
  summary: string; specs: ProductSpec[]; images: ProductImage[]; sourceUrl: string;
  variants?: ProductVariant[]; sourceStatus?: string; priceMax?: number | null;
  cmsImage?: string | null; cmsImageAlt?: string | null;
}

export const products = rawProducts as unknown as Product[];
export const categories = rawCategories as unknown as Category[];
export const sourceCategories = rawSourceCategories as unknown as Category[];
export const allCategories = [...categories, ...sourceCategories.filter(category => category.key !== 'uncategorized' && !categories.some(main => main.key === category.key))];
export const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
export const productPrice = (product: Product) => product.price && product.price > 0 ? (product.priceMax && product.priceMax > product.price ? `${money(product.price)} – ${money(product.priceMax)}` : money(product.price)) : 'Liên hệ';
export const productHref = (product: Product) => `/san-pham/${product.slug}/`;
export const categoryHref = (category: Category | string) => `/danh-muc/${typeof category === 'string' ? category : category.key}/`;
export const categoryName = (key: string) => allCategories.find(category => category.key === key)?.name || 'Thiết bị gia đình';
export const productImages = (product: Product): ProductImage[] => product.cmsImage ? [{ localPath: product.cmsImage, alt: product.cmsImageAlt || product.name, sourceUrl: '' }, ...product.images.filter(image => image.localPath !== product.cmsImage)] : product.images;
export const productImage = (product: Product) => productImages(product)[0]?.localPath || '/images/product-placeholder.svg';
export const productsInCategory = (key: string) => products.filter(product => product.categoryKey === key || product.categories.some(category => category.key === key));
export const normalizeSearch = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd').trim();
export const categoryIcon = (category: Category) => {
  const key = normalizeSearch(category.name);
  if (key.includes('loc')) return 'filter';
  if (key.includes('sen') || key.includes('voi')) return 'faucet';
  if (key.includes('chau')) return 'sink';
  if (key.includes('nong') || key.includes('nlmt')) return 'sun';
  return 'tank';
};
