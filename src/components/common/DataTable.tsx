import { ScrollArea, Table } from '@mantine/core';
import { useState } from 'react';
import cx from 'clsx';

interface DataTableProps<T> {
  data: T[];
  columns: { key: keyof T; header: string }[];
}

export default function DataTable<T>({ data, columns }: DataTableProps<T>) {
  const [scrolled, setScrolled] = useState(false);
  return (
    // <Table striped highlightOnHover>
    //   <thead>
    //     <tr>
    //       {columns.map((col) => (
    //         <th key={String(col.key)}>{col.header}</th>
    //       ))}
    //     </tr>
    //   </thead>
    //   <tbody>
    //     {data.map((row, i) => (
    //       <tr key={i}>
    //         {columns.map((col) => (
    //           <td key={String(col.key)}>{String(row[col.key])}</td>
    //         ))}
    //       </tr>
    //     ))}
    //   </tbody>
    // </Table>
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
          <tr key={i}>
            {columns.map((col) => (
              <td key={String(col.key)}>{String(row[col.key])}</td>
            ))}
          </tr>
        ))}</Table.Tbody>
      </Table>
    </ScrollArea>
    
  );
}
