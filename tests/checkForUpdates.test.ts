import { describe, expect, it } from "vitest";
import {
  checkForUpdates,
  compareVersions,
  normalizeVersion,
  tagsPageUrl
} from "../src/updates/checkForUpdates.js";

describe("checkForUpdates", () => {
  it("normalizes release tags", () => {
    expect(normalizeVersion("v0.11.9")).toBe("0.11.9");
    expect(normalizeVersion("0.11.9-beta.1")).toBe("0.11.9");
  });

  it("compares semantic version numbers", () => {
    expect(compareVersions("0.11.10", "0.11.9")).toBe(1);
    expect(compareVersions("0.11.8", "0.11.9")).toBe(-1);
    expect(compareVersions("0.11.9", "v0.11.9")).toBe(0);
  });

  it("detects when a newer GitHub release exists", async () => {
    const result = await checkForUpdates({
      currentVersion: "0.11.8",
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "v0.11.9",
          html_url:
            "https://github.com/ZiadEldesoky/promptbridge-arabic/releases/tag/v0.11.9"
        })
      })
    });

    expect(result.updateAvailable).toBe(true);
    expect(result.latestVersion).toBe("0.11.9");
    expect(result.releaseUrl).toContain("v0.11.9");
  });

  it("falls back to repository tags when no GitHub Release exists", async () => {
    const result = await checkForUpdates({
      currentVersion: "0.11.8",
      fetchImpl: async (url) => {
        if (url.includes("/releases/latest")) {
          return {
            ok: false,
            status: 404,
            json: async () => ({})
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => [{ name: "v0.11.9" }]
        };
      }
    });

    expect(result.updateAvailable).toBe(true);
    expect(result.latestVersion).toBe("0.11.9");
  });

  it("prefers a newer repository tag over an older latest release", async () => {
    const result = await checkForUpdates({
      currentVersion: "0.11.8",
      fetchImpl: async (url) => {
        if (url.includes("/releases/latest")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              tag_name: "v0.11.8",
              html_url:
                "https://github.com/ZiadEldesoky/promptbridge-arabic/releases/tag/v0.11.8"
            })
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => [{ name: "v0.11.9" }]
        };
      }
    });

    expect(result.updateAvailable).toBe(true);
    expect(result.latestVersion).toBe("0.11.9");
    expect(result.releaseUrl).toBe(tagsPageUrl);
  });

  it("returns a readable error when GitHub cannot be checked", async () => {
    const result = await checkForUpdates({
      currentVersion: "0.11.9",
      fetchImpl: async () => ({
        ok: false,
        status: 403,
        json: async () => ({})
      })
    });

    expect(result.updateAvailable).toBe(false);
    expect(result.error).toBe("GitHub Tags returned HTTP 403.");
    expect(result.releaseUrl).toBe(tagsPageUrl);
  });
});
