interface Props {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      {/* Icon placeholder */}
      <div className="w-20 h-20 rounded-full bg-brand-navy/8 flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-brand-slate"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-brand-navy mb-3">{title}</h3>
      <p className="text-gray-500 max-w-md leading-relaxed mb-8">
        {description}
      </p>

      {action && <div>{action}</div>}
    </div>
  );
}
