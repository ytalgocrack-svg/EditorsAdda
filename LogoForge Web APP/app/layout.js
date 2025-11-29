import './globals.css'
import { ThemeProvider } from '@/context/ThemeContext'; // Import this

export const metadata = {
  title: 'LogoForge',
  description: 'Premium Design Assets',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-900 text-slate-100" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {/* Wrap children in ThemeProvider */}
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
