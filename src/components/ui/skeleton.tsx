// A grey placeholder block shown while content loads. Pulses unless the user
// prefers reduced motion.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`rounded-ui bg-line motion-safe:animate-pulse ${className}`.trim()} />;
}
