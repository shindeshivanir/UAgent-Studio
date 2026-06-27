import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { UATScript, UATStep } from "../types";

/**
 * Converts a string with **bold** markers into exceljs RichText
 */
function toRichText(text: string): ExcelJS.RichText[] {
  const parts: ExcelJS.RichText[] = [];
  const regex = /(\*\*.*?\*\*)/g;
  const segments = text.split(regex);

  segments.forEach((segment) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      parts.push({
        font: { bold: true, name: 'Calibri' },
        text: segment.slice(2, -2),
      });
    } else if (segment) {
      parts.push({
        font: { name: 'Calibri' },
        text: segment,
      });
    }
  });

  return parts;
}

export async function generateUATExcel(data: UATScript) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("UAT Script");

  // --- Column Settings ---
  // Set individual column widths manually to avoid automatic header generation at Row 1
  worksheet.getColumn(1).width = 25; // Header Labels / Step No
  worksheet.getColumn(2).width = 30; // Values / Description
  worksheet.getColumn(3).width = 50; // Instruction
  worksheet.getColumn(4).width = 50; // Expected
  worksheet.getColumn(5).width = 30; // Actual
  worksheet.getColumn(6).width = 15; // Status
  worksheet.getColumn(7).width = 25; // Remarks

  // --- Styles ---
  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF002060" }, // Dark Blue
  };

  const headerFont: Partial<ExcelJS.Font> = {
    color: { argb: "FFFFFFFF" },
    bold: true,
    name: "Calibri",
  };

  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } },
  };

  // --- Metadata Header Rows ---
  const metaRows = [
    ["Test Script Number", data.metadata.scriptNumber, "", "", "", "As per Expected", "Passed"],
    ["Test Scenario Title", data.metadata.scenarioTitle, "", "", "", "Not as per Expected", "Failed"],
    ["Relevant to Role", data.metadata.role, "", "", "", "Clarification required", "On-Hold"],
    ["Tested By", data.metadata.testedBy, "", "", "", "", ""],
    ["Testing Date (DD/MM/YYYY)", data.metadata.testingDate, "", "", "", "", ""],
    ["Testing Status (Pass or Fail)", data.metadata.testingStatus, "", "", "", "", ""],
    ["Additional Comments", data.metadata.additionalComments, "", "", "", "", ""],
    [], // Spacer at row 8
    ["Sub Scenario No:", data.metadata.subScenarioNo],
    ["Sub Scenario:", data.metadata.subScenario],
    ["Description:", data.metadata.description],
    ["Prerequisite:", data.metadata.prerequisite],
    [], // Spacer at row 13
    [], // Spacer at row 14
  ];

  metaRows.forEach((rowData, idx) => {
    const row = worksheet.addRow(rowData);
    
    // Header Style for left column metadata
    const isMainMeta = idx < 7;
    const isSubMeta = idx >= 8 && idx <= 11;

    if (isMainMeta || isSubMeta) {
      const cell1 = row.getCell(1);
      cell1.fill = headerFill;
      cell1.font = headerFont;
      cell1.border = borderStyle;
      cell1.alignment = { horizontal: 'left', vertical: 'middle' };

      const cell2 = row.getCell(2);
      cell2.border = borderStyle;
      cell2.alignment = { horizontal: 'left', vertical: 'middle' };
      
      // Merge for sub scenario section (Rows 9 to 12 based on idx)
      if (isSubMeta) {
        worksheet.mergeCells(row.number, 2, row.number, 7);
      }
    }

    // Legend Styling (Rows 1-3)
    if (idx < 3) {
      const cell6 = row.getCell(6);
      const cell7 = row.getCell(7);
      
      cell6.border = borderStyle;
      cell7.border = borderStyle;
      cell7.font = { bold: true, name: 'Calibri', size: 10 };
      cell6.font = { name: 'Calibri', size: 10 };

      if (idx === 0) { // Passed
        cell7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
      } else if (idx === 1) { // Failed
        cell7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
        cell7.font.color = { argb: 'FFFFFFFF' };
      } else if (idx === 2) { // On-Hold
        cell7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };
        cell7.font.color = { argb: 'FFFFFFFF' };
      }
    }
  });

  // --- Grid Header ---
  const gridHeaderRow = worksheet.addRow([
    "Step Number",
    "Step description",
    "Step Test Instruction",
    "Step Expected Result",
    "Actual Results",
    "Step Status",
    "Remarks"
  ]);

  gridHeaderRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = borderStyle;
  });

  // --- Grid Data ---
  data.steps.forEach((step) => {
    const row = worksheet.addRow([
      step.stepNumber,
      step.module,
      "", // Instruction index 3
      "", // Expected index 4
      step.actualResults, 
      step.stepStatus,
      step.remarks
    ]);

    // Set RichText for instructions and expected results
    row.getCell(3).value = { richText: toRichText(step.instruction) };
    row.getCell(4).value = { richText: toRichText(step.expectedResult) };

    row.eachCell((cell, colNumber) => {
      cell.border = borderStyle;
      cell.alignment = { 
        vertical: "top", 
        wrapText: true,
        horizontal: (colNumber === 1 || colNumber === 6) ? 'center' : 'left'
      };
    });
  });

  // --- Save ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `${data.metadata.scenarioTitle || "UAT_Script"}.xlsx`);
}
