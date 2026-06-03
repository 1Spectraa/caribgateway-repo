export default function BusinessesLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <section className="relative bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-navy pt-32 pb-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 w-28 bg-white/20 rounded-full mx-auto mb-4" />
            <div className="h-12 w-80 max-w-full bg-white/20 rounded-xl mx-auto mb-4" />
            <div className="h-6 w-2/3 bg-white/10 rounded-lg mx-auto mb-2" />
            <div className="h-6 w-1/2 bg-white/10 rounded-lg mx-auto" />
          </div>
        </div>
      </section>

      {/* Filters skeleton */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-8 animate-pulse">
            <div className="h-11 w-full bg-gray-200 rounded-xl mb-4" />
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 w-24 bg-gray-200 rounded-full" />
              ))}
              <div className="ml-auto flex gap-3">
                <div className="h-10 w-40 bg-gray-200 rounded-xl" />
                <div className="h-10 w-36 bg-gray-200 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Cards skeleton */}
          <div className="animate-pulse">
            <div className="h-4 w-32 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 w-3/4 bg-gray-200 rounded" />
                    <div className="h-4 w-1/2 bg-gray-100 rounded" />
                    <div className="h-4 w-full bg-gray-100 rounded" />
                    <div className="h-4 w-5/6 bg-gray-100 rounded" />
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
