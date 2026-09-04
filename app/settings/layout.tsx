import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  if (!user) redirect('/');
  if (user.role !== 'manager') redirect('/');

  return children;
}
