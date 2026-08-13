export function normalizeVaultPath(path: string): string {
	return path
		.trim()
		.replace(/\\/g, "/")
		.replace(/\/{2,}/g, "/")
		.replace(/^\/+|\/+$/g, "");
}

export function isPathInFolder(path: string, folderPath: string): boolean {
	const normalizedPath = normalizeVaultPath(path);
	const normalizedFolder = normalizeVaultPath(folderPath);
	if (!normalizedPath || !normalizedFolder) {
		return false;
	}

	return (
		normalizedPath === normalizedFolder ||
		normalizedPath.startsWith(`${normalizedFolder}/`)
	);
}

export function isTimelineMarkdownPath(
	path: string,
	timelineFolder: string,
): boolean {
	const normalizedPath = normalizeVaultPath(path);
	return (
		normalizedPath.toLowerCase().endsWith(".md") &&
		isPathInFolder(normalizedPath, timelineFolder)
	);
}
