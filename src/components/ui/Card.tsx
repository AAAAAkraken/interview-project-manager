export function Card({
  children,
  className = '',
  onClick,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${hover ? 'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
