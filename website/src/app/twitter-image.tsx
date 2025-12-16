import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = "Archevi - Your family's AI-powered knowledge vault";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation (same as OG image for consistency)
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Logo/Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '24px',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: 'white' }}
            >
              <path
                d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            style={{
              fontSize: '56px',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-1px',
            }}
          >
            Archevi
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '36px',
            color: '#e2e8f0',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          Your family&apos;s AI-powered knowledge vault
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            marginTop: '48px',
            gap: '48px',
          }}
        >
          {['Natural Language Search', 'AI Document Extraction', 'Privacy First'].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#94a3b8',
                  fontSize: '20px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    marginRight: '12px',
                  }}
                />
                {feature}
              </div>
            )
          )}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            color: '#64748b',
            fontSize: '24px',
          }}
        >
          archevi.ca
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
