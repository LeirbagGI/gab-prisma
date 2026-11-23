// janela — acha a janela cujo título contém o texto e imprime "id largura altura título".
// Prefere a que está visível na tela; se nenhuma estiver, cai para qualquer uma.
import CoreGraphics
import Foundation
let alvo = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "Prisma"
for opcao in [CGWindowListOption.optionOnScreenOnly, .optionAll] {
  let lista = CGWindowListCopyWindowInfo([opcao, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] ?? []
  for w in lista {
    let nome = w[kCGWindowName as String] as? String ?? ""
    let camada = w[kCGWindowLayer as String] as? Int ?? 0
    if nome.contains(alvo), camada == 0, let b = w[kCGWindowBounds as String] as? [String: Any] {
      print(w[kCGWindowNumber as String] as! Int, b["Width"] as! Double, b["Height"] as! Double, nome)
      exit(0)
    }
  }
}
exit(1)
