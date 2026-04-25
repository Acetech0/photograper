'use client';
import { useRouter } from 'next/navigation';
import { Camera, LogOut } from 'lucide-react';

export default function CMSHeader() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="cms-header">
      <div className="cms-logo">
        <div className="cms-logo-dot" />
        Photographer CMS
      </div>
      <div className="cms-nav-actions">
        <button
          className="btn btn-ghost"
          onClick={handleLogout}
          style={{ gap: '6px' }}
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </header>
  );
}
