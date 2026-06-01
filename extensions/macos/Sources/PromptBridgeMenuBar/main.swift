import AppKit
import ApplicationServices

private let copyTimeout: TimeInterval = 1.0
private let clipboardPoll: TimeInterval = 0.05
private let pasteDelay: TimeInterval = 0.3
private let processingCooldown: TimeInterval = 1.2
private let latestReleaseApiURL = URL(
  string: "https://api.github.com/repos/ZiadEldesoky/promptbridge-arabic/releases/latest"
)!
private let latestTagApiURL = URL(
  string: "https://api.github.com/repos/ZiadEldesoky/promptbridge-arabic/tags?per_page=1"
)!
private let latestReleasePageURL = URL(
  string: "https://github.com/ZiadEldesoky/promptbridge-arabic/releases/latest"
)!
private let tagsPageURL = URL(
  string: "https://github.com/ZiadEldesoky/promptbridge-arabic/tags"
)!

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
  private var isCheckingForUpdates = false
  private var eventMonitor: Any?
  private var allowTermination = false
  private var activity: NSObjectProtocol?
  private var keepAliveTimer: Timer?

  func applicationDidFinishLaunching(_ notification: Notification) {
    ProcessInfo.processInfo.disableAutomaticTermination("PromptBridge runs as a persistent menu bar helper.")
    ProcessInfo.processInfo.disableSuddenTermination()
    activity = ProcessInfo.processInfo.beginActivity(
      options: [.userInitiated],
      reason: "PromptBridge menu bar helper is active."
    )
    keepAliveTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { _ in }
    writeDebugLog("launch trusted=\(isAccessibilityTrusted(prompt: false)) path=\(Bundle.main.bundlePath)")

    NSApp.setActivationPolicy(.accessory)
    setupStatusItem()
    installSelectionMonitor()
  }

  func applicationWillTerminate(_ notification: Notification) {
    if let eventMonitor {
      NSEvent.removeMonitor(eventMonitor)
    }

    keepAliveTimer?.invalidate()

    if let activity {
      ProcessInfo.processInfo.endActivity(activity)
    }
  }

  func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
    if allowTermination {
      writeDebugLog("applicationShouldTerminate allowed")
      return .terminateNow
    }

    writeDebugLog("applicationShouldTerminate cancelled")
    return .terminateCancel
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
    for promptMode in ["auto", "general", "fix", "refactor", "review", "tests", "explain", "security"] {
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

    let checkUpdates = NSMenuItem(
      title: "Check for Updates",
      action: #selector(checkForUpdates),
      keyEquivalent: ""
    )
    checkUpdates.target = self
    checkUpdates.isEnabled = !isCheckingForUpdates
    menu.addItem(checkUpdates)

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
    guard autoReplaceEnabled else {
      return
    }

    guard isAccessibilityTrusted(prompt: false) else {
      updateStatus("Accessibility permission needed")
      writeDebugLog("schedule skipped reason=not-trusted")
      return
    }

    writeDebugLog("scheduleAutoReplacement")
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) { [weak self] in
      self?.processCurrentSelection(trigger: "auto")
    }
  }

  @objc private func toggleAutoReplace() {
    let trusted = isAccessibilityTrusted(prompt: true)
    writeDebugLog("toggleAutoReplace current=\(autoReplaceEnabled) trusted=\(trusted)")

    if !autoReplaceEnabled && !trusted {
      updateStatus("Waiting for Accessibility permission")
      return
    }

    autoReplaceEnabled.toggle()
    updateStatus(autoReplaceEnabled ? "Auto replace enabled" : "Auto replace disabled")

    if autoReplaceEnabled {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { [weak self] in
        self?.processCurrentSelection(trigger: "auto-enable")
      }
    }
  }

  @objc private func convertCurrentSelectionNow() {
    let trusted = isAccessibilityTrusted(prompt: true)
    writeDebugLog("convertCurrentSelectionNow trusted=\(trusted)")

    if !trusted {
      updateStatus("Waiting for Accessibility permission")
      return
    }

    updateStatus("Converting current selection")
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) { [weak self] in
      self?.processCurrentSelection(trigger: "manual")
    }
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

  @objc private func checkForUpdates() {
    guard !isCheckingForUpdates else {
      return
    }

    isCheckingForUpdates = true
    updateStatus("Checking for updates")

    var request = URLRequest(url: latestReleaseApiURL)
    request.timeoutInterval = 10
    request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
    request.setValue(
      "PromptBridgeArabicMenuBar/\(currentAppVersion())",
      forHTTPHeaderField: "User-Agent"
    )

    URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
      DispatchQueue.main.async {
        guard let self else {
          return
        }

        if let error {
          self.checkLatestTag(
            preferredVersion: nil,
            preferredURL: nil,
            fallbackError: error.localizedDescription
          )
          return
        }

        guard
          let httpResponse = response as? HTTPURLResponse,
          (200...299).contains(httpResponse.statusCode),
          let data,
          let release = try? JSONDecoder().decode(GitHubRelease.self, from: data),
          let latestVersion = release.normalizedVersion
        else {
          self.checkLatestTag(
            preferredVersion: nil,
            preferredURL: nil,
            fallbackError: "GitHub did not return a readable latest release."
          )
          return
        }

        self.checkLatestTag(
          preferredVersion: latestVersion,
          preferredURL: release.releaseURL ?? latestReleasePageURL,
          fallbackError: nil
        )
      }
    }.resume()
  }

  private func checkLatestTag(
    preferredVersion: String?,
    preferredURL: URL?,
    fallbackError: String?
  ) {
    var request = URLRequest(url: latestTagApiURL)
    request.timeoutInterval = 10
    request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
    request.setValue(
      "PromptBridgeArabicMenuBar/\(currentAppVersion())",
      forHTTPHeaderField: "User-Agent"
    )

    URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
      DispatchQueue.main.async {
        guard let self else {
          return
        }

        if let error {
          if let preferredVersion, let preferredURL {
            self.finishUpdateCheck(
              latestVersion: preferredVersion,
              releaseURL: preferredURL
            )
            return
          }

          self.finishFailedUpdateCheck(
            "\(fallbackError ?? "GitHub Releases could not be checked.")\n\(error.localizedDescription)"
          )
          return
        }

        guard
          let httpResponse = response as? HTTPURLResponse,
          (200...299).contains(httpResponse.statusCode),
          let data,
          let latestTag = try? JSONDecoder().decode([GitHubTag].self, from: data).first,
          let tagVersion = latestTag.normalizedVersion
        else {
          if let preferredVersion, let preferredURL {
            self.finishUpdateCheck(
              latestVersion: preferredVersion,
              releaseURL: preferredURL
            )
            return
          }

          self.finishFailedUpdateCheck(
            fallbackError ?? "GitHub did not return a readable release or tag."
          )
          return
        }

        if let preferredVersion,
           let preferredURL,
           compareVersions(preferredVersion, tagVersion) >= 0 {
          self.finishUpdateCheck(
            latestVersion: preferredVersion,
            releaseURL: preferredURL
          )
          return
        }

        self.finishUpdateCheck(latestVersion: tagVersion, releaseURL: tagsPageURL)
      }
    }.resume()
  }

  private func finishUpdateCheck(latestVersion: String, releaseURL: URL) {
    isCheckingForUpdates = false

    let currentVersion = currentAppVersion()

    if compareVersions(latestVersion, currentVersion) > 0 {
      updateStatus("Update available: \(latestVersion)")
      showUpdateAvailable(
        currentVersion: currentVersion,
        latestVersion: latestVersion,
        releaseURL: releaseURL
      )
      return
    }

    updateStatus("Up to date")
    showUpToDate(currentVersion: currentVersion, releaseURL: releaseURL)
  }

  private func finishFailedUpdateCheck(_ message: String) {
    isCheckingForUpdates = false
    updateStatus("Update check failed")
    showUpdateCheckFailed(message)
  }

  @objc private func quit() {
    allowTermination = true
    NSApp.terminate(nil)
  }

  private func processCurrentSelection(trigger: String) {
    guard !isProcessing else {
      writeDebugLog("process skipped trigger=\(trigger) reason=busy")
      return
    }

    isProcessing = true
    writeDebugLog("process start trigger=\(trigger)")

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
      let selectedText = readSelectedTextUsingCopyFallback(originalClipboard: originalClipboard)
        ?? readSelectedTextUsingAccessibility()
        ?? ""
      let normalizedSelection = selectedText.trimmingCharacters(in: .whitespacesAndNewlines)

      guard containsArabic(normalizedSelection) else {
        writeDebugLog("process no-arabic trigger=\(trigger) length=\(normalizedSelection.count)")

        if trigger == "manual" || trigger == "auto-enable" {
          self.updateStatusOnMain("No Arabic selection found")
        }

        return
      }

      writeDebugLog("process selected-arabic trigger=\(trigger) length=\(normalizedSelection.count)")

      if trigger.hasPrefix("auto") && self.shouldSkipDuplicate(normalizedSelection) {
        writeDebugLog("process skipped trigger=\(trigger) reason=duplicate")
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
        writeDebugLog("process converted trigger=\(trigger) outputLength=\(converted.count)")
      } catch {
        self.updateStatusOnMain("CLI error: \(error.localizedDescription)")
        writeDebugLog("process error trigger=\(trigger) message=\(error.localizedDescription)")
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

  private func showUpdateAvailable(
    currentVersion: String,
    latestVersion: String,
    releaseURL: URL
  ) {
    let alert = NSAlert()
    alert.messageText = "PromptBridge Arabic update available"
    alert.informativeText = "Installed: \(currentVersion)\nLatest: \(latestVersion)\n\nOpen the release page to download the newest build."
    alert.addButton(withTitle: "Open Release")
    alert.addButton(withTitle: "Later")

    NSApp.activate(ignoringOtherApps: true)
    if alert.runModal() == .alertFirstButtonReturn {
      NSWorkspace.shared.open(releaseURL)
    }
  }

  private func showUpToDate(currentVersion: String, releaseURL: URL) {
    let alert = NSAlert()
    alert.messageText = "PromptBridge Arabic is up to date"
    alert.informativeText = "Installed version: \(currentVersion)"
    alert.addButton(withTitle: "OK")
    alert.addButton(withTitle: "Open Releases")

    NSApp.activate(ignoringOtherApps: true)
    if alert.runModal() == .alertSecondButtonReturn {
      NSWorkspace.shared.open(releaseURL)
    }
  }

  private func showUpdateCheckFailed(_ message: String) {
    let alert = NSAlert()
    alert.messageText = "Could not check for updates"
    alert.informativeText = "\(message)\n\nYou can open GitHub Releases manually."
    alert.addButton(withTitle: "Open Releases")
    alert.addButton(withTitle: "OK")

    NSApp.activate(ignoringOtherApps: true)
    if alert.runModal() == .alertFirstButtonReturn {
      NSWorkspace.shared.open(latestReleasePageURL)
    }
  }
}

private struct GitHubRelease: Decodable {
  let tagName: String?
  let htmlURL: URL?

  enum CodingKeys: String, CodingKey {
    case tagName = "tag_name"
    case htmlURL = "html_url"
  }

  var normalizedVersion: String? {
    guard let tagName else {
      return nil
    }

    return normalizeVersion(tagName)
  }

  var releaseURL: URL? {
    htmlURL
  }
}

private struct GitHubTag: Decodable {
  let name: String?

  var normalizedVersion: String? {
    guard let name else {
      return nil
    }

    return normalizeVersion(name)
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
  writeDebugLog("read accessibility start")
  let systemWide = AXUIElementCreateSystemWide()
  var focusedRef: CFTypeRef?
  let focusedResult = AXUIElementCopyAttributeValue(
    systemWide,
    kAXFocusedUIElementAttribute as CFString,
    &focusedRef
  )

  guard focusedResult == .success, let focusedElement = focusedRef else {
    writeDebugLog("read accessibility no-focused result=\(focusedResult.rawValue)")
    return nil
  }

  var selectedRef: CFTypeRef?
  let selectedResult = AXUIElementCopyAttributeValue(
    focusedElement as! AXUIElement,
    kAXSelectedTextAttribute as CFString,
    &selectedRef
  )

  guard selectedResult == .success else {
    writeDebugLog("read accessibility no-selected result=\(selectedResult.rawValue)")
    return nil
  }

  let selected = selectedRef as? String
  writeDebugLog("read accessibility selectedLength=\(selected?.count ?? 0)")
  return selected
}

private func readSelectedTextUsingCopyFallback(originalClipboard: String) -> String? {
  writeDebugLog("read copy start originalLength=\(originalClipboard.count)")
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
      writeDebugLog("read copy selectedLength=\(latestText.count)")
      return latestText
    }
  }

  writeDebugLog("read copy timeout")
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

private func writeDebugLog(_ message: String) {
  let logURL = FileManager.default.homeDirectoryForCurrentUser
    .appendingPathComponent("Library/Logs/PromptBridgeArabicMenuBar.log")
  let timestamp = ISO8601DateFormatter().string(from: Date())
  guard let data = "\(timestamp) \(message)\n".data(using: .utf8) else {
    return
  }

  try? FileManager.default.createDirectory(
    at: logURL.deletingLastPathComponent(),
    withIntermediateDirectories: true
  )

  if FileManager.default.fileExists(atPath: logURL.path),
     let handle = try? FileHandle(forWritingTo: logURL) {
    handle.seekToEndOfFile()
    handle.write(data)
    try? handle.close()
    return
  }

  try? data.write(to: logURL)
}

private func containsArabic(_ text: String) -> Bool {
  text.unicodeScalars.contains { scalar in
    switch scalar.value {
    case 0x0600...0x06FF,
         0x0750...0x077F,
         0x08A0...0x08FF,
         0xFB50...0xFDFF,
         0xFE70...0xFEFF:
      return true
    default:
      return false
    }
  }
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

private func currentAppVersion() -> String {
  normalizeVersion(
    Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0.0"
  )
}

private func normalizeVersion(_ version: String) -> String {
  version
    .trimmingCharacters(in: .whitespacesAndNewlines)
    .replacingOccurrences(
      of: #"^[vV]"#,
      with: "",
      options: .regularExpression
    )
    .split(separator: "-")
    .first
    .map(String.init) ?? version
}

private func compareVersions(_ left: String, _ right: String) -> Int {
  let leftParts = versionParts(left)
  let rightParts = versionParts(right)
  let length = max(leftParts.count, rightParts.count)

  for index in 0..<length {
    let leftPart = index < leftParts.count ? leftParts[index] : 0
    let rightPart = index < rightParts.count ? rightParts[index] : 0

    if leftPart > rightPart {
      return 1
    }

    if leftPart < rightPart {
      return -1
    }
  }

  return 0
}

private func versionParts(_ version: String) -> [Int] {
  normalizeVersion(version)
    .split(separator: ".")
    .map { part in
      let digits = part.prefix { character in
        character.isNumber
      }

      return Int(String(digits)) ?? 0
    }
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
