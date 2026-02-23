import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileJson, FileSpreadsheet, FileText, Table } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportButtonProps {
  data: any[];
  filename: string;
  title?: string;
}

export function ExportButton({ data, filename, title = "Report" }: ExportButtonProps) {
  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const exportCSV = () => {
    if (!data.length) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => {
          const value = row[h];
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        }).join(",")
      ),
    ].join("\n");

    downloadFile(csvContent, `${filename}.csv`, "text/csv");
    toast.success("Exported as CSV");
  };

  const exportJSON = () => {
    if (!data.length) {
      toast.error("No data to export");
      return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${filename}.json`, "application/json");
    toast.success("Exported as JSON");
  };

  const exportExcel = () => {
    if (!data.length) {
      toast.error("No data to export");
      return;
    }

    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Set column widths
      const headers = Object.keys(data[0]);
      ws['!cols'] = headers.map(h => ({ 
        wch: Math.max(h.length, 15) 
      }));

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Data");

      // Generate Excel file
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success("Exported as Excel");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel file");
    }
  };

  const exportPDF = () => {
    if (!data.length) {
      toast.error("No data to export");
      return;
    }

    try {
      const doc = new jsPDF();
      const headers = Object.keys(data[0]);

      // Add title
      doc.setFontSize(18);
      doc.setTextColor(33, 37, 41);
      doc.text(title, 14, 20);

      // Add date
      doc.setFontSize(10);
      doc.setTextColor(108, 117, 125);
      doc.text(`Generated on ${formatDate()}`, 14, 28);

      // Add summary stats
      doc.setFontSize(11);
      doc.setTextColor(33, 37, 41);
      doc.text(`Total Records: ${data.length}`, 14, 38);

      // Calculate totals for numeric columns
      const numericColumns = headers.filter(h => 
        data.some(row => typeof row[h] === 'number')
      );
      
      let yPos = 44;
      numericColumns.slice(0, 3).forEach(col => {
        const total = data.reduce((sum, row) => sum + (Number(row[col]) || 0), 0);
        const formattedTotal = col.toLowerCase().includes('cost') || col.toLowerCase().includes('saving')
          ? `$${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
          : total.toLocaleString();
        doc.text(`Total ${col}: ${formattedTotal}`, 14, yPos);
        yPos += 6;
      });

      // Format table data
      const tableData = data.map(row => 
        headers.map(h => {
          const value = row[h];
          if (typeof value === 'number') {
            if (h.toLowerCase().includes('cost') || h.toLowerCase().includes('saving')) {
              return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
            }
            return value.toLocaleString();
          }
          return String(value ?? '');
        })
      );

      // Add table
      autoTable(doc, {
        head: [headers.map(h => h.charAt(0).toUpperCase() + h.slice(1).replace(/_/g, ' '))],
        body: tableData,
        startY: yPos + 6,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { top: 10, left: 14, right: 14 },
      });

      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `Page ${i} of ${pageCount} | SpendLens Report`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      doc.save(`${filename}.pdf`);
      toast.success("Exported as PDF");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF file");
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Export Format
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportCSV} className="gap-2">
          <FileSpreadsheet className="h-4 w-4 text-success" />
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportExcel} className="gap-2">
          <Table className="h-4 w-4 text-success" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF} className="gap-2">
          <FileText className="h-4 w-4 text-destructive" />
          PDF Report (.pdf)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportJSON} className="gap-2">
          <FileJson className="h-4 w-4 text-warning" />
          JSON (.json)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
