import {
  ShadcnTable as Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';

interface DataTableProps<T> {
  data: T[];
  columns: { key: keyof T; header: string }[];
}

export default function DataTable<T>({ data, columns }: DataTableProps<T>) {
  return (
    <div className="tw:overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <Table style={{ minWidth: 700 }}>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={String(col.key)}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i} className="tw:text-center">
              {columns.map((col) => (
                <TableCell key={String(col.key)}>{String(row[col.key])}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
