---
description: "Task list for Blog Website Recreation"
---

# Tasks: Blog Website Recreation

**Input**: Design documents from `/specs/005-blog-website-recreation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included as requested in the plan.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Turborepo monorepo**: `packages/blog/src/`, `apps/jamesacres/src/`

## Phase 1: Setup (New Package and App)

**Purpose**: Project initialization and basic structure for the new blog package and the jamesacres app.

- [ ] T001 Create `packages/blog/package.json` with dependencies
- [ ] T002 Create `packages/blog/tsconfig.json` extending root
- [ ] T003 [P] Add `@bubblyclouds-app/blog` path to root `tsconfig.json`
- [ ] T004 [P] Create package directory structure for `packages/blog/src/components`, `helpers`, `types`
- [ ] T005 [P] Create `apps/jamesacres/package.json` with dependencies
- [ ] T006 [P] Create `apps/jamesacres/tsconfig.json`
- [ ] T007 [P] Create `apps/jamesacres/next.config.mjs`
- [ ] T008 [P] Create `apps/jamesacres/postcss.config.js`
- [ ] T009 [P] Update root `turbo.json` for new app scripts
- [ ] T010 [P] Update root `package.json` for `dev:jamesacres` script
- [ ] T011 Copy `data/blog/` from `jamesacres-blog-nextjs` to `apps/jamesacres/data/blog/`
- [ ] T012 [P] Copy `data/authors/` from `jamesacres-blog-nextjs` to `apps/jamesacres/data/authors/`
- [ ] T013 [P] Copy `public/content/images/` to `apps/jamesacres/public/content/images/`
- [ ] T014 [P] Copy `public/static/images/` to `apps/jamesacres/public/static/images/`
- [ ] T015 [P] Create `apps/jamesacres/data/siteMetadata.ts` with types
- [ ] T016 [P] Create `apps/jamesacres/data/headerNavLinks.ts`
- [ ] T017 [P] Create `apps/jamesacres/data/projectsData.ts`

---

## Phase 2: Foundational (Package Types and Helpers)

**Purpose**: Core types and utilities that MUST be complete before ANY user story can be implemented.

- [ ] T018 Create `packages/blog/src/types/blogTypes.ts` with `BlogPost` and `ReadingTime` interfaces
- [ ] T019 [P] Create `packages/blog/src/types/authorTypes.ts` with `Author` interface
- [ ] T020 [P] Create `packages/blog/src/types/siteTypes.ts` with `SiteMetadata`, `NavLink`, `Project` interfaces
- [ ] T021 [P] Create `packages/blog/src/types/componentProps.ts` with component prop interfaces
- [ ] T022 [P] Create `packages/blog/src/helpers/dateUtils.ts` and `packages/blog/src/helpers/dateUtils.test.ts`
- [ ] T023 [P] Create `packages/blog/src/helpers/tagUtils.ts` and `packages/blog/src/helpers/tagUtils.test.ts`
- [ ] T024 Create `packages/blog/src/helpers/blogUtils.ts` and `packages/blog/src/helpers/blogUtils.test.ts`
- [ ] T025 Create `apps/jamesacres/src/lib/authors.ts` to load author data
- [ ] T026 Create `apps/jamesacres/src/lib/posts.ts` to load post data

---

## Phase 3: User Story 1 - View Homepage with Recent Posts (Priority: P1) 🎯 MVP

**Goal**: A visitor navigates to the blog homepage and sees a welcoming introduction with the author's avatar and a list of recently published blog posts.

**Independent Test**: Visit `http://localhost:3000` and verify the author info and 5 most recent posts are displayed with all metadata.

### Implementation for User Story 1

- [ ] T027 [US1] Create `packages/blog/src/components/Tag.tsx` and `packages/blog/src/components/Tag.test.tsx`
- [ ] T028 [P] [US1] Create `packages/blog/src/components/Card.tsx` and `packages/blog/src/components/Card.test.tsx`
- [ ] T029 [P] [US1] Create `packages/blog/src/components/PostList.tsx` and `packages/blog/src/components/PostList.test.tsx`
- [ ] T030 [US1] Create `apps/jamesacres/src/app/globals.css` with Tailwind styles
- [ ] T031 [US1] Create `apps/jamesacres/src/app/page.tsx` for the Homepage

---

## Phase 4: User Story 2 - Browse Blog Posts with Pagination (Priority: P1)

**Goal**: A visitor navigates to the blog listing page to browse all published posts. Posts are displayed in a paginated list with 5 posts per page.

**Independent Test**: Visit `/blog`, verify 5 posts display, and confirm pagination navigation works.

### Implementation for User Story 2

- [ ] T032 [P] [US2] Create `packages/blog/src/components/Pagination.tsx` and `packages/blog/src/components/Pagination.test.tsx`
- [ ] T033 [P] [US2] Create `packages/blog/src/components/TagList.tsx` and `packages/blog/src/components/TagList.test.tsx`
- [ ] T034 [US2] Create `apps/jamesacres/src/app/blog/page.tsx` for the blog listing
- [ ] T035 [US2] Create `apps/jamesacres/src/app/blog/page/[page]/page.tsx` for blog pagination

---

## Phase 5: User Story 3 - Read Individual Blog Post (Priority: P1)

**Goal**: A visitor clicks on a blog post title to read the full article.

**Independent Test**: Click a post from the listing and verify full content renders correctly.

### Implementation for User Story 3

- [ ] T036 [P] [US3] Create `packages/blog/src/components/MDXComponents.tsx`
- [ ] T037 [US3] Create `packages/blog/src/components/PostLayout.tsx` and `packages/blog/src/components/PostLayout.test.tsx`
- [ ] T038 [US3] Create `apps/jamesacres/src/app/[...slug]/page.tsx` for blog post pages

---

## Phase 6: User Story 4 - Browse Posts by Tag (Priority: P2)

**Goal**: A visitor can view all tags used across the blog and click on a tag to see only posts with that tag.

**Independent Test**: Visit `/tags`, click a tag, and confirm only matching posts are shown.

### Implementation for User Story 4

- [ ] T039 [US4] Create `apps/jamesacres/src/app/tags/page.tsx` for all tags
- [ ] T040 [US4] Create `apps/jamesacres/src/app/tags/[tag]/page.tsx` for posts by tag

---

## Phase 7: User Story 5 - View Projects Page (Priority: P2)

**Goal**: A visitor navigates to the projects page to see the author's portfolio of work.

**Independent Test**: Visit `/projects` and verify all projects display correctly.

### Implementation for User Story 5

- [ ] T041 [US5] Create `apps/jamesacres/src/app/projects/page.tsx`

---

## Phase 8: User Story 6 - View About Page (Priority: P2)

**Goal**: A visitor navigates to the about page to learn about the author.

**Independent Test**: Visit `/about` and verify author bio content and social links display.

### Implementation for User Story 6

- [ ] T042 [US6] Create `apps/jamesacres/src/app/about/page.tsx`

---

## Phase 9: User Story 7 - Toggle Dark/Light Theme (Priority: P3)

**Goal**: A visitor can toggle between dark and light color themes, and the site respects system preferences by default.

**Independent Test**: Click the theme toggle and verify colors change appropriately.

### Implementation for User Story 7

- [ ] T043 [US7] Create `apps/jamesacres/src/app/providers.tsx` for the `ThemeProvider`
- [ ] T044 [US7] Create `packages/blog/src/components/BlogHeader.tsx` and `packages/blog/src/components/BlogHeader.test.tsx` including the theme toggle
- [ ] T045 [P] [US7] Create `packages/blog/src/components/BlogFooter.tsx` and `packages/blog/src/components/BlogFooter.test.tsx`
- [ ] T046 [US7] Create `apps/jamesacres/src/app/layout.tsx` incorporating the header, footer, and providers

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, RSS feed, and verification.

- [ ] T047 Create `packages/blog/src/index.ts` with all necessary exports
- [ ] T048 [P] Create `packages/blog/README.md`
- [ ] T049 Create `apps/jamesacres/src/app/feed.xml/route.ts` for the RSS feed
- [ ] T050 Run `pnpm install` to link packages
- [ ] T051 Run `pnpm run dev:jamesacres` to verify dev server
- [ ] T052 Run `pnpm run build` to verify build
- [ ] T053 Run `pnpm run test` to verify tests pass
- [ ] T054 Run `pnpm run lint:fix` to fix lint issues
- [ ] T055 Run `pnpm run type-check` to verify types
- [ ] T056 Run `pnpm run circular` to verify no circular deps
- [ ] T057 Manual testing of all pages and features as per `quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup. Blocks all user stories.
- **User Stories (Phase 3-9)**: Depend on Foundational.
- **Polish (Phase 10)**: Depends on all user stories.

### Parallel Opportunities
- Tasks marked with `[P]` can be executed in parallel.
- Once the Foundational phase is complete, different user stories can be worked on in parallel.

## Implementation Strategy

### MVP First (User Story 1, 2, 3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3, 4, 5 (User Stories 1, 2, 3)
4. Validate the core blogging functionality.

### Incremental Delivery

1. Add User Stories 4, 5, 6.
2. Add User Story 7.
3. Complete the Polish phase.
