import { Manrope } from "next/font/google";
import "./globals.css";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

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
    <html lang="es">
      <body className={`${manrope.variable} flex min-h-screen flex-col antialiased`}>
        <Navbar />
        <main className="w-full flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
