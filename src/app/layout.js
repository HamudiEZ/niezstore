import { Manrope } from "next/font/google";
import "./globals.css";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ThemeProvider from "../components/providers/theme-provider";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata = {
  title: "Niez Store | Ecommerce General",
  description:
    "Marketplace UI demo para tecnologia, hogar, moda y mas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${manrope.variable} font-sans flex min-h-screen flex-col antialiased`}
      >
        <ThemeProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-7 lg:px-10">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
