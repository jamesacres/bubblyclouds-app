import { FunctionComponent, memo } from 'react';

// memo() erases a component's generic type parameters, collapsing them to
// the type of one particular call. This re-asserts the original generic
// signature so callers keep their own type parameter per call site, without
// scattering `as typeof Component` casts across the codebase.
export function genericMemo<Component extends FunctionComponent<never>>(
  component: Component
): Component {
  return memo(component) as unknown as Component;
}
