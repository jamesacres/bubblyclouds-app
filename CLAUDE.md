Architecture:

- See ARCHITECTURE.md for complete package hierarchy, dependency rules, and the
  Just-in-Time pattern
- Packages are organized in 7 layers (L0-L6): types → ui → auth → template →
  games → sudoku → app
- Each package can only depend on packages in lower layers
- When adding code, use the decision tree in ARCHITECTURE.md to choose the
  correct package

Rules:

- Do not add unnecessary comments
- Do not cast, we should fix the actual types or use generics
- Do not use any, use unknown if we don't know what it is, or fix the types
- Do not prefix type parameters with T (use `State` not `TState`, `Techniques`
  not `TTechniques`)
- Do not add index.ts files instead import directly
- Packages should add exports to package.json with the Just-in-Time package
  pattern.
- at the end of a task, always npm run build, npm run test and fix all issues.
- at the end of a task, don't forget to run npm run lint:fix to fix linting
  issues
- When moving and changing files, update the test files.
- Ensure md files are updated if they reference something which is no longer
  true.
- imports from within the same package should use relative imports.
- remember package.json should include all packages it depends on, including
  local packages.
- do not re-export anything for convenience, all imports should be from the
  source even after refactor
