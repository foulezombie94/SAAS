import { unstable_cache } from 'next/cache';

try {
  const fn = unstable_cache(
    async (id: string) => id,
    ((id: string) => ['key', id]) as any,
    { revalidate: 60 }
  );
  console.log('SUCCESS: unstable_cache accepted a function for keyParts');
} catch (e) {
  console.log('FAILURE: unstable_cache rejected a function for keyParts');
  console.error(e);
}
