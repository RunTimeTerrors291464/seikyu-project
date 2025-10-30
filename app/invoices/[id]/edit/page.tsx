export default function EditInvoicePage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit Invoice {params.id}</h1>
      <div className="h-64 rounded-lg border bg-white p-4 dark:bg-neutral-900">Form goes here…</div>
    </div>
  );
}
