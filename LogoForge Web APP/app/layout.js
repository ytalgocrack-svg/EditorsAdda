import './globals.css'

export const metadata = {
  title: 'LogoForge - Free Assets',
  description: 'Download PLP, XML and PNG logos',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen text-gray-900">{children}</body>
    </html>
  )
}