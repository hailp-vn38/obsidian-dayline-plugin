export class TFile {
	path = "";
	extension = "md";
	stat = {
		ctime: 0,
		mtime: 0,
		size: 0,
	};
}

export class TFolder {
	path = "";
	children: Array<TFile | TFolder> = [];
}

export class App {}

export class Notice {}

export function normalizePath(path: string): string {
	return path.replace(/\\/g, "/").replace(/\/{2,}/g, "/");
}
