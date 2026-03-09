/**
 * @param {'sm'|'md'|'lg'} size
 * @param {'teal'|'white'|'gray'} color
 */
export default function LoadingSpinner({ size = 'md', color = 'teal' }) {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  const colorClasses = {
    teal: 'border-[#6C63FF]',
    white: 'border-white',
    gray: 'border-gray-400',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-2 border-transparent
        ${colorClasses[color]} border-t-current animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}
