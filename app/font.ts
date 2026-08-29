// app/fonts.ts
import { ADLaM_Display } from 'next/font/google'

export const adlam = ADLaM_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-adlam',
  display: 'swap',
})
