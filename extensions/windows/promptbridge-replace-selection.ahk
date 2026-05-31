#Requires AutoHotkey v2.0
#SingleInstance Force

; PromptBridge Arabic selected-text replacement for Windows.
; Select Arabic text in any editable prompt box, then press Ctrl+Alt+Y.
^!y::RunWait('powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "promptbridge replace-selection --redact --quiet"', , "Hide")
