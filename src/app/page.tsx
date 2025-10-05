export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Linear Clone
        </h1>
        <p className="text-gray-600 mb-8">
          Modern project management tool built with Next.js, Prisma, and SQLite
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
}
