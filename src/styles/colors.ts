export const colors = {
  primary: '#4A90D9',
  secondary: '#9B8EC4',
  success: '#4CAF82',
  warning: '#E8A838',
  error: '#E8614A',
  info: '#7BAFC4',
  accent: '#F2D06B',
  neutral: '#F8F8F8',
  dark: '#1E293B',
  darkDeep: '#0F172A',
  darkMid: '#334466',
  studentTeal: '#5BB8C1',
  textPrimary: '#111111',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#E8E8E8',
} as const

export type ColorToken = keyof typeof colors
