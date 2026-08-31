import { shrinkAnswerStack, shrinkAnswerStackLocal } from './shrinkAnswerStack';

describe('shrinkAnswerStack', () => {
  it('keeps only the last 3 items', () => {
    expect(shrinkAnswerStack([1, 2, 3, 4, 5])).toEqual([3, 4, 5]);
  });

  it('returns all items when there are 3 or fewer', () => {
    expect(shrinkAnswerStack([1, 2])).toEqual([1, 2]);
  });

  it('returns an empty array for an empty stack', () => {
    expect(shrinkAnswerStack([])).toEqual([]);
  });

  it('works with non-primitive elements', () => {
    const stack = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    expect(shrinkAnswerStack(stack)).toEqual([{ id: 2 }, { id: 3 }, { id: 4 }]);
  });
});

describe('shrinkAnswerStackLocal', () => {
  it('keeps only the last 2 items when completed is truthy', () => {
    expect(
      shrinkAnswerStackLocal([1, 2, 3, 4, 5], { at: 'x', seconds: 10 })
    ).toEqual([4, 5]);
  });

  it('keeps only the last 10 items when completed is falsy', () => {
    const stack = Array.from({ length: 15 }, (_, i) => i);
    expect(shrinkAnswerStackLocal(stack, undefined)).toEqual(stack.slice(-10));
  });

  it('keeps only the last 10 items when completed is omitted', () => {
    const stack = Array.from({ length: 15 }, (_, i) => i);
    expect(shrinkAnswerStackLocal(stack)).toEqual(stack.slice(-10));
  });

  it('returns all items when the stack is shorter than the limit and not completed', () => {
    expect(shrinkAnswerStackLocal([1, 2], undefined)).toEqual([1, 2]);
  });

  it('returns all items when the stack is shorter than the limit and completed', () => {
    expect(shrinkAnswerStackLocal([1], { at: 'x', seconds: 1 })).toEqual([1]);
  });
});
