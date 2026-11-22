import OptionsBoard from '@/components/OptionsBoard';

export default function OptionsPage({ params }: { params: { id: string } }) {
  return <OptionsBoard houseId={params.id} />;
}
