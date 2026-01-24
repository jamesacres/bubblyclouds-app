'use client';
import dynamic from 'next/dynamic';

const LogoWrapper = dynamic(() => import('./Logo'), { ssr: false });

export { LogoWrapper };
