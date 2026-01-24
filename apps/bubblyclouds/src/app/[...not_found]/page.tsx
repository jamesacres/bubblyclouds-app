import { notFound } from 'next/navigation';

const NotFoundCatchAll = () => notFound();

export const generateStaticParams = async () => {
  return [{ not_found: ['not_found'] }];
};

export default NotFoundCatchAll;
