import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/team', label: 'Team' },
  { href: '/login', label: 'Login' },
  { href: '/admin', label: 'Admin', adminOnly: true },
];

export function Navbar() {
  return (
    <nav className="border-b border-red-600/30 bg-zinc-950/95 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold tracking-wide text-red-500">
          Dedan Marshalls
        </Link>
        <div className="flex gap-4 text-sm font-medium">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-red-400">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
