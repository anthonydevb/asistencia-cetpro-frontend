declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  
  interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    theme?: string;
    styles?: any;
    headStyles?: any;
    columnStyles?: any;
    margin?: any;
    [key: string]: any;
  }
  
  function autoTable(doc: jsPDF, options: AutoTableOptions): void;
  export default autoTable;
}

