import { Author } from '../types/authorTypes';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const authorsDirectory = path.join(process.cwd(), 'data/authors');

export async function getAuthor(slug: string): Promise<Author | null> {
  try {
    const filePath = path.join(authorsDirectory, `${slug}.mdx`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      name: data.name || '',
      avatar: data.avatar || '',
      occupation: data.occupation || '',
      company: data.company || '',
      email: data.email || '',
      twitter: data.twitter || '',
      linkedin: data.linkedin || '',
      github: data.github || '',
      bio: content.trim(),
    };
  } catch (error) {
    console.error(`Error loading author ${slug}:`, error);
    return null;
  }
}
