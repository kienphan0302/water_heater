#!/usr/bin/env python3
"""Import public factual product data from tana-daithanh.com.

Requires Python 3.11+, lxml and Pillow. No authentication, cart, checkout or
contact requests are made. Long marketing copy and customer reviews are not
copied. Cached HTML stays research-only and must not be deployed.
"""
from __future__ import annotations

import concurrent.futures
import argparse
import copy
import hashlib
import io
import json
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from lxml import etree, html
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
INGEST = ROOT / 'ingestion'
CACHE = INGEST / 'raw_cache'
IMAGES = ROOT / 'public/images/catalog'
BASE = 'https://tana-daithanh.com/'
USER_AGENT = 'Mozilla/5.0 (compatible; PublicProductCatalogImport/1.0)'
TIMEOUT = 22
WORKERS = 3
LOCK = threading.Lock()
FAILURES: list[dict] = []
REQUESTS: list[dict] = []
REFRESH = False

MAIN_CATEGORIES = [
    {'key': 'may-nuoc-nong', 'name': 'Máy nước nóng năng lượng mặt trời', 'sourceSlug': 'may-nuoc-nong-nang-luong-mat-troi'},
    {'key': 'bon-inox', 'name': 'Bồn nước inox', 'sourceSlug': 'bon-nuoc-inox'},
    {'key': 'bon-nhua', 'name': 'Bồn nước nhựa', 'sourceSlug': 'bon-nuoc-nhua'},
    {'key': 'bon-tu-hoai', 'name': 'Bồn tự hoại', 'sourceSlug': 'bon-tu-hoai'},
    {'key': 'may-loc-nuoc', 'name': 'Máy lọc nước RO', 'sourceSlug': 'may-loc-nuoc'},
    {'key': 'chau-rua', 'name': 'Chậu rửa', 'sourceSlug': 'chau-rua'},
    {'key': 'sen-voi', 'name': 'Sen vòi', 'sourceSlug': 'sen-voi'},
]


def clean(value) -> str:
    return re.sub(r'\s+', ' ', str(value or '')).strip()


def canonical(url: str) -> str:
    p = urllib.parse.urlsplit(urllib.parse.urljoin(BASE, url))
    return urllib.parse.urlunsplit((p.scheme or 'https', p.netloc, p.path.rstrip('/') + '/', '', ''))


def fetch(url: str, *, cache=True, kind='html') -> bytes:
    key = hashlib.sha256(url.encode()).hexdigest()
    path = CACHE / (key + '.bin')
    if cache and path.exists() and not REFRESH:
        return path.read_bytes()
    last = None
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': '*/*'})
            started = time.monotonic()
            with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
                data = response.read(25 * 1024 * 1024)
                status = response.status
            if cache:
                path.write_bytes(data)
            with LOCK:
                REQUESTS.append({'url': url, 'status': status, 'bytes': len(data), 'seconds': round(time.monotonic() - started, 2), 'kind': kind})
            return data
        except Exception as exc:
            last = exc
            if isinstance(exc, urllib.error.HTTPError) and exc.code in (401, 403, 404):
                break
            if attempt == 0:
                time.sleep(.4)
    raise RuntimeError(f'{url}: {last}')


def sitemap_urls(url: str, seen=None) -> list[str]:
    seen = seen or set()
    if url in seen:
        return []
    seen.add(url)
    node = etree.fromstring(fetch(url, kind='sitemap'))
    if etree.QName(node).localname == 'sitemapindex':
        urls = []
        for child in node.xpath('//*[local-name()="sitemap"]/*[local-name()="loc"]/text()'):
            # Only the requested catalog, not unrelated posts or accounts.
            if re.search(r'/(product|product_cat)(?:-sitemap\d*|_sitemap)\.xml', child):
                urls.extend(sitemap_urls(child, seen))
        return urls
    return node.xpath('//*[local-name()="url"]/*[local-name()="loc"]/text()')


def money(text: str) -> int | None:
    digits = re.sub(r'\D', '', text or '')
    return int(digits) if digits else None


def main_key(url: str, name='') -> str:
    haystack = (url + ' ' + name).lower()
    for needle, key in [
        ('bon-nuoc-inox', 'bon-inox'), ('bon-nuoc-nhua', 'bon-nhua'),
        ('bon-tu-hoai', 'bon-tu-hoai'), ('chau-rua', 'chau-rua'),
        ('may-loc-nuoc', 'may-loc-nuoc'), ('sen-voi', 'sen-voi'),
        ('voi-sen', 'sen-voi'), ('sen-cay', 'sen-voi'),
        ('may-nuoc-nong', 'may-nuoc-nong'), ('may-nlmt', 'may-nuoc-nong')
    ]:
        if needle in haystack:
            return key
    return 'may-nuoc-nong' if 'năng lượng mặt trời' in haystack else 'khac'


def extract_lines(node) -> list[str]:
    clone = copy.deepcopy(node)
    for unwanted in clone.xpath('.//script|.//style|.//table'):
        unwanted.drop_tree()
    for br in clone.xpath('.//br'):
        br.tail = '\n' + (br.tail or '')
    for block in clone.xpath('.//p|.//div|.//li'):
        block.tail = '\n' + (block.tail or '')
    return [clean(line) for line in clone.text_content().splitlines() if clean(line)]


def add_spec(specs: list[dict], label: str, value: str) -> None:
    label, value = clean(label).strip(' :–-'), clean(value).strip(' :–-')
    if not label or not value or len(label) > 90 or len(value) > 240:
        return
    if label.lower() in {'thiết kế', 'khuyến mãi', 'ưu đãi', 'giá bán', 'giá bán km', 'giá', 'bảo trì'}:
        return
    if not any(s['label'].lower() == label.lower() and s['value'].lower() == value.lower() for s in specs):
        specs.append({'label': label, 'value': value})


def parse_product(url: str) -> dict:
    doc = html.fromstring(fetch(url))
    headings = doc.xpath('//h1[contains(@class,"product_title")]')
    if not headings:
        raise RuntimeError('No product title; source is not a product detail page')
    name = clean(headings[0].text_content())
    product = doc.xpath('//*[starts-with(@id,"product-")]')
    identifier = int(re.search(r'(\d+)$', product[0].get('id')).group(1)) if product else None
    summary_nodes = doc.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," summary ")]')
    summary = summary_nodes[0] if summary_nodes else doc
    price_nodes = summary.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," price ")]')
    price_node = price_nodes[0] if price_nodes else None
    current, regular, price_max = None, None, None
    if price_node is not None:
        sale_amounts = price_node.xpath('.//ins//*[contains(@class,"woocommerce-Price-amount")]')
        original_amounts = price_node.xpath('.//del//*[contains(@class,"woocommerce-Price-amount")]')
        all_amounts = price_node.xpath('.//*[contains(@class,"woocommerce-Price-amount")]')
        values = [money(n.text_content()) for n in sale_amounts or all_amounts]
        values = [v for v in values if v is not None]
        if values:
            current, price_max = min(values), max(values)
        if original_amounts:
            regular = money(original_amounts[0].text_content())
        elif current is not None:
            regular = current
    cats = []
    for a in summary.xpath('.//*[contains(@class,"posted_in")]//a[@href]'):
        source_url = canonical(a.get('href'))
        cat_key = urllib.parse.urlsplit(source_url).path.rstrip('/').split('/')[-1]
        cats.append({'key': cat_key, 'name': clean(a.text_content()), 'sourceUrl': source_url})
    group = next((main_key(c['sourceUrl']) for c in cats if main_key(c['sourceUrl']) != 'khac'), main_key(url, name))
    specs = []
    short_nodes = summary.xpath('.//*[contains(@class,"woocommerce-product-details__short-description")]')
    lines = extract_lines(short_nodes[0]) if short_nodes else []
    for line in lines:
        if re.search(r'miễn phí|giao hàng|khuyến mãi|tặng|lắp đặt miễn phí|toàn khu vực', line, re.I):
            continue
        match = re.match(r'^([^:]{2,75})\s*:\s*(.+)$', line)
        if match:
            add_spec(specs, match[1], match[2])
    attributes = doc.xpath('//*[contains(@class,"woocommerce-product-attributes")]//tr')
    for row in attributes:
        th, td = row.xpath('./th'), row.xpath('./td')
        if th and td:
            add_spec(specs, th[0].text_content(), td[0].text_content())
    # Short-description tables generally describe this exact SKU. Preserve
    # simple label/value tables and dimensional groups; skip generic family
    # tables and promotional price lists in the long description.
    if short_nodes:
        for table in short_nodes[0].xpath('.//table'):
            rows = [[clean(c.text_content()) for c in r.xpath('./td|./th')] for r in table.xpath('.//tr')]
            context = ''
            previous = None
            for cells in rows:
                if len(cells) == 1:
                    context = cells[0]
                    previous = None
                elif len(cells) == 2:
                    numeric = all(bool(re.search(r'\d', c)) for c in cells)
                    if numeric and previous and len(previous) == 2:
                        for label, value in zip(previous, cells):
                            add_spec(specs, f'{context} · {label}' if context else label, value)
                    elif not numeric:
                        previous = cells
    capacity_match = re.search(r'(\d[\d.,]*)\s*(?:lít|lit|l\b)', name, re.I)
    if capacity_match and not any(re.search(r'dung tích', s['label'], re.I) for s in specs):
        add_spec(specs, 'Dung tích', capacity_match[1] + ' lít')
    if not any(re.search(r'vật liệu|chất liệu', s['label'], re.I) for s in specs):
        material_in_title = re.search(r'Inox\s+(?:SUS\s*)?304', name, re.I)
        if material_in_title:
            add_spec(specs, 'Vật liệu', clean(material_in_title.group(0)))
    if 'nóng lạnh' in name.lower() and not any('chức năng' in s['label'].lower() for s in specs):
        add_spec(specs, 'Chức năng', 'Nóng – lạnh')
    if not any(re.search(r'chức năng|kiểu|loại', s['label'], re.I) for s in specs):
        if 'ngang' in name.lower():
            add_spec(specs, 'Kiểu lắp', 'Ngang')
        elif 'đứng' in name.lower():
            add_spec(specs, 'Kiểu lắp', 'Đứng')
    if group == 'may-loc-nuoc':
        stages = re.search(r'(\d+)\s*lõi', name, re.I)
        if stages:
            add_spec(specs, 'Số lõi', stages.group(1) + ' lõi')
    brand = next((b for b in ['Okayama', 'Kroni', 'Aroni', 'Tân Á Gold', 'Aqualast', 'Arte', 'Đại Thành', 'Tân Á'] if b.lower() in name.lower()), None)
    image_urls = []
    gallery = doc.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," woocommerce-product-gallery ")]')
    if gallery:
        for a in gallery[0].xpath('.//*[contains(@class,"woocommerce-product-gallery__image")]/a[@href]'):
            if re.search(r'\.(png|jpe?g|webp)(?:\?|$)', a.get('href'), re.I):
                image_urls.append(urllib.parse.urljoin(BASE, a.get('href')))
    if not image_urls:
        image_urls = doc.xpath('//meta[@property="og:image"]/@content')[:1]
    image_urls = list(dict.fromkeys(image_urls))
    variations = []
    for data in doc.xpath('//form[@data-product_variations]/@data-product_variations'):
        try:
            payload = json.loads(data)
            if isinstance(payload, list):
                for v in payload:
                    variations.append({'id': v.get('variation_id'), 'attributes': v.get('attributes'), 'price': v.get('display_price'), 'regularPrice': v.get('display_regular_price')})
        except ValueError:
            pass
    category_name = next((c['name'] for c in MAIN_CATEGORIES if c['key'] == group), 'Thiết bị nước')
    capacity = next((s['value'] for s in specs if 'dung tích' in s['label'].lower()), '')
    material = next((s['value'] for s in specs if re.search('vật liệu|chất liệu', s['label'], re.I)), '')
    fact_parts = [category_name + (f' dung tích {capacity}' if capacity else '')]
    if brand:
        fact_parts.append(f'dòng {brand}')
    original_summary = ', '.join(fact_parts) + '.'
    if material:
        original_summary += f' Vật liệu được công bố: {material}.'
    stock = summary.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," stock ")]')
    stock_status = clean(stock[0].text_content()) if stock else None
    return {'id': identifier, 'slug': urllib.parse.urlsplit(url).path.rstrip('/').split('/')[-1], 'name': name,
            'categoryKey': group, 'categories': cats, 'brand': brand, 'price': current, 'priceMax': price_max,
            'regularPrice': regular, 'currency': 'VND', 'summary': original_summary, 'specs': specs,
            'capacityLiters': int(re.sub(r'\D', '', capacity_match[1])) if capacity_match else None,
            'images': [{'sourceUrl': u, 'localPath': None, 'alt': name} for u in image_urls],
            'sourceUrl': canonical(url), 'variants': variations, 'sourceStatus': 'fetched', 'stockStatus': stock_status,
            'priceSource': 'primary-product-summary', 'notes': []}


def parse_category(url: str) -> dict:
    doc = html.fromstring(fetch(url))
    headings = doc.xpath('//h1')
    name = clean(headings[0].text_content()) if headings else urllib.parse.urlsplit(url).path.rstrip('/').split('/')[-1]
    category_key = urllib.parse.urlsplit(url).path.rstrip('/').split('/')[-1]
    products = list(dict.fromkeys(canonical(u) for u in doc.xpath('//a[contains(@class,"woocommerce-LoopProduct-link")]/@href') if '/san-pham/' in u))
    pagination = list(dict.fromkeys(urllib.parse.urljoin(url, u) for u in doc.xpath('//*[contains(@class,"page-numbers")]//a/@href')))
    count_text = doc.xpath('//*[contains(@class,"woocommerce-result-count")]//text()')
    return {'key': category_key, 'mainKey': main_key(url, name), 'name': name, 'sourceUrl': canonical(url),
            'sourceProductUrls': products, 'pagination': pagination, 'sourceCountText': clean(' '.join(count_text))}


def download_image(url: str) -> dict:
    key = hashlib.sha256(url.encode()).hexdigest()[:16]
    target = IMAGES / (key + '.webp')
    if target.exists():
        with Image.open(target) as image:
            width, height = image.size
        return {'sourceUrl': url, 'localPath': '/images/catalog/' + target.name, 'width': width, 'height': height, 'bytes': target.stat().st_size}
    data = fetch(url, cache=False, kind='image')
    with Image.open(io.BytesIO(data)) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        if image.mode not in ('RGB', 'RGBA'):
            image = image.convert('RGBA' if 'transparency' in image.info else 'RGB')
        image.save(target, format='WEBP', quality=87, method=6)
        width, height = image.size
    with Image.open(target) as image:
        image.verify()
    return {'sourceUrl': url, 'localPath': '/images/catalog/' + target.name, 'width': width, 'height': height, 'bytes': target.stat().st_size, 'originalBytes': len(data)}


def save(name: str, value) -> None:
    (INGEST / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def augment_category_relations(products: list[dict], categories: list[dict]) -> None:
    """Preserve category-list memberships in addition to the SKU's posted tags."""
    for product in products:
        known = {c['sourceUrl'] for c in product['categories']}
        for category in categories:
            if product['sourceUrl'] in category['sourceProductUrls'] and category['sourceUrl'] not in known:
                product['categories'].append({k: category[k] for k in ('key', 'name', 'sourceUrl')})
                known.add(category['sourceUrl'])


def run() -> None:
    for directory in [INGEST, CACHE, IMAGES]:
        directory.mkdir(parents=True, exist_ok=True)
    # Keep source HTML out of source control and generated site archives.
    (INGEST / '.gitignore').write_text('raw_cache/\n*.html\n')
    now = datetime.now(timezone.utc).isoformat()
    for file in INGEST.glob('*.html'):
        cache = CACHE / (file.stem + '.html')
        if not cache.exists():
            file.rename(cache)
    products_sitemap = list(dict.fromkeys(u for u in sitemap_urls(BASE + 'product-sitemap.xml') if '/san-pham/' in u))
    categories_sitemap = list(dict.fromkeys(u for u in sitemap_urls(BASE + 'product_cat-sitemap.xml') if '/danh-muc/' in u))
    print(json.dumps({'phase': 'discovery', 'products': len(products_sitemap), 'categories': len(categories_sitemap)}), flush=True)
    categories, discovered = [], set(products_sitemap)
    pending = list(categories_sitemap)
    seen_pages = set()
    while pending:
        batch = [u for u in pending if u not in seen_pages]
        pending = []
        if not batch:
            break
        with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
            futures = {pool.submit(parse_category, u): u for u in batch}
            for future in concurrent.futures.as_completed(futures):
                url = futures[future]
                seen_pages.add(url)
                try:
                    category = future.result()
                    categories.append(category)
                    discovered.update(category['sourceProductUrls'])
                    pending.extend(u for u in category['pagination'] if u not in seen_pages)
                except Exception as exc:
                    FAILURES.append({'stage': 'category', 'url': url, 'error': str(exc)})
    categories.sort(key=lambda c: c['sourceUrl'])
    save('categories.json', {'source': BASE, 'capturedAt': now, 'mainCategories': MAIN_CATEGORIES, 'sourceCategories': categories})
    products = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(parse_product, u): u for u in sorted(discovered)}
        for future in concurrent.futures.as_completed(futures):
            url = futures[future]
            try:
                product = future.result()
                products.append(product)
                save('catalog.partial.json', {'source': BASE, 'capturedAt': now, 'products': sorted(products, key=lambda p: p['id'] or 0)})
                print(json.dumps({'phase': 'product', 'done': len(products), 'total': len(discovered), 'id': product['id'], 'name': product['name'], 'price': product['price']}, ensure_ascii=False), flush=True)
            except Exception as exc:
                FAILURES.append({'stage': 'product', 'url': url, 'error': str(exc)})
    products.sort(key=lambda p: p['id'] or 0)
    augment_category_relations(products, categories)
    save('catalog.json', {'source': BASE, 'capturedAt': now, 'products': products})
    unique_images = sorted(set(i['sourceUrl'] for p in products for i in p['images']))
    image_map = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(download_image, u): u for u in unique_images}
        for future in concurrent.futures.as_completed(futures):
            url = futures[future]
            try:
                asset = future.result()
                image_map[url] = asset
                print(json.dumps({'phase': 'image', 'done': len(image_map), 'total': len(unique_images), 'file': asset['localPath']}), flush=True)
            except Exception as exc:
                FAILURES.append({'stage': 'image', 'url': url, 'error': str(exc)})
    for product in products:
        for image in product['images']:
            if image['sourceUrl'] in image_map:
                image.update(image_map[image['sourceUrl']])
        product['images'] = [i for i in product['images'] if i['localPath']]
        if not product['images']:
            product['notes'].append('Ảnh sản phẩm chưa tải thành công từ nguồn.')
        if product['price'] is None:
            product['notes'].append('Nguồn không công bố giá trong vùng thông tin chính; cần liên hệ báo giá.')
    counts = Counter(p['categoryKey'] for p in products)
    for category in MAIN_CATEGORIES:
        category['productCount'] = counts[category['key']]
        representative = next((p for p in products if p['categoryKey'] == category['key'] and p['images']), None)
        category['image'] = representative['images'][0] if representative else None
    save('catalog.json', {'source': BASE, 'capturedAt': now, 'products': products})
    save('categories.json', {'source': BASE, 'capturedAt': now, 'mainCategories': MAIN_CATEGORIES, 'sourceCategories': categories})
    save('image-provenance.json', {'capturedAt': now, 'images': list(image_map.values())})
    report = {'source': BASE, 'capturedAt': now, 'productSitemapCount': len(products_sitemap), 'categorySitemapCount': len(categories_sitemap),
              'discoveredProductCount': len(discovered), 'fetchedProductCount': len(products), 'fetchedCategoryPages': len(categories),
              'mainCategoryCounts': dict(counts), 'categoryMapping': {c['key']: c['mainKey'] for c in categories},
              'uniqueSourceImageCount': len(unique_images), 'downloadedImageCount': len(image_map),
              'imageBytes': sum(i['bytes'] for i in image_map.values()), 'priceOnRequestCount': sum(p['price'] is None for p in products),
              'specificationCount': sum(bool(p['specs']) for p in products), 'failures': FAILURES, 'requests': REQUESTS,
              'coverageComplete': len(products) == len(discovered) and not any(f['stage'] in ('product','category') for f in FAILURES),
              'notes': ['Discovery combines all product sitemap URLs and product links from category pages/pagination.',
                        'WooCommerce Store API endpoint returned 404 during discovery; HTML and Yoast sitemaps were used.',
                        'Product prices come only from the main product-summary price element, never sidebar/related cards.',
                        'Generic model-family tables and old promotional price lists in long descriptions are not treated as current SKU prices/specifications.',
                        'The source Aroni category has a KRONI title; source category labels are preserved while product brand follows each SKU title.',
                        'Some products are absent from normal category lists but present in the product sitemap; all discovered SKUs are retained and assigned to a principal group from their SKU/category facts.',
                        'Manufacturer/source warranty information requires confirmation when the new store quotes a final order.',
                        'No supplier contact details, source tracking code, customer reviews or long marketing descriptions were imported.']}
    save('crawl-report.json', report)
    print(json.dumps({k:v for k,v in report.items() if k not in ('requests',)}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true', help='Refresh product/category HTML instead of resuming the captured snapshot')
    args = parser.parse_args()
    REFRESH = args.refresh
    run()
