export function Card({
  children,
  className = '',
  hover = false,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${hover ? 'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
