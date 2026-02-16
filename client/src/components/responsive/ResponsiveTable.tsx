import { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => ReactNode;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  keyExtractor: (row: any) => string | number;
  mobileCardRender?: (row: any) => ReactNode;
}

/**
 * ResponsiveTable - Tableau qui devient des cards empilées sur mobile
 * 
 * Mobile (< 640px):
 * - Chaque ligne devient une Card verticale
 * - Layout optimisé pour la lecture
 * - Pas de scroll horizontal
 * 
 * Desktop (>= 640px):
 * - Tableau classique avec scroll si nécessaire
 * - Toutes les colonnes visibles
 */
export function ResponsiveTable({
  columns,
  data,
  keyExtractor,
  mobileCardRender,
}: ResponsiveTableProps) {
  return (
    <>
      {/* Mobile: Cards empilées */}
      <div className="sm:hidden space-y-3">
        {data.map((row) => (
          <Card key={keyExtractor(row)}>
            <CardContent className="p-3">
              {mobileCardRender ? (
                mobileCardRender(row)
              ) : (
                <div className="space-y-2">
                  {columns.map((column) => (
                    <div key={column.key} className="flex justify-between items-start gap-2">
                      <span className="text-xs font-medium text-muted-foreground shrink-0">
                        {column.label}:
                      </span>
                      <span className="text-sm text-right">
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: Tableau avec scroll */}
      <div className="hidden sm:block overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={keyExtractor(row)}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
