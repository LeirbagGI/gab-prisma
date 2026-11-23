// recortar — tira o fundo de uma imagem com o Vision do macOS (o mesmo recurso do "copiar objeto" das Fotos).
// Uso: swift recortar.swift entrada.png saida.png
import Foundation
import Vision
import CoreImage
import AppKit

let a = CommandLine.arguments
guard a.count == 3 else { fputs("uso: recortar entrada saida.png\n", stderr); exit(2) }
guard let img = CIImage(contentsOf: URL(fileURLWithPath: a[1])) else { fputs("não abri \(a[1])\n", stderr); exit(1) }

let req = VNGenerateForegroundInstanceMaskRequest()
let h = VNImageRequestHandler(ciImage: img)
do { try h.perform([req]) } catch { fputs("vision falhou: \(error)\n", stderr); exit(1) }
guard let r = req.results?.first, !r.allInstances.isEmpty else { fputs("nenhum objeto achado\n", stderr); exit(1) }

let buf = try r.generateMaskedImage(ofInstances: r.allInstances, from: h, croppedToInstancesExtent: true)
let out = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
guard let cs = CGColorSpace(name: CGColorSpace.sRGB) else { exit(1) }
try ctx.writePNGRepresentation(of: out, to: URL(fileURLWithPath: a[2]), format: .RGBA8, colorSpace: cs)
print(a[2])
