import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { products, categories, productsInCategory, normalizeSearch } from '../src/data/catalog';

test('all 61 discovered product pages are present with unique IDs and routes', () => {
  assert.equal(products.length, 61);
  assert.equal(new Set(products.map(product => product.id)).size, 61);
  assert.equal(new Set(products.map(product => product.slug)).size, 61);
  for (const product of products) {
    assert.ok(product.name.trim());
    assert.match(product.slug, /^[a-z0-9-]+$/);
    assert.ok(product.sourceUrl.startsWith('https://tana-daithanh.com/san-pham/'));
    assert.equal(product.sourceStatus, 'fetched');
  }
});

test('catalog retains seven categories and their complete source counts', () => {
  assert.equal(categories.length, 7);
  const expected = { 'may-nuoc-nong': 26, 'bon-inox': 14, 'bon-nhua': 4, 'bon-tu-hoai': 4, 'may-loc-nuoc': 6, 'chau-rua': 2, 'sen-voi': 5 };
  for (const [key, count] of Object.entries(expected)) assert.equal(productsInCategory(key).length, count, key);
});

test('all product images are local existing WebP assets', () => {
  const images = new Set<string>();
  for (const product of products) {
    assert.ok(product.images.length > 0, product.slug);
    for (const image of product.images) {
      assert.match(image.localPath, /^\/images\/catalog\/[a-f0-9]+\.webp$/);
      const absolute = path.join(process.cwd(), 'public', image.localPath);
      assert.ok(existsSync(absolute), image.localPath);
      const bytes = readFileSync(absolute);
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
      images.add(image.localPath);
    }
  }
  assert.equal(images.size, 32);
});

test('missing source prices stay null and no zero-priced offers are introduced', () => {
  assert.equal(products.filter(product => product.price === null).length, 5);
  assert.equal(products.filter(product => product.price !== null).length, 56);
  for (const product of products) if (product.price !== null) assert.ok(Number.isFinite(product.price) && product.price > 0);
});

test('Vietnamese search handles accents, model names and dung tich text', () => {
  assert.equal(normalizeSearch('Máy Nước Nóng ĐẠI THÀNH 130 Lít'), 'may nuoc nong dai thanh 130 lit');
  assert.ok(products.some(product => normalizeSearch(product.name).includes('300')));
});
