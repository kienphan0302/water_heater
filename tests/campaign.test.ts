import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignForPage } from '../src/scripts/campaign';
test('campaign stays attached when the visitor browses a product before submitting',()=>{
  const landing=campaignForPage('?utm_source=google&utm_medium=cpc&utm_campaign=gia_dinh');
  const product=campaignForPage('',landing);
  assert.equal(product.utm_source,'google');assert.equal(product.utm_medium,'cpc');assert.equal(product.utm_campaign,'gia_dinh');
});
test('a new campaign replaces the previous source without mixing old campaign fields',()=>{
  const landing=campaignForPage('?utm_source=facebook',{utm_source:'google',utm_campaign:'old'});
  assert.equal(landing.utm_source,'facebook');assert.equal(landing.utm_campaign,'');
});
