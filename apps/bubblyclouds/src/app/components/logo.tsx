'use client';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';

const Logo = () => {
  const { theme } = useTheme();
  return (
    <Link href="/">
      <Image
        className="relative"
        src={
          theme === 'dark' ? '/bubbly-clouds.png' : '/bubbly-clouds-invert.png'
        }
        alt="Bubbly Clouds Logo"
        width={350}
        height={70}
        priority
      />
    </Link>
  );
};

export { Logo };
