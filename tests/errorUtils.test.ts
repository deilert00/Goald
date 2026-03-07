import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getErrorMessage } from '../src/utils/errorUtils';

describe('getErrorMessage', () => {
  it('returns the error message when given an Error instance', () => {
    const err = new Error('something went wrong');
    assert.equal(getErrorMessage(err), 'something went wrong');
  });

  it('returns the fallback when given a non-Error value (string)', () => {
    assert.equal(getErrorMessage('raw string'), 'An unexpected error occurred.');
  });

  it('returns the fallback when given a non-Error value (object)', () => {
    assert.equal(getErrorMessage({ code: 42 }), 'An unexpected error occurred.');
  });

  it('returns the fallback when given null', () => {
    assert.equal(getErrorMessage(null), 'An unexpected error occurred.');
  });

  it('returns the fallback when given undefined', () => {
    assert.equal(getErrorMessage(undefined), 'An unexpected error occurred.');
  });

  it('uses the custom fallback when provided', () => {
    assert.equal(getErrorMessage('not an Error', 'custom fallback'), 'custom fallback');
  });
});
