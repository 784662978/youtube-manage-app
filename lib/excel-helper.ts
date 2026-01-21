// Helper to generate Excel 2003 XML Spreadsheet
// This format is compatible with Excel 2010+ and supports multiple sheets/styling

export interface ExcelSheet {
  name: string
  columns: { header: string; key: string; width?: number; type?: 'String' | 'Number' }[]
  data: any[]
}

export function generateExcelXML(sheets: ExcelSheet[]): string {
  const timestamp = new Date().toISOString()
  
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Youtube Manage App</Author>
  <Created>${timestamp}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#4F81BD" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Date">
   <NumberFormat ss:Format="Short Date"/>
  </Style>
  <Style ss:ID="Number">
   <NumberFormat ss:Format="Standard"/>
  </Style>
 </Styles>`

  sheets.forEach(sheet => {
    xml += `
 <Worksheet ss:Name="${sheet.name}">
  <Table x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="15">`
    
    // Column Definitions
    sheet.columns.forEach(col => {
      xml += `
   <Column ss:Width="${col.width || 100}"/>`
    })

    // Header Row
    xml += `
   <Row ss:AutoFitHeight="0">`
    sheet.columns.forEach(col => {
      xml += `
    <Cell ss:StyleID="Header"><Data ss:Type="String">${col.header}</Data></Cell>`
    })
    xml += `
   </Row>`

    // Data Rows
    sheet.data.forEach(row => {
      xml += `
   <Row ss:AutoFitHeight="0">`
      sheet.columns.forEach(col => {
        const val = row[col.key]
        let type = col.type || 'String'
        let style = ''
        let dataVal = val

        if (typeof val === 'number') {
          type = 'Number'
          style = 'ss:StyleID="Number"'
        } else if (val === null || val === undefined) {
            dataVal = ''
        }

        xml += `
    <Cell ${style}><Data ss:Type="${type}">${dataVal}</Data></Cell>`
      })
      xml += `
   </Row>`
    })

    xml += `
  </Table>
 </Worksheet>`
  })

  xml += `
</Workbook>`

  return xml
}

export function downloadExcel(xmlContent: string, filename: string) {
  const blob = new Blob([xmlContent], { type: "application/vnd.ms-excel" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
