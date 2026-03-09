import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1F1915',
          borderRadius: 36,
          position: 'relative',
        }}
      >
        {/* Terracotta accent line top */}
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 40,
            right: 40,
            height: 1,
            backgroundColor: '#C96B2E',
            opacity: 0.45,
          }}
        />
        {/* Serif "f" */}
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 120,
            fontWeight: 400,
            fontStyle: 'italic',
            color: '#D4B896',
            lineHeight: 1,
            marginTop: -8,
          }}
        >
          f
        </div>
        {/* Terracotta accent line bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            left: 40,
            right: 40,
            height: 1,
            backgroundColor: '#C96B2E',
            opacity: 0.45,
          }}
        />
      </div>
    ),
    { ...size }
  )
}
