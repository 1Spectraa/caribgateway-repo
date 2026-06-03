export default function DestinationDetailLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="relative h-[70vh] min-h-[440px] max-h-[640px] bg-gray-200 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 px-4">
          <div className="h-6 w-20 bg-white/30 rounded-full mb-4" />
          <div className="h-14 w-80 max-w-full bg-white/30 rounded-xl mb-3" />
          <div className="h-5 w-36 bg-white/20 rounded-lg" />
        </div>
      </div>

      {/* Breadcrumb skeleton */}
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Description skeleton */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="max-w-3xl space-y-3">
            <div className="h-7 w-4/5 bg-gray-200 rounded" />
            <div className="h-7 w-2/3 bg-gray-200 rounded" />
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </section>

      {/* Business cards skeleton */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <div className="h-8 w-72 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
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
      </section>
    </>
  );
}
