export function getVersion(): string {
  // Use Next.js public environment variable for client-side access
  return process.env.NEXT_PUBLIC_APP_VERSION || "v80";
}