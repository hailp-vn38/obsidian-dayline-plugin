import { afterEach, describe, expect, it, vi } from "vitest";

import { TFile, type App, type Plugin } from "obsidian";
import { TimelineEventCoordinator } from "../src/index/TimelineEventCoordinator";
import type { TimelineIndexService } from "../src/index/TimelineIndexService";
import { DEFAULT_SETTINGS } from "../src/settings/settings";

type VaultHandler = (file: TFile, oldPath?: string) => void;

describe("TimelineEventCoordinator", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("ignores files outside Dayline and batches relevant updates", async () => {
		vi.useFakeTimers();
		vi.stubGlobal("window", {
			setTimeout,
			clearTimeout,
		});
		const handlers = new Map<string, VaultHandler>();
		const app = {
			vault: {
				on: vi.fn((event: string, handler: VaultHandler) => {
					handlers.set(event, handler);
					return { event };
				}),
			},
		} as unknown as App;
		const plugin = {
			registerEvent: vi.fn(),
		} as unknown as Plugin;
		const refreshFile = vi.fn().mockResolvedValue(true);
		const index = {
			whenReady: vi.fn().mockResolvedValue(undefined),
			refreshFile,
			removeByPathPrefixes: vi.fn().mockReturnValue(false),
			rebuild: vi.fn().mockResolvedValue(undefined),
		} as unknown as TimelineIndexService;
		const onIndexChanged = vi.fn().mockResolvedValue(undefined);
		const coordinator = new TimelineEventCoordinator({
			app,
			plugin,
			settings: { ...DEFAULT_SETTINGS },
			index,
			onIndexChanged,
			invalidateReadingCache: vi.fn(),
		});
		coordinator.register();

		const outsideFile = new TFile();
		outsideFile.path = "Notes/outside.md";
		handlers.get("modify")?.(outsideFile);
		await vi.runAllTimersAsync();
		expect(refreshFile).not.toHaveBeenCalled();

		const timelineFile = new TFile();
		timelineFile.path = "Timeline/2026/08/13.md";
		handlers.get("modify")?.(timelineFile);
		handlers.get("modify")?.(timelineFile);
		await vi.runAllTimersAsync();
		expect(refreshFile).toHaveBeenCalledTimes(1);
		expect(onIndexChanged).toHaveBeenCalledTimes(1);
		coordinator.dispose();
	});
});
