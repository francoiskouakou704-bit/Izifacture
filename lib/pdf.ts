'use client'

// Export PDF côté navigateur : on photographie le rendu exact de la facture (toutes langues,
// écritures RTL, logo, tampon) puis on le place sur des pages A4.
// Les bibliothèques ne sont chargées qu'au premier téléchargement.

const A4 = { width: 210, height: 297 } // mm
/** Largeur de rendu en pixels CSS (~ A4 à 96 dpi) : mise en page « ordinateur » même sur mobile. */
const RENDER_WIDTH = 794

export async function downloadElementAsPdf(element: HTMLElement, fileName: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')])
  await document.fonts?.ready

  const canvas = await html2canvas(element, {
    scale: 2.5, // netteté à l'impression
    backgroundColor: '#ffffff',
    useCORS: true, // logo hébergé sur Supabase Storage
    logging: false,
    // Fenêtre virtuelle large : les media queries (colonnes, tampon) s'appliquent comme sur ordinateur
    windowWidth: 1280,
    onclone: (doc, clone) => {
      doc.documentElement.classList.remove('dark')
      Object.assign(clone.style, {
        width: `${RENDER_WIDTH}px`,
        maxWidth: 'none',
        margin: '0',
        borderRadius: '0',
        boxShadow: 'none',
      })
    },
  })

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  pdf.setProperties({ title: fileName.replace(/\.pdf$/i, ''), creator: 'izi-facture' })

  // Découpe en pages A4 si la facture est longue
  const pageHeightPx = Math.floor((canvas.width * A4.height) / A4.width)
  for (let y = 0, page = 0; y < canvas.height; y += pageHeightPx, page++) {
    const sliceHeight = Math.min(pageHeightPx, canvas.height - y)
    const slice = document.createElement('canvas')
    slice.width = canvas.width
    slice.height = sliceHeight
    const ctx = slice.getContext('2d')
    if (!ctx) throw new Error('canvas indisponible')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, slice.width, slice.height)
    ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)
    if (page > 0) pdf.addPage()
    pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, A4.width, (sliceHeight * A4.width) / canvas.width)
  }

  pdf.save(fileName)
}

/** Nom de fichier sûr : « INV-2026-0042.pdf ». */
export function pdfFileName(base: string) {
  const safe = base.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'facture'
  return `${safe}.pdf`
}
