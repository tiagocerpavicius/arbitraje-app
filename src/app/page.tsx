'use client';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/hooks/useStore';
import ResumenTab from '@/components/ResumenTab';
import CaucionesTab from '@/components/CaucionesTab';
import CedearsTab from '@/components/CedearsTab';
import LoginForm from '@/components/LoginForm';

type Tab = 'resumen' | 'cauciones' | 'cedears';
const TABS: { id: Tab; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'cauciones', label: 'Cauciones' },
  { id: 'cedears', label: 'CEDEARs' },
];

const Loader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'DM Mono, monospace', fontSize: '12px', letterSpacing: '0.12em' }}>
    CARGANDO...
  </div>
);

function AppContent({ userId, userEmail, signOut }: { userId: string; userEmail: string; signOut: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('resumen');
  const store = useStore(userId);

  if (!store.hydrated) return <Loader />;

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(7,7,15,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '16px', color: 'var(--text)', letterSpacing: '0.04em' }}>
              ARB<span style={{ color: 'var(--violet)' }}>/</span>TC
            </div>
            <div style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace', color: 'var(--muted)', letterSpacing: '0.08em' }}>
              CAUCIONES · CEDEARs · USD MEP
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted2)', fontFamily: 'DM Mono, monospace', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail}
            </span>
            <button onClick={signOut} title="Cerrar sesión"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px', display: 'flex', alignItems: 'center' }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--red)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted)')}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', borderTop: '1px solid var(--border)' }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: active ? '2px solid var(--violet)' : '2px solid transparent', color: active ? 'var(--text)' : 'var(--muted2)', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'color 0.15s', marginBottom: '-1px' }}>
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 20px' }}>
        {activeTab === 'resumen' && (
          <ResumenTab cauciones={store.cauciones} cedears={store.cedears} />
        )}
        {activeTab === 'cauciones' && (
          <CaucionesTab
            cauciones={store.cauciones}
            addCaucion={store.addCaucion}
            renovarCaucion={store.renovarCaucion}
            deleteCaucion={store.deleteCaucion}
          />
        )}
        {activeTab === 'cedears' && (
          <CedearsTab
            cedears={store.cedears}
            addCedear={store.addCedear}
            updateCedear={store.updateCedear}
            deleteCedear={store.deleteCedear}
          />
        )}
      </main>
    </div>
  );
}

export default function Home() {
  const { user, loading, signOut } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <LoginForm />;
  return <AppContent userId={user.id} userEmail={user.email ?? ''} signOut={signOut} />;
}
