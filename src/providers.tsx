"use client";

import { ReactNode, useEffect, useState } from "react";
import axios from "axios";
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

      // Intercept axios errors globally to avoid login redirects in preview
      const respId = axios.interceptors.response.use(
        (response) => response,
        (error) => {
          const url = error?.config?.url as string | undefined;
          // Fake /auth/me for role checks
          if (url && url.includes('/auth/me')) {
            return Promise.resolve({
              data: { id: 'dev', email: 'demo@example.com', role: 'FREELANCER', firstName: 'Demo', lastName: 'User' },
              status: 200,
              statusText: 'OK',
              headers: {},
              config: error.config,
            } as any);
          }
          // Swallow 401s elsewhere
          if (error?.response?.status === 401) {
            return Promise.resolve({
              data: null,
              status: 200,
              statusText: 'OK',
              headers: {},
              config: error.config,
            } as any);
          }
          return Promise.reject(error);
        }
      );

      // Cleanup on unmount
      return () => {
        axios.interceptors.response.eject(respId);
      };
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
