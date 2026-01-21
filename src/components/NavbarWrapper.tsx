'use client';

import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';

export default function NavbarWrapper() {
  const pathname = usePathname();
  
  // Não renderizar navbar na página de login
  if (pathname === '/login') {
    return null;
  }
  
  return <BottomNav />;
}
