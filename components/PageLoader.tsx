export function PageLoader({ label = "Turning it up" }: { label?: string }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-disc" aria-hidden="true">
        <span>n</span>
      </div>
      <div className="page-loader-eq" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className="page-loader-label">{label}</p>
    </div>
  );
}
