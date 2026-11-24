import test from 'node:test';
import assert from 'node:assert/strict';
import { myopsReturnUrl } from '../lib/myops-return.ts';

test('preview returns to staging and production returns to MYOPS production', () => {
  assert.equal(myopsReturnUrl({VERCEL_ENV:'preview'}), 'https://southerndotcom-website-git-feat-myop-ca0019-mohd-syaiful-nizam1.vercel.app/');
  assert.equal(myopsReturnUrl({VERCEL_ENV:'production'}), 'https://www.myops.com.my/');
});
