import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("GUI integration metadata", () => {
  it("keeps the browser extension manifest aligned with the package version", async () => {
    const packageJson = JSON.parse(
      await readFile(new URL("../package.json", import.meta.url), "utf8")
    ) as { version: string };
    const manifest = JSON.parse(
      await readFile(
        new URL("../extensions/browser/manifest.json", import.meta.url),
        "utf8"
      )
    ) as {
      version: string;
      permissions: string[];
      content_scripts: Array<{ js: string[] }>;
    };

    expect(manifest.version).toBe(packageJson.version);
    expect(manifest.permissions).toContain("contextMenus");
    expect(manifest.content_scripts[0]?.js).toContain("dist/content.js");
  });

  it("keeps the Raycast helper wired to selected-text replacement", async () => {
    const script = await readFile(
      new URL(
        "../extensions/raycast/promptbridge-replace-selection.sh",
        import.meta.url
      ),
      "utf8"
    );

    expect(script).toContain("# @raycast.schemaVersion 1");
    expect(script).toContain("promptbridge replace-selection --redact --quiet");
  });
});
