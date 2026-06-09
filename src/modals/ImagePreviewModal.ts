import { Modal, setIcon, TFile } from "obsidian";

export class ImagePreviewModal extends Modal {
	constructor(
		app: ConstructorParameters<typeof Modal>[0],
		private readonly file: TFile,
		private readonly resourcePath: string,
		private readonly altText: string,
	) {
		super(app);
	}

	onOpen(): void {
		this.containerEl.addClass("pt-image-preview-container");
		this.modalEl.addClass("pt-image-preview-modal");
		this.contentEl.empty();

		const frame = this.contentEl.createDiv({
			cls: "pt-image-preview-frame",
		});
		const actions = frame.createDiv({
			cls: "pt-image-preview-actions",
		});

		const openButton = actions.createEl("button", {
			cls: "pt-image-preview-action",
			attr: {
				"aria-label": "Open image file",
				type: "button",
			},
		});
		setIcon(openButton, "external-link");
		openButton.addEventListener("click", () => {
			void this.app.workspace.getLeaf(true).openFile(this.file);
			this.close();
		});

		const closeButton = actions.createEl("button", {
			cls: "pt-image-preview-action",
			attr: {
				"aria-label": "Close image preview",
				type: "button",
			},
		});
		setIcon(closeButton, "x");
		closeButton.addEventListener("click", () => {
			this.close();
		});

		frame.createEl("img", {
			cls: "pt-image-preview-image",
			attr: {
				src: this.resourcePath,
				alt: this.altText,
			},
		});
	}

	onClose(): void {
		this.contentEl.empty();
		this.modalEl.removeClass("pt-image-preview-modal");
		this.containerEl.removeClass("pt-image-preview-container");
	}
}
