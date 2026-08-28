
import Cryptr from 'cryptr';
import { saveAs } from "file-saver";
import { getDownloadURL, ref } from "firebase/storage";
import * as XLSX from "xlsx";
import { storage } from "./firebase";

const cryptr = new Cryptr(process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "1234");

export const EncryptString = (data: string) => {
  const encryptedString = cryptr.encrypt(data);
  return encryptedString
}

export const DecryptString = (data: string) => {
  const decryptedString = cryptr.decrypt(data);
  return decryptedString
}

export function splitFullName(fullName: string | null) {
  if (!fullName) return { first_name: "", last_name: "" }
  const parts = fullName.trim().split(/\s+/);

  const last_name = parts.pop() || "";
  const first_name = parts.join(" ") || "";

  return { first_name, last_name };
}

export function joinNames(data: (string | null | undefined)[]): string {
  return data
    .filter(Boolean)
    .map((s) => s!.trim())
    .filter(Boolean)
    .join(" ");
}

export function getYear(val: string | null | Date | undefined) {

  return val ? new Date().getFullYear() - new Date(val).getFullYear() : "N/A"
}



export async function GetProfileImage(imgLink: string | null) {
  if (!imgLink) return "";

  try {
    const url = await getDownloadURL(ref(storage, imgLink));
    return url;
  } catch (error) {
    return "";
  }
}


export const exportToExcel = async (
  headers: string[],
  data: (string)[][],
  fileName = "data.xlsx",
) => {
  if (!data || data.length === 0) {
    throw new Error("No data available to export");
  }

  const worksheetData = [headers];


  for (const row of data) {
    worksheetData.push(row);
  }



  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);


  try {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const excelBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(excelBlob, fileName);
  } catch (error) {
    console.error("Failed to generate or download Excel:", error);
    throw new Error("Failed to generate Excel file");
  }
};

export function formatTimeWithAmPm(time: string): string {
  if (!time) return ""

  const match = time.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/)
  if (!match) return time

  let hour = parseInt(match[1], 10)
  const minute = match[2]
  const suppliedAmPm = match[3]?.toUpperCase()

  if (suppliedAmPm) {
    return `${hour.toString().padStart(2, "0")}:${minute} ${suppliedAmPm}`
  }

  const ampm = hour >= 12 ? "PM" : "AM"
  hour = hour % 12
  if (hour === 0) hour = 12
  const hourFormatted = hour.toString().padStart(2, "0")
  return `${hourFormatted}:${minute} ${ampm}`
}

type SheetConfig = {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
};

export const exportDashboardToExcel = async (
  sheets: SheetConfig[],
  fileName = "dashboard-report.xlsx"
) => {
  if (!sheets.length) throw new Error("No sheets to export");

  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ sheetName, headers, rows }) => {
    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });

  saveAs(blob, fileName);
};


export function calcualteRevenu(paymentData: any[]) {

  const totalRevuew = paymentData.filter((item) => item.status === 'paid').reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  return totalRevuew
}


