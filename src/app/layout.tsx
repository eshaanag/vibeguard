import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "VibeGuard | Next-Gen Security Sentinel",
    description: "Futuristic zero-trust repo scanner for secrets and vulnerabilities",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.className} min-h-screen text-white selection:bg-neon-green/30`}>
                {children}
            </body>
        </html>
    );
}
