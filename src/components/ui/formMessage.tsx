export function FormMessage({ error, notice }: { error?: string; notice?: string }) {
  if (error) {
    return (
      <p role="alert" className="whitespace-pre-line text-sm text-danger">
        {error}
      </p>
    );
  }
  if (notice) return <p className="text-sm text-muted">{notice}</p>;
  return null;
}
