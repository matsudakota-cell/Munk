import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Munks · A little trouble, together',description:'Two little monkeys. One very peaceful park. A cooperative mischief game for two players.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
