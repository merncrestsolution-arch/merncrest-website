import * as XLSX from "xlsx";

export type ImportedLeadRow = {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  interest?: string;
  tags?: string;
};

/** Parse CSV text or Excel .xlsx ArrayBuffer into lead rows */
export function parseLeadsSpreadsheet(
  input: string | ArrayBuffer,
  filenameHint?: string
): { rows: ImportedLeadRow[]; errors: string[] } {
  const errors: string[] = [];
  let workbook: XLSX.WorkBook;

  if (typeof input === "string") {
    workbook = XLSX.read(input, { type: "string" });
  } else {
    workbook = XLSX.read(input, { type: "array" });
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { rows: [], errors: ["Empty workbook"] };
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const rows: ImportedLeadRow[] = [];
  for (let i = 0; i < json.length; i++) {
    const r = json[i];
    const fullName = String(
      r.fullName || r.FullName || r.name || r.Name || r["Full Name"] || ""
    ).trim();
    const email = String(r.email || r.Email || r["E-mail"] || "")
      .trim()
      .toLowerCase();
    const phone = String(r.phone || r.Phone || r.mobile || r.Mobile || "").trim();
    const company = String(r.company || r.Company || r.organization || "").trim();
    const interest = String(r.interest || r.Interest || r.product || "").trim();
    const tags = String(r.tags || r.Tags || r.segment || "").trim();

    if (!fullName || !email) {
      errors.push(`Row ${i + 2}: missing fullName/email`);
      continue;
    }
    rows.push({
      fullName,
      email,
      phone: phone || undefined,
      company: company || undefined,
      interest: interest || undefined,
      tags: tags || undefined,
    });
  }

  if (filenameHint?.endsWith(".csv") && rows.length === 0 && errors.length === 0) {
    errors.push("No data rows found");
  }

  return { rows, errors };
}

export function leadsToXlsxBuffer(rows: ImportedLeadRow[]): ArrayBuffer {
  const ws = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      fullName: r.fullName,
      email: r.email,
      phone: r.phone || "",
      company: r.company || "",
      interest: r.interest || "",
      tags: r.tags || "",
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
