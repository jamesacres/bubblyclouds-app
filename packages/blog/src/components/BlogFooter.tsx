import Link from 'next/link';
import { Mail, Github, Linkedin, Twitter } from 'lucide-react';
import { BlogFooterProps } from '../types/componentProps';

const BlogFooter = ({
  author,
  github,
  linkedin,
  email,
  siteUrl,
}: BlogFooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="mt-16 flex flex-col items-center">
        <div className="mb-3 flex space-x-4">
          {email && (
            <a
              className="text-sm text-gray-500 transition hover:text-gray-600"
              target="_blank"
              rel="noopener noreferrer"
              href={`mailto:${email}`}
            >
              <span className="sr-only">Email</span>
              <Mail size={24} />
            </a>
          )}
          {github && (
            <a
              className="text-sm text-gray-500 transition hover:text-gray-600"
              target="_blank"
              rel="noopener noreferrer"
              href={github}
            >
              <span className="sr-only">GitHub</span>
              <Github size={24} />
            </a>
          )}
          {linkedin && (
            <a
              className="text-sm text-gray-500 transition hover:text-gray-600"
              target="_blank"
              rel="noopener noreferrer"
              href={linkedin}
            >
              <span className="sr-only">LinkedIn</span>
              <Linkedin size={24} />
            </a>
          )}
        </div>
        <div className="mb-2 flex space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <div>{author}</div>
          <div>{` • `}</div>
          <div>{`© ${currentYear}`}</div>
          <div>{` • `}</div>
          <Link href="/">{siteUrl.replace('https://', '')}</Link>
        </div>
      </div>
    </footer>
  );
};

export default BlogFooter;
