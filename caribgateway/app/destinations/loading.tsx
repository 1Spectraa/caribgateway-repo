export default function DestinationsLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <section className="relative bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-teal-dark pt-32 pb-20 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 w-32 bg-white/20 rounded-full mx-auto mb-4" />
            <div className="h-12 w-96 max-w-full bg-white/20 rounded-xl mx-auto mb-4" />
            <div className="h-6 w-2/3 bg-white/10 rounded-lg mx-auto mb-2" />
            <div className="h-6 w-1/2 bg-white/10 rounded-lg mx-auto" />
          </div>
        </div>
      </section>

      {/* Cards skeleton */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-4 w-36 bg-gray-200 rounded mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="h-52 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 w-3/4 bg-gray-200 rounded" />
                    <div className="h-4 w-1/2 bg-gray-100 rounded" />
                    <div className="h-4 w-full bg-gray-100 rounded" />
                    <div className="h-4 w-5/6 bg-gray-100 rounded" />
                    <div className="h-4 w-20 bg-gray-100 rounded mt-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
