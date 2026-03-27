import * as XLSX from "xlsx"

export interface ExcelSheet {
  name: string
  columns: { header: string; key: string; width?: number; type?: 'String' | 'Number' }[]
  data: any[]
}

export function generateExcelXML(sheets: ExcelSheet[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()

  sheets.forEach(sheet => {
    const aoa: any[][] = []
    aoa.push(sheet.columns.map(col => col.header))
    sheet.data.forEach(row => {
      aoa.push(sheet.columns.map(col => {
        const val = row[col.key]
        return val === null || val === undefined ? "" : val
      }))
    })
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    if (sheet.columns.some(col => col.width)) {
      ws["!cols"] = sheet.columns.map(col => ({ wch: col.width || 100 }))
    }
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  })

  return wb
}

export function downloadExcel(workbook: XLSX.WorkBook, filename: string) {
  if (!filename.endsWith(".xlsx")) {
    filename = filename.replace(/\.xls$/i, "") + ".xlsx"
  }
  XLSX.writeFileXLSX(workbook, filename)
}
