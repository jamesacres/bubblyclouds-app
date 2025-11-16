Rules:

- Do not add unnecessary comments
- Do not add index.ts files instead import directly
- Packages should add exports to package.json with the Just-in-Time package
  pattern.
- After run build, test and fix any issues.
- at the end of a task, don't forget to run npm run lint:fix to fix linting
  issues
- When moving and changing files, update the test files.
- Ensure md files are updated if they reference something which is no longer
  true.
- imports from within the same package should use relative imports.
- remember package.json should include all packages it
 depends on, including local packages.
