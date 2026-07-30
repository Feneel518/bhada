import type { jsPDF } from "jspdf";

const LOGO_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 32 32">
    <rect width="32" height="32" fill="#111111"/>
    <rect x="1.5" y="1.5" width="29" height="29" fill="none" stroke="#f7f7f3"/>
    <text x="16" y="22" fill="#e4c77a" font-family="Nirmala UI, Noto Sans Devanagari, sans-serif" font-size="17.5" text-anchor="middle">भ</text>
  </svg>
`;

let logoDataUrl: Promise<string> | null = null;
let gotuFontData: Promise<string> | null = null;

function rasterizedLogo() {
  if (logoDataUrl) return logoDataUrl;

  logoDataUrl = new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = window.document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas is unavailable."));
        return;
      }
      context.drawImage(image, 0, 0, 256, 256);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("Could not render the Bhada logo."));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(LOGO_SVG)}`;
  });

  return logoDataUrl;
}

async function fetchGotuFont() {
  if (gotuFontData) return gotuFontData;

  gotuFontData = fetch(
    "https://raw.githubusercontent.com/google/fonts/main/ofl/gotu/Gotu-Regular.ttf",
  ).then(async (response) => {
    if (!response.ok) throw new Error("Could not load the Gotu font.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let index = 0; index < bytes.length; index += 8_192) {
      binary += String.fromCharCode(...bytes.subarray(index, index + 8_192));
    }
    return binary;
  });

  return gotuFontData;
}

export async function loadGotuPdfFont(pdf: jsPDF) {
  try {
    const font = await fetchGotuFont();
    pdf.addFileToVFS("Gotu-Regular.ttf", font);
    pdf.addFont("Gotu-Regular.ttf", "Gotu", "normal");
    pdf.addFont("Gotu-Regular.ttf", "Gotu", "bold");
    return "Gotu";
  } catch {
    return "helvetica";
  }
}

export async function drawBhadaPdfLogo(pdf: jsPDF, fontName = "helvetica") {
  try {
    pdf.addImage(await rasterizedLogo(), "PNG", 24, 18, 26, 26);
  } catch {
    pdf.setFillColor(17, 17, 17);
    pdf.rect(24, 18, 26, 26, "F");
    pdf.setDrawColor(247, 247, 243);
    pdf.rect(25.5, 19.5, 23, 23, "S");
  }

  pdf.setTextColor(18, 18, 16);
  pdf.setFont(fontName, "normal");
  pdf.setFontSize(13);
  pdf.text("Bhada", 37, 52, { align: "center" });
}
