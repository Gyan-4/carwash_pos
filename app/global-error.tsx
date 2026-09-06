'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#f8fafc', color: '#0f172a' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <section style={{ width: '100%', maxWidth: 460, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 28, textAlign: 'center', boxSizing: 'border-box' }}>
            <div style={{ margin: '0 auto', width: 48, height: 48, borderRadius: 999, background: '#fff1f2', color: '#e11d48', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 22 }}>!</div>
            <div style={{ marginTop: 16, fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#e11d48' }}>Carwash POS</div>
            <h1 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 900 }}>The application needs to restart</h1>
            <p style={{ margin: '10px 0 0', color: '#64748b', lineHeight: 1.6, fontSize: 14 }}>
              An unexpected application error occurred. Reload the POS and continue your work.
            </p>
            <button onClick={() => reset()} style={{ marginTop: 20, border: 0, borderRadius: 12, padding: '11px 18px', background: '#2563eb', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>
              Reload POS
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
