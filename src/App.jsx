function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold">Nexus</h1>

          <nav className="flex gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-900">
              Discover
            </a>
            <a href="#" className="hover:text-gray-900">
              Squads
            </a>
            <a href="#" className="hover:text-gray-900">
              Profile
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <section className="max-w-2xl">
          <p className="mb-3 text-sm font-medium text-gray-500">
            Opportunity Discovery
          </p>

          <h2 className="text-4xl font-semibold tracking-tight">
            Find opportunities that fit you.
          </h2>

          <p className="mt-4 text-gray-600">
            Discover practical learning opportunities based on your skills,
            interests, eligibility, schedule, and budget.
          </p>
        </section>
      </main>
    </div>
  )
}

export default App