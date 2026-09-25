import { ExploreScreen } from '@/components/ExploreScreen';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  return <ExploreScreen initialQuery={params.q?.slice(0, 120) ?? ''} />;
}
