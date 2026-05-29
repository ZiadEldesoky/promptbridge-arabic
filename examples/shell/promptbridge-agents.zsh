# Source this file once from your shell to make common CLI agents translate
# Arabic prompt arguments automatically before execution.
#
# Example:
#   source examples/shell/promptbridge-agents.zsh
#   codex "ظبطلي الكود دا وخليه responsive"

codex() {
  promptbridge run codex "$@"
}

claude() {
  promptbridge run claude "$@"
}

gemini() {
  promptbridge run gemini "$@"
}

cursor-agent() {
  promptbridge run cursor-agent "$@"
}
