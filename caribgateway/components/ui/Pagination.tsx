import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  hrefFor: (page: number) => string;
};

/** Numbered pager for listing pages. Shows up to seven page numbers. */
export default function Pagination({ currentPage, totalPages, hrefFor }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      {currentPage > 1 && <PageLink href={hrefFor(currentPage - 1)} label="← Previous" />}
      {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
        const page = i + 1;
        return (
          <PageLink
            key={page}
            href={hrefFor(page)}
            label={String(page)}
            active={page === currentPage}
          />
        );
      })}
      {currentPage < totalPages && <PageLink href={hrefFor(currentPage + 1)} label="Next →" />}
    </div>
  );
}

function PageLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-brand-navy text-white"
          : "bg-white text-gray-600 border border-gray-200 hover:border-brand-navy hover:text-brand-navy"
      }`}
    >
      {label}
    </Link>
  );
}
