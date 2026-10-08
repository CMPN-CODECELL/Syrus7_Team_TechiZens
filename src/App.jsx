const opportunities = [
  {
    title: "Sustainability Hackathon",
    type: "Hackathon",
    location: "Online",
    cost: "Free",
    deadline: "Oct 20, 2026",
    relevance: 94,
    eligibility: "Qualified",
    verified: true,
  },
  {
    title: "Beginner Web Development Workshop",
    type: "Workshop",
    location: "Online",
    cost: "Free",
    deadline: "Oct 24, 2026",
    relevance: 88,
    eligibility: "Qualified",
    verified: true,
  },
  {
    title: "Social Impact Innovation Challenge",
    type: "Competition",
    location: "Mumbai",
    cost: "Low Cost",
    deadline: "Oct 28, 2026",
    relevance: 81,
    eligibility: "Check eligibility",
    verified: false,
  },
]

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold">Nexus</h1>

          <nav className="flex gap-6 text-sm text-gray-600">
            <a href="#" className="text-gray-900">
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

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-8">
          <p className="mb-2 text-sm font-medium text-gray-500">
            Opportunity Discovery
          </p>

          <h2 className="text-3xl font-semibold tracking-tight">
            Find opportunities that fit you.
          </h2>

          <p className="mt-3 max-w-2xl text-gray-600">
            Discover practical learning opportunities based on your skills,
            interests, eligibility, schedule, and budget.
          </p>
        </section>

        <section className="mb-8 flex flex-wrap gap-3">
          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm">
            Beginner-Friendly
          </button>

          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm">
            Online
          </button>

          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm">
            Free / Low-Cost
          </button>

          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm">
            Sustainability & Social Impact
          </button>
        </section>

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opportunity) => (
            <article
              key={opportunity.title}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              {opportunity.verified ? (
                <div className="mb-4 text-xs font-medium text-gray-500">
                  ✓ Verified · Last verified recently
                </div>
              ) : (
                <div className="mb-4 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                  ⚠ Some source details need verification
                </div>
              )}

              <p className="text-sm text-gray-500">{opportunity.type}</p>

              <h3 className="mt-1 text-lg font-semibold">
                {opportunity.title}
              </h3>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>📍 {opportunity.location}</p>
                <p>💰 {opportunity.cost}</p>
                <p>Deadline: {opportunity.deadline}</p>
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-sm">
                  <span className="font-medium">Relevance:</span>{" "}
                  {opportunity.relevance}%
                </p>

                <p className="mt-2 text-sm">
                  <span className="font-medium">Eligibility:</span>{" "}
                  {opportunity.eligibility}
                </p>
              </div>

              <button className="mt-5 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
                View Opportunity
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}

export default App