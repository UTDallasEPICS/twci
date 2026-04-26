import QRCode from 'qrcode'

export async function generateQRCode(
  itemId: string,
  baseUrl: string,
  size: number = 400
): Promise<Buffer> {
  const url = `${baseUrl}/items/scan?id=${itemId}`
  return QRCode.toBuffer(url, {
    type: 'png',
    width: size,
    errorCorrectionLevel: 'M',
    margin: 2,
  })
}
