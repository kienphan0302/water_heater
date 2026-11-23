import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = async name => JSON.parse(await readFile(path.join(root, 'ingestion', name), 'utf8'));
const catalog = await read('catalog.json');
const categories = await read('categories.json');
const products = (Array.isArray(catalog) ? catalog : catalog.products).map(product => {
  const name = product.name.replace(/\s*\(\s*tặng[^)]*\)/giu, '').trim();
  const images = product.images.map(image => ({ ...image, alt: image.alt.replace(/\s*\(\s*tặng[^)]*\)/giu, '').trim() }));
  return { ...product, ...(name !== product.name ? { sourceName: product.name } : {}), name, images };
});
const write = (name, value) => writeFile(path.join(root, 'src', 'data', name), `${JSON.stringify(value, null, 2)}\n`);
await write('products.json', products);
await write('categories.json', categories.mainCategories);
await write('source-categories.json', categories.sourceCategories);
await write('catalog-meta.json', { source: catalog.source || 'https://tana-daithanh.com/', capturedAt: catalog.capturedAt || categories.capturedAt, productCount: products.length, mainCategoryCount: categories.mainCategories.length });
console.log(`Synced ${products.length} products and ${categories.mainCategories.length} main categories.`);
