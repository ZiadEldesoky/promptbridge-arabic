import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/loadConfig.js";

describe("loadConfig", () => {
  it("returns an empty config when no config file exists", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "promptbridge-empty-"));
    const homeDir = await mkdtemp(join(tmpdir(), "promptbridge-home-"));

    await expect(loadConfig({ cwd, homeDir })).resolves.toEqual({
      config: {},
      glossaryEntries: []
    });
  });

  it("loads default options from a project config file", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "promptbridge-config-"));
    const homeDir = await mkdtemp(join(tmpdir(), "promptbridge-home-"));
    const configPath = join(cwd, ".promptbridge.json");

    await writeFile(
      configPath,
      JSON.stringify({
        defaultMode: "security",
        defaultOutput: "bilingual",
        redactSecrets: true
      })
    );

    const result = await loadConfig({ cwd, homeDir });

    expect(result.configPath).toBe(configPath);
    expect(result.config.defaultMode).toBe("security");
    expect(result.config.defaultOutput).toBe("bilingual");
    expect(result.config.redactSecrets).toBe(true);
  });

  it("loads custom glossary entries relative to the config file", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "promptbridge-glossary-"));
    const homeDir = await mkdtemp(join(tmpdir(), "promptbridge-home-"));

    await writeFile(
      join(cwd, "promptbridge.glossary.json"),
      JSON.stringify([
        {
          arabic: "راجع الصلاحيات",
          english: "review authorization rules",
          tags: ["security"]
        }
      ])
    );
    await writeFile(
      join(cwd, "promptbridge.config.json"),
      JSON.stringify({
        glossaryPath: "./promptbridge.glossary.json"
      })
    );

    const result = await loadConfig({ cwd, homeDir });

    expect(result.glossaryEntries).toEqual([
      {
        arabic: "راجع الصلاحيات",
        english: "review authorization rules",
        tags: ["security"]
      }
    ]);
  });

  it("loads object-style glossary files", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "promptbridge-object-glossary-"));
    const homeDir = await mkdtemp(join(tmpdir(), "promptbridge-home-"));

    await writeFile(
      join(cwd, "custom.json"),
      JSON.stringify({
        "راجع الصلاحيات": "review authorization rules"
      })
    );
    await writeFile(
      join(cwd, ".promptbridge.json"),
      JSON.stringify({ glossaryPath: "./custom.json" })
    );

    const result = await loadConfig({ cwd, homeDir });

    expect(result.glossaryEntries).toEqual([
      {
        arabic: "راجع الصلاحيات",
        english: "review authorization rules",
        tags: ["custom"]
      }
    ]);
  });

  it("loads global config when no project config exists", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "promptbridge-no-project-"));
    const homeDir = await mkdtemp(join(tmpdir(), "promptbridge-global-home-"));
    const globalConfigDir = join(homeDir, ".promptbridge");

    await mkdir(globalConfigDir);
    await writeFile(
      join(globalConfigDir, "config.json"),
      JSON.stringify({ defaultMode: "tests" })
    );

    const result = await loadConfig({ cwd, homeDir });

    expect(result.config.defaultMode).toBe("tests");
  });
});
