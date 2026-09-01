export function isResumePrintRoute(pathname: string): boolean {
  return /^\/resumes\/[^/]+\/print(?:\/)?$/.test(pathname);
}
