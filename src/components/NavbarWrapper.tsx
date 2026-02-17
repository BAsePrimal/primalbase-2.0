'use client';

import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import { Suspense } from 'react';

function NavbarLogic() {
  const pathname = usePathname();
  
  // Não renderizar navbar na página de login
  if (pathname === '/login') {
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