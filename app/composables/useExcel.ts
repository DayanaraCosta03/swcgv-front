import * as XLSX from "xlsx";

/**
 * Exportación a Excel (.xlsx) con SheetJS. Composable sin estado, auto-importado
 * por Nuxt. Recibe filas como objetos planos (las claves son las cabeceras).
 */
export function useExcel() {
  function exportTableExcel(
    filename: string,
    rows: Record<string, string | number | boolean>[],
    sheetName = "Reporte",
  ) {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename);
  }

  return { exportTableExcel };
}
