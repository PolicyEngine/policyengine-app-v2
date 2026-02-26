import { Box, Table } from '@mantine/core';

interface DataTableProps<T> {
  data: T[];
  columns: { key: keyof T; header: string }[];
}

export default function DataTable<T>({ data, columns }: DataTableProps<T>) {
  return (
    <Box style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
            <Table.Tr key={i} ta="center">
              {columns.map((col) => (
                <td key={String(col.key)}>{String(row[col.key])}</td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );
}
