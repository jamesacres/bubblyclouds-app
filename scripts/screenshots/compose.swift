import AppKit
import CoreText
import Foundation

struct TextStyle: Decodable {
    let fontSize: Double
    let y: Double
    let maxWidth: Double
    let maxLines: Int
    let warnBelowScale: Double
}

struct Rect: Decodable {
    let x: Double
    let y: Double
    let width: Double
    let height: Double
    let cornerRadius: Double
}

struct ScreenRect: Decodable {
    let x: Double
    let y: Double
    let width: Double
    let height: Double
    let cornerRadius: Double
    let captureWidth: Int
    let captureHeight: Int
}

struct TextOverride: Decodable {
    let fontSize: Double?
    let y: Double?
    let maxWidth: Double?
    let maxLines: Int?
    let warnBelowScale: Double?
}

struct ScreenOverride: Decodable {
    let x: Double?
    let y: Double?
    let width: Double?
    let height: Double?
    let cornerRadius: Double?
}

struct Screen: Decodable {
    let id: String
    let frame: String
    let capture: String
    let textBandBottom: Double?
    let title: TextOverride?
    let subtitle: TextOverride?
    let screen: ScreenOverride?
    let restoreFromFrame: [Rect]?
    let cameraPatch: Rect?
}

func merged(_ base: TextStyle, _ override: TextOverride?) -> TextStyle {
    guard let override else { return base }
    return TextStyle(
        fontSize: override.fontSize ?? base.fontSize,
        y: override.y ?? base.y,
        maxWidth: override.maxWidth ?? base.maxWidth,
        maxLines: override.maxLines ?? base.maxLines,
        warnBelowScale: override.warnBelowScale ?? base.warnBelowScale)
}

func merged(_ base: ScreenRect, _ override: ScreenOverride?) -> ScreenRect {
    guard let override else { return base }
    return ScreenRect(
        x: override.x ?? base.x,
        y: override.y ?? base.y,
        width: override.width ?? base.width,
        height: override.height ?? base.height,
        cornerRadius: override.cornerRadius ?? base.cornerRadius,
        captureWidth: base.captureWidth,
        captureHeight: base.captureHeight)
}

struct Config: Decodable {
    let fontFile: String
    let fontWeight: Double
    let textBandBottom: Double
    let minFontScale: Double
    let quality: Double
    let title: TextStyle
    let subtitle: TextStyle
    let screen: ScreenRect
    let restoreFromFrame: [Rect]
    let screens: [Screen]
}

struct Caption: Decodable {
    let title: String
    let subtitle: String
}

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data((message + "\n").utf8))
    exit(1)
}

func arg(_ name: String) -> String? {
    let args = CommandLine.arguments
    guard let index = args.firstIndex(of: name), index + 1 < args.count else { return nil }
    return args[index + 1]
}

func loadImage(_ path: String) -> CGImage {
    guard let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
    else { fail("cannot read image \(path)") }
    return image
}

struct GreyBox {
    let x0: Int
    let y0: Int
    let x1: Int
    let y1: Int
}

/// Finds the simulator's flat grey camera placeholder: the tallest run of rows
/// that are mostly mid-grey, then the columns that are grey within those rows.
func detectGreyBox(_ image: CGImage) -> GreyBox? {
    let width = image.width
    let height = image.height
    guard let context = CGContext(
        data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
    else { return nil }
    context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
    guard let data = context.data else { return nil }
    let pixels = data.assumingMemoryBound(to: UInt8.self)

    var grey = [Bool](repeating: false, count: width * height)
    var rowCount = [Int](repeating: 0, count: height)
    for y in 0..<height {
        for x in 0..<width {
            let offset = (y * width + x) * 4
            let r = Int(pixels[offset]), g = Int(pixels[offset + 1]), b = Int(pixels[offset + 2])
            let luminance = (299 * r + 587 * g + 114 * b) / 1000
            let chroma = max(r, g, b) - min(r, g, b)
            if luminance > 100 && luminance < 185 && chroma < 14 {
                grey[y * width + x] = true
                rowCount[y] += 1
            }
        }
    }

    let denseRows = Double(width) * 0.35
    var best: (start: Int, end: Int)? = nil
    var start = -1
    var last = -1
    func close() {
        if start >= 0, best == nil || last - start > best!.end - best!.start {
            best = (start, last)
        }
        start = -1
    }
    for y in 0..<height {
        if Double(rowCount[y]) >= denseRows {
            if start < 0 { start = y }
            last = y
        } else if start >= 0 && y - last > 8 {
            close()
        }
    }
    close()
    guard let run = best, run.end - run.start > 200 else { return nil }

    let runHeight = run.end - run.start + 1
    var x0 = width
    var x1 = -1
    for x in 0..<width {
        var count = 0
        for y in run.start...run.end where grey[y * width + x] { count += 1 }
        if Double(count) >= Double(runHeight) * 0.4 {
            x0 = min(x0, x)
            x1 = max(x1, x)
        }
    }
    guard x1 > x0 else { return nil }
    return GreyBox(x0: x0, y0: run.start, x1: x1, y1: run.end)
}

func makeFont(descriptor: CTFontDescriptor, size: Double, weight: Double) -> CTFont {
    let weightAxis = 0x7767_6874
    let varied = CTFontDescriptorCreateCopyWithVariation(descriptor, weightAxis as CFNumber, weight)
    return CTFontCreateWithFontDescriptor(varied, size, nil)
}

struct Layout {
    let setter: CTFramesetter
    let size: CGSize
    let fontSize: Double
    let lines: Int
    let orphan: String?
}

func layout(
    text: String, descriptor: CTFontDescriptor, style: TextStyle, weight: Double, minScale: Double
) -> Layout {
    var size = style.fontSize
    let floor = style.fontSize * minScale
    while true {
        let font = makeFont(descriptor: descriptor, size: size, weight: weight)
        var alignment = CTTextAlignment.center
        let paragraph = withUnsafeBytes(of: &alignment) { bytes -> CTParagraphStyle in
            var setting = CTParagraphStyleSetting(
                spec: .alignment, valueSize: MemoryLayout<CTTextAlignment>.size, value: bytes.baseAddress!)
            return CTParagraphStyleCreate(&setting, 1)
        }
        let attributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: CGColor(red: 1, green: 1, blue: 1, alpha: 1),
            NSAttributedString.Key(kCTParagraphStyleAttributeName as String): paragraph,
        ]
        let attributed = NSAttributedString(string: text, attributes: attributes)
        let setter = CTFramesetterCreateWithAttributedString(attributed)
        let constraint = CGSize(width: style.maxWidth, height: .greatestFiniteMagnitude)
        let suggested = CTFramesetterSuggestFrameSizeWithConstraints(
            setter, CFRange(location: 0, length: 0), nil, constraint, nil)
        let path = CGPath(rect: CGRect(origin: .zero, size: CGSize(width: style.maxWidth, height: suggested.height + 10)), transform: nil)
        let frame = CTFramesetterCreateFrame(setter, CFRange(location: 0, length: 0), path, nil)
        let ctLines = (CTFrameGetLines(frame) as? [CTLine]) ?? []
        let lines = max(ctLines.count, 1)
        if lines <= style.maxLines || size <= floor {
            let nsText = text as NSString
            var orphan: String?
            for (index, line) in ctLines.enumerated() where index > 0 {
                let range = CTLineGetStringRange(line)
                let piece = nsText.substring(with: NSRange(location: range.location, length: range.length))
                let trimmed = piece.trimmingCharacters(in: .whitespacesAndNewlines)
                let previous = ctLines[index - 1]
                let previousRange = CTLineGetStringRange(previous)
                let previousPiece = nsText.substring(with: NSRange(location: previousRange.location, length: previousRange.length))
                let wrapped = !previousPiece.hasSuffix("\n")
                if wrapped && trimmed.count > 0 && trimmed.count <= 2 { orphan = trimmed }
            }
            return Layout(setter: setter, size: suggested, fontSize: size, lines: lines, orphan: orphan)
        }
        size -= 1
    }
}

func drawText(
    _ text: String, style: TextStyle, descriptor: CTFontDescriptor, config: Config,
    in context: CGContext, canvasWidth: Double, canvasHeight: Double
) -> Layout {
    let result = layout(
        text: text, descriptor: descriptor, style: style, weight: config.fontWeight,
        minScale: config.minFontScale)
    let rect = CGRect(
        x: (canvasWidth - style.maxWidth) / 2,
        y: canvasHeight - style.y - result.size.height,
        width: style.maxWidth, height: result.size.height)
    let frame = CTFramesetterCreateFrame(
        result.setter, CFRange(location: 0, length: 0),
        CGPath(rect: rect.insetBy(dx: 0, dy: -10), transform: nil), nil)
    CTFrameDraw(frame, context)
    return result
}

func report(_ id: String, _ label: String, _ result: Layout, _ style: TextStyle, _ config: Config) -> Bool {
    let scale = result.fontSize / style.fontSize
    let overflow = result.lines > style.maxLines
    if overflow {
        print("  \(id) \(label): OVERFLOW \(result.lines) lines at \(Int(scale * 100))% (max \(style.maxLines)); shorten the caption")
    } else if scale < style.warnBelowScale {
        print("  \(id) \(label): small, shrunk to \(Int(scale * 100))% of \(Int(style.fontSize))pt; consider a shorter caption")
    }
    if let orphan = result.orphan {
        print("  \(id) \(label): orphan, last line is just \"\(orphan)\"; reword the caption")
    }
    return !overflow
}

func fitPlane(pixels: UnsafePointer<UInt8>, width: Int, height: Int, bandBottom: Int, margin: Int) -> [[Double]] {
    var ata = [[Double]](repeating: [0, 0, 0], count: 3)
    var atb = [[Double]](repeating: [0, 0, 0], count: 3)
    func add(_ x: Int, _ y: Int) {
        let row = [1.0, Double(x), Double(y)]
        let offset = (y * width + x) * 4
        for i in 0..<3 {
            for j in 0..<3 { ata[i][j] += row[i] * row[j] }
            for channel in 0..<3 { atb[channel][i] += row[i] * Double(pixels[offset + channel]) }
        }
    }
    for y in stride(from: 0, to: bandBottom, by: 2) {
        for x in 0..<margin { add(x, y) }
        for x in (width - margin)..<width { add(x, y) }
    }
    return (0..<3).map { channel in solve3(ata, atb[channel]) }
}

func solve3(_ a: [[Double]], _ b: [Double]) -> [Double] {
    var m = a
    var v = b
    for i in 0..<3 {
        var pivot = i
        for r in (i + 1)..<3 where abs(m[r][i]) > abs(m[pivot][i]) { pivot = r }
        m.swapAt(i, pivot)
        v.swapAt(i, pivot)
        for r in (i + 1)..<3 {
            let f = m[r][i] / m[i][i]
            for c in i..<3 { m[r][c] -= f * m[i][c] }
            v[r] -= f * v[i]
        }
    }
    var x = [0.0, 0.0, 0.0]
    for i in stride(from: 2, through: 0, by: -1) {
        var sum = v[i]
        for c in (i + 1)..<3 { sum -= m[i][c] * x[c] }
        x[i] = sum / m[i][i]
    }
    return x
}

guard let configPath = arg("--config"),
      let captionsPath = arg("--captions"),
      let shotsDir = arg("--shots"),
      let outDir = arg("--out")
else { fail("usage: compose --config <config.json> --captions <captions.json> --shots <dir> --out <dir> [--only <id>]") }

let configURL = URL(fileURLWithPath: configPath)
let baseDir = configURL.deletingLastPathComponent()
let decoder = JSONDecoder()
guard let config = try? decoder.decode(Config.self, from: Data(contentsOf: configURL)) else {
    fail("invalid config \(configPath)")
}
guard let captions = try? decoder.decode([String: Caption].self, from: Data(contentsOf: URL(fileURLWithPath: captionsPath))) else {
    fail("invalid captions \(captionsPath)")
}

let fontURL = baseDir.appendingPathComponent(config.fontFile).standardizedFileURL
guard let descriptors = CTFontManagerCreateFontDescriptorsFromURL(fontURL as CFURL) as? [CTFontDescriptor],
      let descriptor = descriptors.first
else { fail("cannot load font \(fontURL.path)") }

try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)
let only = arg("--only")
var rendered = 0
var overflowed = 0

for screen in config.screens {
    if let only, only != screen.id { continue }
    guard let caption = captions[screen.id] else { fail("no caption for screen \(screen.id)") }
    let capturePath = URL(fileURLWithPath: shotsDir).appendingPathComponent(screen.capture).path
    guard FileManager.default.fileExists(atPath: capturePath) else {
        FileHandle.standardError.write(Data("skip \(screen.id): missing \(capturePath)\n".utf8))
        continue
    }

    let frame = loadImage(baseDir.appendingPathComponent(screen.frame).path)
    let capture = loadImage(capturePath)
    guard capture.width == config.screen.captureWidth, capture.height == config.screen.captureHeight else {
        fail(
            "\(capturePath) is \(capture.width)x\(capture.height), expected "
                + "\(config.screen.captureWidth)x\(config.screen.captureHeight) (same simulator model as the frames)")
    }
    let width = frame.width
    let height = frame.height
    let colorSpace = frame.colorSpace ?? CGColorSpace(name: CGColorSpace.displayP3)!
    guard let context = CGContext(
        data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
        space: colorSpace, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
    else { fail("cannot create context") }

    context.draw(frame, in: CGRect(x: 0, y: 0, width: width, height: height))

    guard let data = context.data else { fail("no bitmap data") }
    let pixels = data.assumingMemoryBound(to: UInt8.self)
    let titleStyle = merged(config.title, screen.title)
    let subtitleStyle = merged(config.subtitle, screen.subtitle)
    let rect = merged(config.screen, screen.screen)
    let bandBottom = Int(screen.textBandBottom ?? config.textBandBottom)
    let plane = fitPlane(pixels: pixels, width: width, height: height, bandBottom: bandBottom, margin: 90)
    for y in 0..<bandBottom {
        for x in 0..<width {
            let offset = (y * width + x) * 4
            for channel in 0..<3 {
                let value = plane[channel][0] + plane[channel][1] * Double(x) + plane[channel][2] * Double(y)
                pixels[offset + channel] = UInt8(max(0, min(255, value.rounded())))
            }
        }
    }

    let screenRect = CGRect(
        x: rect.x, y: Double(height) - rect.y - rect.height,
        width: rect.width, height: rect.height)
    context.saveGState()
    context.addPath(CGPath(
        roundedRect: screenRect, cornerWidth: rect.cornerRadius,
        cornerHeight: rect.cornerRadius, transform: nil))
    context.clip()
    context.interpolationQuality = .high
    context.draw(capture, in: screenRect)
    context.restoreGState()

    if let patch = screen.cameraPatch {
        if let box = detectGreyBox(capture) {
            let scaleX = rect.width / Double(capture.width)
            let scaleY = rect.height / Double(capture.height)
            let left = rect.x + Double(box.x0) * scaleX
            let top = rect.y + Double(box.y0) * scaleY
            let boxWidth = Double(box.x1 - box.x0 + 1) * scaleX
            let visibleHeight = min(Double(box.y1 - box.y0 + 1) * scaleY, Double(height) - top)
            let sourceRect = CGRect(x: patch.x, y: patch.y, width: patch.width, height: patch.height)
            if let source = frame.cropping(to: sourceRect) {
                let factor = max(boxWidth / patch.width, visibleHeight / patch.height)
                let drawWidth = patch.width * factor
                let drawHeight = patch.height * factor
                let destination = CGRect(
                    x: left, y: Double(height) - top - drawHeight, width: drawWidth, height: drawHeight)
                let boxRect = CGRect(
                    x: left, y: Double(height) - top - visibleHeight, width: boxWidth, height: visibleHeight)
                context.saveGState()
                context.addPath(CGPath(
                    roundedRect: boxRect, cornerWidth: patch.cornerRadius,
                    cornerHeight: patch.cornerRadius, transform: nil))
                context.clip()
                context.interpolationQuality = .high
                context.draw(source, in: destination)
                context.restoreGState()
            }
        } else {
            FileHandle.standardError.write(
                Data("warn \(screen.id): camera placeholder not found in \(capturePath)\n".utf8))
        }
    }

    for region in screen.restoreFromFrame ?? config.restoreFromFrame {
        let rect = CGRect(
            x: region.x, y: Double(height) - region.y - region.height, width: region.width, height: region.height)
        context.saveGState()
        context.addPath(CGPath(
            roundedRect: rect, cornerWidth: region.cornerRadius, cornerHeight: region.cornerRadius, transform: nil))
        context.clip()
        context.draw(frame, in: CGRect(x: 0, y: 0, width: width, height: height))
        context.restoreGState()
    }

    let titleLayout = drawText(
        caption.title, style: titleStyle, descriptor: descriptor, config: config, in: context,
        canvasWidth: Double(width), canvasHeight: Double(height))
    let subtitleLayout = drawText(
        caption.subtitle, style: subtitleStyle, descriptor: descriptor, config: config, in: context,
        canvasWidth: Double(width), canvasHeight: Double(height))
    let titleFits = report(screen.id, "title", titleLayout, titleStyle, config)
    let subtitleFits = report(screen.id, "subtitle", subtitleLayout, subtitleStyle, config)
    if !(titleFits && subtitleFits) { overflowed += 1 }

    guard let image = context.makeImage() else { fail("cannot render \(screen.id)") }
    let outURL = URL(fileURLWithPath: outDir).appendingPathComponent("\(screen.id).jpeg")
    guard let destination = CGImageDestinationCreateWithURL(outURL as CFURL, "public.jpeg" as CFString, 1, nil)
    else { fail("cannot write \(outURL.path)") }
    CGImageDestinationAddImage(
        destination, image, [kCGImageDestinationLossyCompressionQuality: config.quality] as CFDictionary)
    guard CGImageDestinationFinalize(destination) else { fail("cannot finalize \(outURL.path)") }
    rendered += 1
}

print("rendered \(rendered) screens -> \(outDir)")
if overflowed > 0 {
    FileHandle.standardError.write(Data("\(overflowed) screen(s) overflow their text box\n".utf8))
    exit(2)
}
