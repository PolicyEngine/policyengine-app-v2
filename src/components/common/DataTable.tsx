import { ScrollArea, Table } from '@mantine/core';
import { useState } from 'react';

interface DataTableProps<T> {
  data: T[];
  columns: { key: keyof T; header: string }[];
}

export default function DataTable<T>({ data, columns }: DataTableProps<T>) {
  const [scrolled, setScrolled] = useState(false);
  return (
    <ScrollArea h={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
      <Table miw={700}>
        <Table.Thead>
          <Table.Tr>
            {columns.map((col) => (
            <th key={String(col.key)}>{col.header}</th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((row, i) => (
          // <tr key={i}>
          <Table.Tr key={i} ta="center">
            {columns.map((col) => (
              <td key={String(col.key)}>{String(row[col.key])}</td>
            ))}
          </Table.Tr>

          // </tr>
        ))}</Table.Tbody>
      </Table>
    </ScrollArea>
    
  );
}
