import { usePlugin } from "../context/PluginContext";

export function useTags(): string[] {
	const { plugin } = usePlugin();
	return plugin.timelineIndex.getAvailableTags();
}
