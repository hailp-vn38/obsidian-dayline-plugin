import { createContext, useContext } from "react";
import type PersonalTimelinePlugin from "../main";
import type { App } from "obsidian";

export interface PluginContextType {
	plugin: PersonalTimelinePlugin;
	app: App;
}

export const PluginContext = createContext<PluginContextType | undefined>(
	undefined,
);

export function usePlugin(): PluginContextType {
	const context = useContext(PluginContext);
	if (!context) {
		throw new Error(
			"usePlugin must be used within a PluginContextProvider",
		);
	}
	return context;
}
