import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateCompletionMonths, projectGrowth } from '../src/utils/compoundInterest';

test('projectGrowth adds contribution and interest each month', () => {
  const balances = projectGrowth(1000, 100, 12, 3);
  assert.equal(balances.length, 3);
  assert.ok(balances[0] > 1100);
  assert.ok(balances[1] > balances[0]);
  assert.ok(balances[2] > balances[1]);
});

test('estimateCompletionMonths reaches target for positive contributions', () => {
  const months = estimateCompletionMonths(0, 1200, 100, 0);
  assert.equal(months, 12);
});

test('estimateCompletionMonths returns Infinity when no growth path exists', () => {
  const months = estimateCompletionMonths(0, 5000, 0, 0);
  assert.equal(months, Infinity);
});

test('estimateCompletionMonths caps loop with very slow growth', () => {
  const months = estimateCompletionMonths(0, 1_000_000_000, 1, 0);
  assert.equal(months, 1200);
});
