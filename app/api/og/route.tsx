import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const score = searchParams.get('score') || '0';
  const title = searchParams.get('title') || 'Unknown';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          backgroundImage: 'radial-gradient(circle at 25px 25px, #222 2%, transparent 0%), radial-gradient(circle at 75px 75px, #222 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, padding: 60 }}>
          <div style={{ fontSize: 120, fontWeight: 900, color: '#fff', textAlign: 'center' }}>
            {score}/100
          </div>
          <div style={{ fontSize: 64, color: '#ff0080', textAlign: 'center', fontWeight: 700, maxWidth: 800 }}>
            {title}
          </div>
          <div style={{ fontSize: 32, color: '#666', marginTop: 60, letterSpacing: 4 }}>
            CAPORNAH
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}