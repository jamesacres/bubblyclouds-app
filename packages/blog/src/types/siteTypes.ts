export interface SiteMetadata {
  title: string;
  author: string;
  headerTitle?: string;
  description: string;
  language: string; // e.g., "en-gb"
  theme: 'system' | 'dark' | 'light';
  siteUrl: string;
  siteLogo?: string;
  github?: string;
  linkedin?: string;
  locale: string; // e.g., "en-GB"
}

export interface NavLink {
  href: string;
  title: string;
}

export interface Project {
  title: string;
  description: string;
  imgSrc?: string; // Project image path
  href?: string; // External link to project
}
