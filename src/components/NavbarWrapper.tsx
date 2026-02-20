'use client';

import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import { Suspense } from 'react';

function NavbarLogic() {
  const pathname = usePathname();
  
  // Não renderizar navbar na página de login e nem no funil do Quiz
  if (pathname === '/login' || pathname === '/quiz') {
    return null;
  }
  
  return <BottomNav />;
}

export default function NavbarWrapper() {
  return (
    <Suspense fallback={null}>
      <NavbarLogic />
    </Suspense>
  );
}