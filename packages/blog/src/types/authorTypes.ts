export interface Author {
  // Identity
  slug: string; // Filename without extension (e.g., "default")

  // Frontmatter
  name: string;
  avatar?: string; // Path to avatar image
  occupation?: string;
  company?: string;
  email?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  layout?: string;

  // Content
  bio?: string; // MDX content (rendered for about page)
}
