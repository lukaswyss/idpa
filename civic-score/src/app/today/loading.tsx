export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full" aria-label="Laden" />
      </div>
    </main>
  );
}


