// swift-tools-version: 5.9

import PackageDescription

let package = Package(
  name: "PromptBridgeMenuBar",
  platforms: [
    .macOS(.v13)
  ],
  products: [
    .executable(
      name: "PromptBridgeMenuBar",
      targets: ["PromptBridgeMenuBar"]
    )
  ],
  targets: [
    .executableTarget(
      name: "PromptBridgeMenuBar"
    )
  ]
)
