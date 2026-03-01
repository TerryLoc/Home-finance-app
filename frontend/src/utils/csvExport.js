export function exportTransactionsCsv(
  transactions,
  filename = 'transactions-report.csv',
) {
  const headers = [
    'id',
    'date',
    'amount',
    'description',
    'category',
    'bucket',
    'type',
  ];

  const rows = transactions.map((transaction) =>
    headers
      .map((header) => {
        const value = transaction[header] ?? '';
        const escaped = String(value).replaceAll('"', '""');
        return `"${escaped}"`;
      })
      .join(','),
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
