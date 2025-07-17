import { Table } from '@mantine/core';

interface DataTableProps<T> {
  data: T[];
  columns: { key: keyof T; header: string }[];
}

export default function DataTable<T>({ data, columns }: DataTableProps<T>) {
  return (
    <Table striped highlightOnHover>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={String(col.key)}>{String(row[col.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
