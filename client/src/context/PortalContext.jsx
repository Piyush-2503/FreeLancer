import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { portalApi } from '../api/portal.js';

const PortalContext = createContext(null);

export function PortalProvider({ children }) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshClient = useCallback(async () => {
    try {
      const res = await portalApi.me();
      const clientData = res.data?.data?.client || res.data?.client;
      setClient(clientData);
      return clientData;
    } catch {
      localStorage.removeItem('fh_portal_token');
      setClient(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch portal client when visiting /portal routes
    if (window.location.pathname.startsWith('/portal')) {
      refreshClient();
    } else {
      setLoading(false);
    }
  }, [refreshClient]);

  return (
    <PortalContext.Provider value={{ client, setClient, loading, refreshClient }}>
      {children}
    </PortalContext.Provider>
  );
}

export const usePortal = () => useContext(PortalContext);
