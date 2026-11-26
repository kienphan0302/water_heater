import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const read = p => JSON.parse(readFileSync(p,'utf8'));
const required = (v,k) => assert(typeof v === 'string' && v.trim(), k + ' is required');
const image = (v,k) => {
  if (!v) return;
  assert(typeof v === 'string' && /^\/images\/cms\/[a-zA-Z0-9_./-]+\.(?:webp|jpe?g|png)$/i.test(v) && !v.split('/').includes('..'), k + ': invalid image path');
  assert(existsSync(join('public',v.slice(1))),k + ': missing image ' + v);
};
const contact=read('src/config/contact.json');
for (const k of ["company","description","phone","zalo","email","address","hcmAddress"]) required(contact[k],'contact.'+k);
assert(/^(0|\+84)[0-9]{9,10}$/.test(contact.phone),'Invalid hotline');
assert(/^https:\/\/zalo\.me\/[a-zA-Z0-9._-]+\/?$/.test(contact.zalo),'Invalid Zalo URL');
assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email),'Invalid email');
const banner=read('src/config/banner.json');
for (const k of ['eyebrow','heading','accent','description','primaryLabel','secondaryLabel','seoTitle']) required(banner[k],'banner.'+k);
image(banner.image,'banner.image');
const articles=readdirSync('src/data/articles').filter(n=>n.endsWith('.json'));
for(const slug of ["chon-may-nuoc-nong-theo-nhu-cau","doc-bao-gia-va-pham-vi-lap-dat","chuan-bi-thong-tin-bao-hanh"]) assert(articles.includes(slug+'.json'),'Preserve article URL: '+slug);
for(const filename of articles) {
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(filename),'Invalid article filename '+filename);
  const item=read(join('src/data/articles',filename));
  for(const k of ['title','eyebrow','excerpt']) required(item[k],filename+':'+k);
  assert(Array.isArray(item.sections)&&item.sections.length,filename+': add at least one section');
  for(const s of item.sections){required(s.title,filename+': section.title');required(s.text,filename+': section.text');}
  image(item.cover,filename+':cover');
}
const products=read('src/data/products.json');
assert(Array.isArray(products)&&products.length>0,'No products');
assert(new Set(products.map(p=>p.id)).size===products.length,'Duplicate product ID');
assert(new Set(products.map(p=>p.slug)).size===products.length,'Duplicate product slug');
const protectedRoutes={"540":"may-nuoc-nong-nang-luong-mat-troi-dai-thanh-130l","549":"may-nuoc-nong-nang-luong-mat-troi-dai-thanh-160-lit","550":"may-nuoc-nong-nang-luong-mat-troi-dai-thanh-180-lit-58-18","551":"may-nuoc-nong-nang-luong-mat-troi-dai-thanh-215-lit-58-21","552":"may-nuoc-nong-nang-luong-mat-troi-dai-thanh-250-lit","553":"may-nuoc-nong-nang-luong-mat-troi-dai-thanh-300-lit","612":"bon-nuoc-inox-dai-thanh-sus-304-500lit-dung","613":"bon-nuoc-inox-dai-thanh-sus-304-700lit-dung","614":"bon-nuoc-inox-dai-thanh-sus-304-1000lit-dung","615":"bon-nuoc-inox-dai-thanh-sus-304-1500lit-dung","616":"bon-nuoc-inox-dai-thanh-sus-304-2000lit-dung","617":"bon-nuoc-inox-dai-thanh-sus-304-2500lit-dung","618":"bon-nuoc-inox-dai-thanh-sus-304-3000lit-dung","621":"bon-nuoc-inox-dai-thanh-sus-304-500lit-ngang","622":"bon-nuoc-inox-dai-thanh-sus-304-700lit-ngang","623":"bon-nuoc-inox-dai-thanh-sus-304-1000lit-ngang","624":"bon-nuoc-inox-dai-thanh-sus-304-1500lit-ngang","625":"bon-nuoc-inox-dai-thanh-sus-304-2000lit-ngang","626":"bon-nuoc-inox-dai-thanh-sus-304-2500lit-ngang","627":"bon-nuoc-inox-dai-thanh-sus-304-3000lit-ngang","636":"bon-nuoc-nhua-the-he-moi-500-lit-ngang","639":"bon-nuoc-nhua-the-he-moi-700-lit-ngang","640":"bon-nuoc-nhua-the-he-moi-1000-lit-ngang","641":"bon-nuoc-nhua-the-he-moi-1500-lit-ngang","647":"may-nuoc-nong-nang-luong-mat-troi-okayama-180-lit","649":"may-nuoc-nong-nang-luong-mat-troi-okayama-160-lit","651":"may-nuoc-nong-nang-luong-mat-troi-okayama-130-lit","652":"may-nuoc-nong-nang-luong-mat-troi-okayama-215-lit","653":"may-nuoc-nong-nang-luong-mat-troi-okayama-250-lit","654":"may-nuoc-nong-nang-luong-mat-troi-okayama-300-lit","672":"may-loc-nuoc-ro-arte-8-loi-2","675":"may-loc-nuoc-ro-arte-9-loi-2","676":"may-loc-nuoc-ro-arte-10-loi","678":"chau-rua-inox-304-nguyen-khoi-dai-thanh-dx41004","689":"chau-rua-inox-304-nguyen-khoi-dai-thanh-dx41101","691":"voi-sen-cao-cap-dai-thanh-dt709s","695":"voi-sen-cao-cap-dai-thanh-dt801s","699":"bon-tu-hoai-dai-thanh-500lit","702":"bon-tu-hoai-dai-thanh-1000lit","703":"bon-tu-hoai-dai-thanh-1500lit","704":"bon-tu-hoai-dai-thanh-2000lit","865":"may-loc-nuoc-ro-aqualast-8-loi","867":"may-loc-nuoc-ro-aqualast-9-loi","870":"may-loc-nuoc-ro-aqualast-10-loi","881":"sen-voi-tam-nong-lanh-inox-sus-304-tana-801s","890":"sen-cay-tam-nong-lanh-dung-tron-inox-sus-304-ds03","895":"sen-cay-tam-nong-lanh-dung-vuong-inox-304-ds04","940":"may-nuoc-nong-nang-luong-mat-troi-tan-a-gold-130-lit","941":"may-nuoc-nong-nang-luong-mat-troi-tan-a-gold-160-lit","943":"may-nuoc-nong-nang-luong-mat-troi-tan-a-gold-180-lit","944":"may-nuoc-nong-nang-luong-mat-troi-tan-a-gold-215-lit","945":"may-nuoc-nong-nang-luong-mat-troi-tan-a-gold-250-lit","946":"may-nuoc-nong-nang-luong-mat-troi-tan-a-gold-300-lit","1321":"may-nuoc-nong-nang-luong-mat-troi-aroni-130l","1324":"may-nuoc-nong-nang-luong-mat-troi-aroni-215l","1325":"may-nuoc-nong-nang-luong-mat-troi-aroni-250l","1327":"may-nuoc-nong-nang-luong-mat-troi-aroni-180l","1329":"may-nuoc-nong-nang-luong-mat-troi-aroni-160l","1340":"may-nuoc-nong-nang-luong-mat-troi-aroni-300l","1478":"may-nuoc-nong-nang-luong-mat-troi-tan-a-gold-150l","1589":"may-nlmt-tan-a-dai-thanh-ruot-ppr-chong-phen-man-150l"};
for(const [id,slug] of Object.entries(protectedRoutes)) assert(products.some(p=>String(p.id)===id&&p.slug===slug),'Preserve product URL: '+slug);
for(const p of products){
  assert(Number.isInteger(p.id)&&/^[a-z0-9-]+$/.test(p.slug),'Invalid product ID/slug');
  required(p.name,p.slug+':name');
  assert(['may-nuoc-nong','bon-inox','bon-nhua','bon-tu-hoai','may-loc-nuoc','chau-rua','sen-voi'].includes(p.categoryKey),'Invalid category '+p.slug);
  assert(Array.isArray(p.categories)&&Array.isArray(p.images)&&Array.isArray(p.specs),'Missing product data '+p.slug);
  assert(p.price===null||(Number.isFinite(p.price)&&p.price>0),'Invalid price '+p.slug);
  for(const k of ['regularPrice','priceMax']) assert(p[k]==null||(Number.isFinite(p[k])&&p[k]>=0),'Invalid '+k+' '+p.slug);
  for(const img of p.images) assert(typeof img.localPath==='string'&&/^\/images\/catalog\/[a-f0-9]+\.webp$/.test(img.localPath)&&existsSync(join('public',img.localPath.slice(1))),'Missing source image '+p.slug);
  image(p.cmsImage,p.slug+':cmsImage');
}
console.log('CMS data validated:',products.length,'products,',articles.length,'articles');
