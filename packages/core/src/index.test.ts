import { describe, expect, it } from "vitest";
import { ModuleRegistry, coreManifest } from "./index";

describe("ModuleRegistry", () => {
  it("rejects modules with missing dependencies", () => {
    const registry = new ModuleRegistry();
    expect(() =>
      registry.register({
        ...coreManifest,
        id: "sales",
        dependencies: ["core"]
      })
    ).toThrow("requires missing dependency");
  });

  it("sorts navigation by configured order", () => {
    const registry = new ModuleRegistry();
    registry.register(coreManifest);
    expect(registry.navigation()[0]?.label).toBe("Dashboard");
  });
});
