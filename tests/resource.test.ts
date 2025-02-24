import { describe, expect, it, jest } from "bun:test";
import { createResource } from "../src/index"; // Adjust the import path if necessary

describe("Resource Builder", () => {
  it("creates and retrieve an action", async () => {
    const resource = createResource("TestResource")
      .createAction("sayHello", async (name: string) => `Hello, ${name}!`)
      .build();

    const action = resource.getAction("sayHello");

    expect(action).toBeDefined();
    expect(await action!("Bun")).toBe("Hello, Bun!");
  });

  it("sets the context and returns it on the resource", async () => {
    const resource = createResource("TestResource")
      .setContext({ name: "Bun" })
      .build();

    expect(resource.context).toEqual({ name: "Bun" });
  });

  it("overrides the context if set multiple times", async () => {
    const resource = createResource("TestResource")
      .setContext({ name: "Bun" })
      .setContext({ name: "Bunny" })
      .build();

    expect(resource.context).toEqual({ name: "Bunny" });
  });

  it("uses context to create an action", async () => {
    const resource = createResource("TestResource")
      .setContext({ name: "Bun" })
      .createAction("sayHello", async (ctx) => `Hello, ${ctx.name}!`)
      .build();

    const result = await resource.callAction("sayHello");

    expect(result).toBe("Hello, Bun!");
  });

  it("returns an empty context if not set", async () => {
    const resource = createResource("TestResource").build();

    expect(resource.context).toEqual({});
  });

  it("calls an action and return expected output", async () => {
    const resource = createResource("TestResource")
      .createAction("double", async (_ctx, num: number) => num * 2)
      .build();

    const result = await resource.callAction("double", 5);
    expect(result).toBe(10);
  });

  it("throws an error if calling a non-existent action", async () => {
    const resource = createResource("TestResource").build();

    await expect(
      // @ts-ignore
      resource.callAction("nonExistentAction")
    ).rejects.toThrow("Action nonExistentAction not found");
  });

  it("executes registered notifiers on action call", async () => {
    const mockNotifier = jest.fn();
    const resource = createResource("TestResource")
      .createAction("increment", async (_ctx, num: number) => num + 1)
      .addNotifier(mockNotifier)
      .build();

    await resource.callAction("increment", 10);

    expect(mockNotifier).toHaveBeenCalledWith("increment", 11);
  });

  it("allows chaining multiple actions", async () => {
    const resource = createResource("TestResource")
      .createAction("square", async (_ctx, x: number) => x * x)
      .createAction("cube", async (_ctx, x: number) => x * x * x)
      .build();

    expect(await resource.callAction("square", 3)).toBe(9);
    expect(await resource.callAction("cube", 2)).toBe(8);
  });

  it("allows multiple notifiers to be executed", async () => {
    const notifier1 = jest.fn();
    const notifier2 = jest.fn();
    const resource = createResource("TestResource")
      .createAction("multiply", async (_ctx, a: number, b: number) => a * b)
      .addNotifier(notifier1)
      .addNotifier(notifier2)
      .build();

    await resource.callAction("multiply", 3, 4);

    expect(notifier1).toHaveBeenCalledWith("multiply", 12);
    expect(notifier2).toHaveBeenCalledWith("multiply", 12);
  });
});
