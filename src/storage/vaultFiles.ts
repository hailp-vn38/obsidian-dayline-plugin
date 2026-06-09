import { TFile, TFolder, type App } from "obsidian";

export function getMarkdownFilesInFolder(app: App, folderPath: string): TFile[] {
	const normalizedFolder = normalizeFolderPath(folderPath);
	if (!normalizedFolder) {
		return [];
	}

	const root = app.vault.getAbstractFileByPath(normalizedFolder);
	if (root instanceof TFile) {
		return root.extension === "md" ? [root] : [];
	}

	if (!(root instanceof TFolder)) {
		return [];
	}

	const files: TFile[] = [];
	collectMarkdownFiles(root, files);
	return files;
}

function collectMarkdownFiles(folder: TFolder, files: TFile[]): void {
	for (const child of folder.children) {
		if (child instanceof TFile) {
			if (child.extension === "md") {
				files.push(child);
			}
			continue;
		}

		if (child instanceof TFolder) {
			collectMarkdownFiles(child, files);
		}
	}
}

function normalizeFolderPath(folderPath: string): string {
	return folderPath.trim().replace(/^\/+|\/+$/g, "");
}
