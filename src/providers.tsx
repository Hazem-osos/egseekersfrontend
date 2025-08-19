"use client";

import { ReactNode, useEffect, useState } from "react";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Temporary auth bypass for previewing pages
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      try {
        const demoToken = 'dev-token';
        const demoUser = { id: 'dev', email: 'demo@example.com', role: 'FREELANCER', name: 'Demo User' };
        const demoAdmin = { id: 'dev-admin', email: 'admin@example.com', role: 'ADMIN', firstName: 'Admin' };
        if (typeof window !== 'undefined') {
          if (!localStorage.getItem('token')) localStorage.setItem('token', demoToken);
          if (!localStorage.getItem('user')) localStorage.setItem('user', JSON.stringify(demoUser));
          if (!localStorage.getItem('adminUser')) localStorage.setItem('adminUser', JSON.stringify(demoAdmin));
        }
      } catch {}
    }
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}
