import Link from 'next/link';
import { Github, Linkedin } from 'lucide-react';
import { BlogFooterProps } from '../types/componentProps';

const BlogFooter = ({ author, github, linkedin }: BlogFooterProps) => {
  return (
    <footer>
      <div className="mt-16 flex flex-col items-center">
        <div className="mb-3 flex space-x-4">
          {github && (
            <a
              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition"
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
              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition"
              target="_blank"
              rel="noopener noreferrer"
              href={linkedin}
            >
              <span className="sr-only">LinkedIn</span>
              <Linkedin size={24} />
            </a>
          )}
        </div>
        <div className="flex flex-col items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div>
            © 2025 {author}
            <Link
              href="https://github.com/timlrx/tailwind-nextjs-starter-blog"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 ml-1"
            >
              Tailwind Nextjs Theme
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default BlogFooter;
