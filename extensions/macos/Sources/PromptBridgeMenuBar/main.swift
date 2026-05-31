import AppKit
import ApplicationServices

private let arabicPattern = try! NSRegularExpression(pattern: "[\\u{0600}-\\u{06FF}]")
private let copyTimeout: TimeInterval = 1.0
private let clipboardPoll: TimeInterval = 0.05
private let pasteDelay: TimeInterval = 0.15
private let processingCooldown: TimeInterval = 1.2

final class PromptBridgeMenuBarApp: NSObject, NSApplicationDelegate {
  private var statusItem: NSStatusItem!
  private var autoReplaceEnabled = false
  private var redactEnabled = false
  private var preserveClipboard = true
  private var mode = "auto"
  private var lastStatus = "Idle"
  private var lastInput = ""
  private var lastProcessedAt = Date.distantPast
  private var isProcessing = false
  private var eventMonitor: Any?

  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.setActivationPolicy(.accessory)
    setupStatusItem()
    installSelectionMonitor()
  }

  func applicationWillTerminate(_ notification: Notification) {
    if let eventMonitor {
      NSEvent.removeMonitor(eventMonitor)
    }
  }

  private func setupStatusItem() {
    statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
    statusItem.isVisible = true

    if let button = statusItem.button {
      button.image = makeStatusIcon()
      button.imagePosition = .imageOnly
      button.toolTip = "PromptBridge Arabic"
    }

    rebuildMenu()
    showLaunchNotice()
  }

  private func rebuildMenu() {
    let menu = NSMenu()

    let title = NSMenuItem(title: "PromptBridge Arabic", action: nil, keyEquivalent: "")
    title.isEnabled = false
    menu.addItem(title)

    let status = NSMenuItem(title: "Status: \(lastStatus)", action: nil, keyEquivalent: "")
    status.isEnabled = false
    menu.addItem(status)
    menu.addItem(.separator())

    let toggle = NSMenuItem(
      title: "Auto Replace Selected Arabic",
      action: #selector(toggleAutoReplace),
      keyEquivalent: ""
    )
    toggle.target = self
    toggle.state = autoReplaceEnabled ? .on : .off
    menu.addItem(toggle)

    let convertNow = NSMenuItem(
      title: "Convert Current Selection Now",
      action: #selector(convertCurrentSelectionNow),
      keyEquivalent: ""
    )
    convertNow.target = self
    menu.addItem(convertNow)

    let redact = NSMenuItem(
      title: "Redact Secrets",
      action: #selector(toggleRedaction),
      keyEquivalent: ""
    )
    redact.target = self
    redact.state = redactEnabled ? .on : .off
    menu.addItem(redact)

    let preserve = NSMenuItem(
      title: "Preserve Clipboard After Paste",
      action: #selector(togglePreserveClipboard),
      keyEquivalent: ""
    )
    preserve.target = self
    preserve.state = preserveClipboard ? .on : .off
    menu.addItem(preserve)

    let modeMenu = NSMenu()
    for promptMode in ["auto", "fix", "refactor", "review", "tests", "explain", "security"] {
      let item = NSMenuItem(
        title: promptMode,
        action: #selector(setMode(_:)),
        keyEquivalent: ""
      )
      item.target = self
      item.representedObject = promptMode
      item.state = mode == promptMode ? .on : .off
      modeMenu.addItem(item)
    }

    let modeItem = NSMenuItem(title: "Mode", action: nil, keyEquivalent: "")
    modeItem.submenu = modeMenu
    menu.addItem(modeItem)
    menu.addItem(.separator())

    let accessibility = NSMenuItem(
      title: "Request Accessibility Permission",
      action: #selector(requestAccessibilityPermission),
      keyEquivalent: ""
    )
    accessibility.target = self
    menu.addItem(accessibility)

    let quit = NSMenuItem(title: "Quit", action: #selector(quit), keyEquivalent: "q")
    quit.target = self
    menu.addItem(quit)

    statusItem.menu = menu

    if let button = statusItem.button {
      button.image = makeStatusIcon(active: autoReplaceEnabled)
      button.imagePosition = .imageOnly
      button.toolTip = autoReplaceEnabled ? "PromptBridge Arabic: Auto replace on" : "PromptBridge Arabic"
    }
  }

  private func makeStatusIcon(active: Bool = false) -> NSImage {
    if let symbol = NSImage(
      systemSymbolName: active ? "text.bubble.fill" : "text.bubble",
      accessibilityDescription: "PromptBridge Arabic"
    ) {
      symbol.isTemplate = true
      return symbol
    }

    let image = NSImage(size: NSSize(width: 18, height: 18))
    image.lockFocus()
    let bounds = NSRect(x: 0, y: 0, width: 18, height: 18)
    NSColor.labelColor.setStroke()
    NSBezierPath(roundedRect: bounds.insetBy(dx: 2, dy: 3), xRadius: 4, yRadius: 4).stroke()
    NSString(string: "P").draw(
      at: NSPoint(x: 5, y: 2),
      withAttributes: [
        .font: NSFont.boldSystemFont(ofSize: 12),
        .foregroundColor: NSColor.labelColor
      ]
    )
    image.unlockFocus()
    image.isTemplate = true
    return image
  }

  private func showLaunchNotice() {
    let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "dev"
    let launchNoticeKey = "didShowLaunchNotice.\(appVersion)"
    guard !UserDefaults.standard.bool(forKey: launchNoticeKey) else {
      return
    }

    UserDefaults.standard.set(true, forKey: launchNoticeKey)

    let alert = NSAlert()
    alert.messageText = "PromptBridge Arabic is running"
    alert.informativeText = "Look for the text bubble icon in the macOS menu bar. If a menu bar manager hides new icons, move PromptBridge to the visible section."
    alert.addButton(withTitle: "OK")

    NSApp.activate(ignoringOtherApps: true)
    alert.runModal()
  }

  private func installSelectionMonitor() {
    eventMonitor = NSEvent.addGlobalMonitorForEvents(
      matching: [.leftMouseUp, .keyUp]
    ) { [weak self] _ in
      self?.scheduleAutoReplacement()
    }
  }

  private func scheduleAutoReplacement() {
    guard autoReplaceEnabled, isAccessibilityTrusted(prompt: false) else {
      return
    }

    DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) { [weak self] in
      self?.processCurrentSelection(trigger: "auto")
    }
  }

  @objc private func toggleAutoReplace() {
    if !autoReplaceEnabled && !isAccessibilityTrusted(prompt: true) {
      updateStatus("Waiting for Accessibility permission")
      return
    }

    autoReplaceEnabled.toggle()
    updateStatus(autoReplaceEnabled ? "Auto replace enabled" : "Auto replace disabled")
  }

  @objc private func convertCurrentSelectionNow() {
    if !isAccessibilityTrusted(prompt: true) {
      updateStatus("Waiting for Accessibility permission")
      return
    }

    processCurrentSelection(trigger: "manual")
  }

  @objc private func toggleRedaction() {
    redactEnabled.toggle()
    updateStatus(redactEnabled ? "Redaction enabled" : "Redaction disabled")
  }

  @objc private func togglePreserveClipboard() {
    preserveClipboard.toggle()
    updateStatus(preserveClipboard ? "Clipboard preserved" : "Clipboard not restored")
  }

  @objc private func setMode(_ item: NSMenuItem) {
    mode = item.representedObject as? String ?? "auto"
    updateStatus("Mode: \(mode)")
  }

  @objc private func requestAccessibilityPermission() {
    _ = isAccessibilityTrusted(prompt: true)
    updateStatus("Check macOS Accessibility permission")
  }

  @objc private func quit() {
    NSApp.terminate(nil)
  }

  private func processCurrentSelection(trigger: String) {
    guard !isProcessing else {
      return
    }

    isProcessing = true

    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      guard let self else {
        return
      }

      defer {
        DispatchQueue.main.async {
          self.isProcessing = false
        }
      }

      let originalClipboard = readPasteboardText()
      let selectedText = readSelectedTextUsingAccessibility()
        ?? readSelectedTextUsingCopyFallback(originalClipboard: originalClipboard)
        ?? ""
      let normalizedSelection = selectedText.trimmingCharacters(in: .whitespacesAndNewlines)

      guard containsArabic(normalizedSelection) else {
        if trigger == "manual" {
          self.updateStatusOnMain("No Arabic selection found")
        }

        return
      }

      if trigger == "auto" && self.shouldSkipDuplicate(normalizedSelection) {
        return
      }

      do {
        let converted = try runPromptBridgeCLI(
          input: normalizedSelection,
          mode: self.mode,
          redact: self.redactEnabled
        )

        guard !converted.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
          self.updateStatusOnMain("PromptBridge returned empty output")
          return
        }

        writePasteboardText(converted)
        Thread.sleep(forTimeInterval: pasteDelay)
        sendCommandKey(virtualKey: 9)

        if self.preserveClipboard {
          Thread.sleep(forTimeInterval: pasteDelay)
          writePasteboardText(originalClipboard)
        }

        self.rememberProcessed(normalizedSelection)
        self.updateStatusOnMain("Converted selected Arabic")
      } catch {
        self.updateStatusOnMain("CLI error: \(error.localizedDescription)")
      }
    }
  }

  private func shouldSkipDuplicate(_ selectedText: String) -> Bool {
    let now = Date()
    return selectedText == lastInput && now.timeIntervalSince(lastProcessedAt) < processingCooldown
  }

  private func rememberProcessed(_ selectedText: String) {
    lastInput = selectedText
    lastProcessedAt = Date()
  }

  private func updateStatus(_ status: String) {
    lastStatus = status
    rebuildMenu()
  }

  private func updateStatusOnMain(_ status: String) {
    DispatchQueue.main.async {
      self.updateStatus(status)
    }
  }
}

@main
private enum PromptBridgeMenuBarLauncher {
  private static var appDelegate: PromptBridgeMenuBarApp?

  static func main() {
    let app = NSApplication.shared
    let delegate = PromptBridgeMenuBarApp()

    appDelegate = delegate
    app.setActivationPolicy(.accessory)
    app.delegate = delegate
    app.run()
  }
}

private func isAccessibilityTrusted(prompt: Bool) -> Bool {
  let options = [
    kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: prompt
  ] as CFDictionary

  return AXIsProcessTrustedWithOptions(options)
}

private func readSelectedTextUsingAccessibility() -> String? {
  let systemWide = AXUIElementCreateSystemWide()
  var focusedRef: CFTypeRef?
  let focusedResult = AXUIElementCopyAttributeValue(
    systemWide,
    kAXFocusedUIElementAttribute as CFString,
    &focusedRef
  )

  guard focusedResult == .success, let focusedElement = focusedRef else {
    return nil
  }

  var selectedRef: CFTypeRef?
  let selectedResult = AXUIElementCopyAttributeValue(
    focusedElement as! AXUIElement,
    kAXSelectedTextAttribute as CFString,
    &selectedRef
  )

  guard selectedResult == .success else {
    return nil
  }

  return selectedRef as? String
}

private func readSelectedTextUsingCopyFallback(originalClipboard: String) -> String? {
  let originalChangeCount = NSPasteboard.general.changeCount
  sendCommandKey(virtualKey: 8)
  let startedAt = Date()

  while Date().timeIntervalSince(startedAt) < copyTimeout {
    Thread.sleep(forTimeInterval: clipboardPoll)

    if NSPasteboard.general.changeCount == originalChangeCount {
      continue
    }

    let latestText = readPasteboardText()

    if !latestText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
      return latestText
    }
  }

  return nil
}

private func runPromptBridgeCLI(input: String, mode: String, redact: Bool) throws -> String {
  let process = Process()
  let outputPipe = Pipe()
  let errorPipe = Pipe()
  let bundledConverter = Bundle.main.resourceURL?.appendingPathComponent("promptbridge-convert.mjs")
  let hasBundledConverter = bundledConverter.map {
    FileManager.default.fileExists(atPath: $0.path)
  } ?? false
  var commandParts = hasBundledConverter
    ? ["node", "\"$1\""]
    : ["promptbridge"]

  if mode != "auto" {
    commandParts.append("--mode \(mode)")
  }

  if redact {
    commandParts.append("--redact")
  }

  commandParts.append(hasBundledConverter ? "\"$2\"" : "\"$1\"")

  process.executableURL = URL(fileURLWithPath: "/bin/zsh")
  process.arguments = hasBundledConverter
    ? [
      "-lc",
      commandParts.joined(separator: " "),
      "promptbridge-menubar",
      bundledConverter?.path ?? "",
      input
    ]
    : ["-lc", commandParts.joined(separator: " "), "promptbridge-menubar", input]
  process.standardOutput = outputPipe
  process.standardError = errorPipe

  try process.run()
  process.waitUntilExit()

  let output = String(data: outputPipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
  let error = String(data: errorPipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""

  if process.terminationStatus != 0 {
    throw PromptBridgeMenuBarError.commandFailed(error.trimmingCharacters(in: .whitespacesAndNewlines))
  }

  return output.trimmingCharacters(in: .whitespacesAndNewlines)
}

private func readPasteboardText() -> String {
  NSPasteboard.general.string(forType: .string) ?? ""
}

private func writePasteboardText(_ text: String) {
  NSPasteboard.general.clearContents()
  NSPasteboard.general.setString(text, forType: .string)
}

private func containsArabic(_ text: String) -> Bool {
  let range = NSRange(text.startIndex..<text.endIndex, in: text)
  return arabicPattern.firstMatch(in: text, range: range) != nil
}

private func sendCommandKey(virtualKey: CGKeyCode) {
  let source = CGEventSource(stateID: .hidSystemState)
  let keyDown = CGEvent(keyboardEventSource: source, virtualKey: virtualKey, keyDown: true)
  let keyUp = CGEvent(keyboardEventSource: source, virtualKey: virtualKey, keyDown: false)

  keyDown?.flags = .maskCommand
  keyUp?.flags = .maskCommand
  keyDown?.post(tap: .cghidEventTap)
  keyUp?.post(tap: .cghidEventTap)
}

private enum PromptBridgeMenuBarError: LocalizedError {
  case commandFailed(String)

  var errorDescription: String? {
    switch self {
    case .commandFailed(let message):
      return message.isEmpty
        ? "PromptBridge conversion failed. Make sure Node.js is available in your login shell."
        : message
    }
  }
}
