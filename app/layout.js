import "./globals.css"; // ✅ Import Tailwind here only

export const metadata = {
  title: "Electricity Rate Comparison",
  description: "Compare electricity tariffs with modern UI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
