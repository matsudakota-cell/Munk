import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Munks · Monkey Island',description:'A 3D island adventure for two monkeys: treetop bells, a jungle band, coconut bowling, sky hoops, and a bubble fountain.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
