// Decodes each PNG given on the command line as a QR code and prints its text, one line per file.
// Used by scripts/verify_qr.py:  xcrun swift scripts/verify_qr.swift a.png b.png
import CoreImage
import Foundation

let detector = CIDetector(ofType: CIDetectorTypeQRCode, context: nil,
                          options: [CIDetectorAccuracy: CIDetectorAccuracyHigh])!
for path in CommandLine.arguments.dropFirst() {
    guard let image = CIImage(contentsOf: URL(fileURLWithPath: path)) else {
        print("ERROR could not open \(path)")
        continue
    }
    let found = detector.features(in: image).compactMap { ($0 as? CIQRCodeFeature)?.messageString }
    print(found.first ?? "ERROR no QR code found in \(path)")
}
