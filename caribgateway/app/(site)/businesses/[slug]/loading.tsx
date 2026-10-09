export default function BusinessDetailLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="relative h-[60vh] min-h-[400px] max-h-[600px] bg-gray-200 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-10 max-w-7xl mx-auto">
          <div className="h-6 w-24 bg-white/30 rounded-full mb-3" />
          <div className="h-12 w-96 max-w-full bg-white/30 rounded-xl mb-2" />
          <div className="h-5 w-40 bg-white/20 rounded-lg" />
        </div>
      </div>

      {/* Breadcrumb skeleton */}
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="h-4 w-80 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          {/* Rating + price row */}
          <div className="flex gap-4 mb-6">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-5 w-12 bg-gray-200 rounded" />
          </div>

          {/* Short description */}
          <div className="space-y-2 mb-10 max-w-3xl">
            <div className="h-7 w-full bg-gray-200 rounded" />
            <div className="h-7 w-4/5 bg-gray-200 rounded" />
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-10">
              <div>
                <div className="h-7 w-24 bg-gray-200 rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-100 rounded" />
                  <div className="h-4 w-full bg-gray-100 rounded" />
                  <div className="h-4 w-4/5 bg-gray-100 rounded" />
                  <div className="h-4 w-full bg-gray-100 rounded" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                </div>
              </div>

              <div>
                <div className="h-7 w-28 bg-gray-200 rounded mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-5 w-32 bg-gray-100 rounded" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
                <div className="space-y-3">
                  <div className="h-5 w-40 bg-gray-100 rounded" />
                  <div className="h-5 w-48 bg-gray-100 rounded" />
                  <div className="h-5 w-36 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-5 w-full bg-gray-100 rounded" />
                  <div className="h-5 w-3/4 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related businesses skeleton */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-gray-50 shadow-sm">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 w-1/2 bg-gray-100 rounded" />
                  <div className="h-4 w-full bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
