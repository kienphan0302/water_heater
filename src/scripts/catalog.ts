import { normalizeSearch } from '../data/catalog';

const form = document.querySelector<HTMLFormElement>('#catalog-filters');
const grid = document.querySelector<HTMLElement>('#catalog-grid');
const root = document.querySelector<HTMLElement>('#catalog');
const count = document.querySelector<HTMLElement>('#catalog-count');
const empty = document.querySelector<HTMLElement>('#catalog-empty');
const pagination = document.querySelector<HTMLElement>('#catalog-pagination');
const sort = document.querySelector<HTMLSelectElement>('#catalog-sort');
const cards = Array.from(grid?.querySelectorAll<HTMLElement>('[data-product-card]') || []);
const perPage = 12;
let page = 1;
const initialCategory = root?.dataset.initialCategory || '';
const params = new URLSearchParams(location.search);
const field = (name: string) => form?.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;
for (const name of ['q','category','brand','price']) { const item=field(name); if(item&&params.has(name)&&!(name==='category'&&initialCategory))item.value=params.get(name)||''; }
if(sort)sort.value=params.get('sort')||'default';
page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);

function render(updateUrl = true) {
  if(!form||!grid||!count||!empty||!pagination)return;
  const query=normalizeSearch(field('q')?.value||'');
  const category=initialCategory || field('category')?.value || '';
  const brand=field('brand')?.value||'';
  const price=field('price')?.value||'';
  const filtered=cards.filter(card=>{
    if(query&&!query.split(/\s+/).every(term=>card.dataset.search?.includes(term)))return false;
    if(category&&!card.dataset.category?.split(' ').includes(category))return false;
    if(brand&&card.dataset.brand!==brand)return false;
    const value=Number(card.dataset.price);const hasPrice=!!card.dataset.price&&value>0;
    if(price==='contact')return !hasPrice;
    if(price&&!hasPrice)return false;
    if(price==='under-3'&&value>=3_000_000)return false;
    if(price==='3-7'&&(value<3_000_000||value>7_000_000))return false;
    if(price==='7-15'&&(value<7_000_000||value>15_000_000))return false;
    if(price==='over-15'&&value<=15_000_000)return false;
    return true;
  });
  const order=sort?.value||'default';
  if(order==='name')filtered.sort((a,b)=>(a.dataset.name||'').localeCompare(b.dataset.name||'','vi'));
  if(order.startsWith('price-'))filtered.sort((a,b)=>{
    if(!a.dataset.price&&!b.dataset.price)return 0;if(!a.dataset.price)return 1;if(!b.dataset.price)return -1;
    return (Number(a.dataset.price)-Number(b.dataset.price))*(order==='price-desc'?-1:1);
  });
  const pages=Math.max(1,Math.ceil(filtered.length/perPage));page=Math.min(Math.max(1,page),pages);
  for(const card of cards)card.hidden=true;
  for(const card of filtered)grid.append(card);
  for(const card of filtered.slice((page-1)*perPage,page*perPage))card.hidden=false;
  const start=filtered.length?(page-1)*perPage+1:0;const end=Math.min(page*perPage,filtered.length);
  count.textContent=filtered.length?`${filtered.length} sản phẩm · Hiển thị ${start}–${end}`:'0 sản phẩm phù hợp';
  empty.hidden=filtered.length>0;grid.hidden=filtered.length===0;
  pagination.replaceChildren();
  if(pages>1)for(let index=1;index<=pages;index++){
    const button=document.createElement('button');button.type='button';button.textContent=String(index);button.setAttribute('aria-label',`Trang ${index}`);
    if(index===page)button.setAttribute('aria-current','page');
    button.addEventListener('click',()=>{page=index;render();root?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});pagination.append(button);
  }
  if(updateUrl){const url=new URL(location.href);for(const key of ['q','category','brand','price','sort','page'])url.searchParams.delete(key);for(const key of ['q','category','brand','price']){const value=field(key)?.value;if(value&&!(key==='category'&&initialCategory))url.searchParams.set(key,value);}if(order!=='default')url.searchParams.set('sort',order);if(page>1)url.searchParams.set('page',String(page));history.replaceState(null,'',url);}
}
form?.addEventListener('input',()=>{page=1;render();});form?.addEventListener('submit',event=>{event.preventDefault();page=1;render();});
form?.addEventListener('reset',()=>{requestAnimationFrame(()=>{if(initialCategory&&field('category'))field('category')!.value=initialCategory;if(sort)sort.value='default';page=1;render();});});sort?.addEventListener('change',()=>{page=1;render();});render(false);
