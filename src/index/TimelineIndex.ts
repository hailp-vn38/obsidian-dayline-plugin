import type { TimelineIndexItem } from "../models/TimelineEntry";

export class TimelineIndex {
	private items = new Map<string, TimelineIndexItem>();
	private sortedSnapshot: TimelineIndexItem[] | null = null;

	getAll(): TimelineIndexItem[] {
		if (!this.sortedSnapshot) {
			this.sortedSnapshot = Array.from(this.items.values()).sort((left, right) =>
				right.createdAt.localeCompare(left.createdAt),
			);
		}
		return this.sortedSnapshot;
	}

	getById(id: string): TimelineIndexItem | null {
		return this.items.get(id) ?? null;
	}

	upsert(item: TimelineIndexItem): void {
		this.items.set(item.id, item);
		this.sortedSnapshot = null;
	}

	remove(id: string): void {
		if (this.items.delete(id)) {
			this.sortedSnapshot = null;
		}
	}

	clear(): void {
		this.items.clear();
		this.sortedSnapshot = null;
	}

	count(): number {
		return this.items.size;
	}
}
