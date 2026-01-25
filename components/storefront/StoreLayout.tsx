import React from 'react'
import { ResolvedTheme } from '@/lib/seller'

export default function StoreLayout({ children, theme }: { children: React.ReactNode, theme: ResolvedTheme }) {
  return (
    <div className={`store-theme-${theme.preset} min-h-screen`} style={{
      '--primary-color': theme.colors?.primary || '#f97316',
      '--font-family': theme.fonts?.main || 'Inter, sans-serif',
    } as React.CSSProperties}>
       {children}
    </div>
  )
}
