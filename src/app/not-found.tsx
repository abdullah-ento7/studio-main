
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-medium">404</h1>
        <div className="h-10 w-px bg-gray-600" />
        <p>This page could not be found.</p>
      </div>
      <Link href="/" className="mt-8 text-sm text-gray-400 hover:text-white transition-colors">
        Go back home
      </Link>
    </div>
  );
}
