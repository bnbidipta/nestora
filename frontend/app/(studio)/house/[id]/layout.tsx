import { houseMeta } from '@/lib/shareMeta';

export const generateMetadata = ({ params }: { params: { id: string } }) => houseMeta(params.id);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
