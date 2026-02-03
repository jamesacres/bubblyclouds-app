# Feature Specification: Personal Blog Website Recreation

**Feature Branch**: `005-blog-website-recreation`
**Created**: 2026-01-25
**Status**: Draft
**Input**: User description: "Recreate jamesacres.co.uk blog website using bubblyclouds-app monorepo structure, web-only without auth, keeping markdown files exactly the same, minimal dependencies"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Homepage with Recent Posts (Priority: P1)

A visitor navigates to the blog homepage and sees a welcoming introduction with the author's avatar and a list of recently published blog posts. Each post preview shows the title, publication date, reading time, summary, featured image, and tags.

**Why this priority**: The homepage is the primary entry point and must establish the site's identity while surfacing the most relevant content to visitors.

**Independent Test**: Can be fully tested by visiting the homepage URL and verifying the author info and 5 most recent posts are displayed with all metadata.

**Acceptance Scenarios**:

1. **Given** a visitor loads the homepage, **When** the page renders, **Then** they see the author's avatar, name, and tagline
2. **Given** a visitor loads the homepage, **When** the page renders, **Then** they see up to 5 recent blog posts with title, date, reading time, summary, image (if available), and tags
3. **Given** blog posts exist with different dates, **When** the homepage renders, **Then** posts are sorted by date descending (newest first)

---

### User Story 2 - Browse Blog Posts with Pagination (Priority: P1)

A visitor navigates to the blog listing page to browse all published posts. Posts are displayed in a paginated list with 5 posts per page. Navigation allows moving between pages. A sidebar shows all tags with post counts.

**Why this priority**: Core content browsing is essential for a blog - visitors must be able to discover and read all content.

**Independent Test**: Can be fully tested by visiting /blog, verifying 5 posts display, and confirming pagination navigation works to reach older posts.

**Acceptance Scenarios**:

1. **Given** a visitor is on the blog listing page, **When** the page renders, **Then** they see up to 5 posts per page with title, date, reading time, summary, image, and tags
2. **Given** more than 5 posts exist, **When** a visitor views the blog page, **Then** pagination controls show current page number and total (e.g., "1 of 4") with Previous/Next links
3. **Given** a visitor is on page 2, **When** they click "Previous", **Then** they navigate to page 1
4. **Given** draft posts exist, **When** the blog listing renders, **Then** draft posts are not displayed
5. **Given** a visitor is on the blog page, **When** viewing the sidebar, **Then** they see all tags with post counts

---

### User Story 3 - Read Individual Blog Post (Priority: P1)

A visitor clicks on a blog post title to read the full article. The post page displays the full content rendered from markdown/MDX, including images, code blocks, and any embedded content. Navigation to previous article is available.

**Why this priority**: Reading blog posts is the core purpose of the site - without this, the blog has no value.

**Independent Test**: Can be fully tested by clicking a post from the listing and verifying full content renders correctly with all formatting preserved.

**Acceptance Scenarios**:

1. **Given** a visitor clicks a post title, **When** the post page loads, **Then** they see the full post title, formatted publication date (e.g., "Sunday 4 May 2025"), author name with avatar, and reading time
2. **Given** a post contains markdown formatting, **When** rendered, **Then** headers, lists, links, bold/italic text render correctly
3. **Given** a post contains images, **When** rendered, **Then** images display with captions (figcaption)
4. **Given** a post contains code blocks, **When** rendered, **Then** code displays with syntax highlighting
5. **Given** a post has tags, **When** rendered, **Then** clickable tag links are displayed at the bottom
6. **Given** a previous post exists, **When** viewing a post, **Then** a "Previous Article" link is shown
7. **Given** a visitor is reading a post, **When** viewing the footer, **Then** a "Back to homepage" link is available

---

### User Story 4 - Browse Posts by Tag (Priority: P2)

A visitor can view all tags used across the blog and click on a tag to see only posts with that tag.

**Why this priority**: Tag-based navigation allows visitors to find related content on topics of interest, improving content discovery.

**Independent Test**: Can be fully tested by visiting /tags, verifying tags display with counts, clicking a tag, and confirming only matching posts are shown.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to /tags, **When** the page renders, **Then** all unique tags are displayed horizontally with post counts (e.g., "retrospect (7)")
2. **Given** a visitor clicks a tag, **When** the tag page loads, **Then** only posts with that tag are displayed
3. **Given** a visitor is on a tag page, **When** viewing the sidebar, **Then** they see an "All Posts" link to return to the full blog

---

### User Story 5 - View Projects Page (Priority: P2)

A visitor navigates to the projects page to see the author's portfolio of work. Each project shows a title, description, image, and link in a card grid layout.

**Why this priority**: Projects showcase the author's work and complement the blog content but are not the primary content type.

**Independent Test**: Can be fully tested by visiting /projects and verifying all projects display with images, descriptions, and working links.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to /projects, **When** the page renders, **Then** projects display in a responsive card grid (2 columns on desktop, 1 on mobile)
2. **Given** a project has an image, **When** rendered, **Then** the project card shows the image at the top
3. **Given** a project has an external link, **When** rendered, **Then** a clickable "Visit ->" link is displayed

---

### User Story 6 - View About Page (Priority: P2)

A visitor navigates to the about page to learn about the author. The page displays the author's bio, avatar, job title, and social links in a multi-column layout.

**Why this priority**: The about page provides author context but is not essential for content consumption.

**Independent Test**: Can be fully tested by visiting /about and verifying author bio content, avatar, and social links display.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to /about, **When** the page renders, **Then** the author's avatar, name, and occupation are displayed in the left column
2. **Given** an author has social links, **When** the about page renders, **Then** GitHub and LinkedIn icons/links are displayed
3. **Given** a visitor views the about page, **When** rendered, **Then** a multi-paragraph biography is displayed in the right column(s)

---

### User Story 7 - Toggle Dark/Light Theme (Priority: P3)

A visitor can toggle between dark and light color themes, and the site respects system preferences by default.

**Why this priority**: Theme support improves user experience but is not essential for content delivery.

**Independent Test**: Can be fully tested by clicking the theme toggle and verifying colors change appropriately.

**Acceptance Scenarios**:

1. **Given** a visitor's system is in dark mode, **When** they first load the site, **Then** dark theme is applied
2. **Given** a visitor clicks the theme toggle, **When** the toggle completes, **Then** the theme switches and persists across pages

---

### Edge Cases

- What happens when a blog post date format is invalid in frontmatter? Display with default/unknown date and log warning.
- What happens when a referenced image is missing? Display gracefully with alt text placeholder.
- What happens when the author file referenced in a post doesn't exist? Fall back to default author or display "Unknown".
- How does the system handle posts without a summary? Generate excerpt from first paragraph of content.
- What happens when pagination is requested beyond available pages? Redirect to last valid page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST parse and render MDX/Markdown blog posts preserving all frontmatter fields (title, date, lastmod, tags, draft, summary, authors, images, layout)
- **FR-002**: System MUST support root-level date-based URL structure for posts: `/YYYY/MM/slug` or `/YYYY/MM/DD/slug` (NOT under /blog)
- **FR-003**: System MUST render blog posts with GFM (GitHub Flavored Markdown) support
- **FR-004**: System MUST calculate and display estimated reading time for posts
- **FR-005**: System MUST support code syntax highlighting in markdown code blocks
- **FR-006**: System MUST support image captions via figcaption elements in MDX
- **FR-007**: System MUST filter out draft posts from public listings and navigation
- **FR-008**: System MUST support responsive design for mobile, tablet, and desktop viewports
- **FR-009**: System MUST serve static images from a /content/images/ path structure
- **FR-010**: System MUST provide site navigation with Home, Blog, Tags, Projects, and About links
- **FR-011**: System MUST provide RSS feed for blog posts
- **FR-012**: System MUST use ThemeSwitch from @bubblyclouds-app/ui for dark/light mode toggle
- **FR-013**: System MUST NOT require user authentication for any content
- **FR-014**: System MUST preserve exact markdown file format/structure from existing blog (no migrations)
- **FR-015**: System MUST display "Previous Article" navigation on individual post pages
- **FR-016**: System MUST display author avatar and name on individual post pages

### Package Scope *(monorepo)*

- **Affected Packages**:
  - `@bubblyclouds-app/ui` - May reuse existing UI components (Footer, ThemeProvider, etc.)
  - `@bubblyclouds-app/types` - May add shared types if needed

- **New Packages**:
  - `@bubblyclouds-app/blog` (L1) - Blog-specific components, utilities, and types

- **New Apps**:
  - `apps/blog` - Next.js blog application (L6)

- **Dependency Compliance**:
  - Blog app depends on: `@bubblyclouds-app/blog`, `@bubblyclouds-app/ui`, `@bubblyclouds-app/types`
  - No auth dependency (explicitly excluded)
  - Follows unidirectional dependency rule

- **Import Strategy**: Relative imports within packages, absolute package imports across packages, no barrel exports per CLAUDE.md

### Key Entities

- **BlogPost**: Represents a blog article with title, content, date, lastmod, tags, draft status, summary, author reference, and images
- **Author**: Represents a content author with name, avatar, occupation, company, email, and social links (github, linkedin, twitter)
- **Project**: Represents a portfolio project with title, description, images array, and href link
- **Tag**: A content categorization label with associated post count
- **SiteMetadata**: Global site configuration including title, author, description, siteUrl, social links

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 17 existing blog posts render correctly with identical content and formatting to the current site
- **SC-002**: Page load time for homepage is under 3 seconds on standard broadband
- **SC-003**: All existing blog URLs (/YYYY/MM/slug and /YYYY/MM/DD/slug) work correctly
- **SC-004**: Site passes Lighthouse accessibility score of 90+ on all pages
- **SC-005**: Site is fully navigable using keyboard only
- **SC-006**: All 5 existing projects display correctly on the projects page
- **SC-007**: Dark/light theme toggle works and persists user preference
- **SC-008**: RSS feed validates and includes all non-draft posts
- **SC-009**: Build completes successfully with `pnpm run build`
- **SC-010**: All tests pass with `pnpm run test`
- **SC-011**: No linting errors with `pnpm run lint:fix`

## Assumptions

- The existing markdown files in `/data/blog/` will be copied to the new app without modification
- The existing images in `/public/content/images/` will be copied to the new app
- The existing data files (siteMetadata.js, projectsData.ts, headerNavLinks.ts, authors/) will be adapted to TypeScript if needed
- MDX rendering will use a minimal set of remark/rehype plugins to keep dependencies low
- No comments system, newsletter subscription, or search functionality is required (these are commented out in current config)
- No analytics integration is required initially
