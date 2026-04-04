import { App, Modal, Notice, TFile, normalizePath } from 'obsidian';
import HymnaryPlugin from './main';
import { searchHymns, fetchLyrics, HymnResult } from './hymnary';

export class HymnSearchModal extends Modal {
	private plugin: HymnaryPlugin;
	private searchInput: HTMLInputElement;
	private resultsContainer: HTMLDivElement;
	private loadingEl: HTMLDivElement;

	constructor(app: App, plugin: HymnaryPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass('hymnary-modal');

		contentEl.createEl('h2', { text: 'Search Hymnary.org' });

		// Search row
		const searchRow = contentEl.createDiv({ cls: 'hymnary-search-row' });
		this.searchInput = searchRow.createEl('input', {
			type: 'text',
			placeholder: 'Search for a hymn…',
			cls: 'hymnary-search-input',
		});
		const searchBtn = searchRow.createEl('button', {
			text: 'Search',
			cls: 'hymnary-search-btn mod-cta',
		});

		// Loading indicator
		this.loadingEl = contentEl.createDiv({ cls: 'hymnary-loading' });
		this.loadingEl.createSpan({ cls: 'hymnary-loading-spinner' });
		this.loadingEl.createSpan({ text: 'Searching…', cls: 'hymnary-loading-text' });
		this.loadingEl.hide();

		// Results container
		this.resultsContainer = contentEl.createDiv({ cls: 'hymnary-results' });

		// Hint
		this.resultsContainer.createEl('p', {
			text: 'Enter a title, first line, or keyword to search.',
			cls: 'hymnary-hint',
		});

		// Event listeners
		searchBtn.addEventListener('click', () => { void this.doSearch(); });
		this.searchInput.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter') void this.doSearch();
		});

		this.searchInput.focus();
	}

	private async doSearch(): Promise<void> {
		const query = this.searchInput.value.trim();
		if (!query) return;

		this.resultsContainer.empty();
		this.loadingEl.querySelector<HTMLSpanElement>('.hymnary-loading-text')!.textContent = 'Searching…';
		this.loadingEl.show();

		try {
			const results = await searchHymns(query);
			this.loadingEl.hide();

			if (results.length === 0) {
				this.resultsContainer.createEl('p', {
					text: 'No results found. Try a different search term.',
					cls: 'hymnary-no-results',
				});
				return;
			}

			const limited = results.slice(0, this.plugin.settings.maxSearchResults);
			this.renderResults(limited, results.length);
		} catch (err) {
			this.loadingEl.hide();
			this.resultsContainer.createEl('p', {
				text: `Search failed: ${(err as Error).message}`,
				cls: 'hymnary-error',
			});
		}
	}

	private renderResults(results: HymnResult[], total: number): void {
		this.resultsContainer.empty();

		const count = this.resultsContainer.createEl('p', { cls: 'hymnary-count' });
		count.textContent =
			total > results.length
				? `Showing ${results.length} of ${total} results — click a hymn to import it.`
				: `${results.length} result${results.length === 1 ? '' : 's'} — click a hymn to import it.`;

		results.forEach(result => {
			const item = this.resultsContainer.createDiv({ cls: 'hymnary-result-item' });

			item.createEl('strong', {
				text: result.displayTitle || '(Untitled)',
				cls: 'hymnary-result-title',
			});

			const meta = item.createDiv({ cls: 'hymnary-result-meta' });

			if (result.authors) {
				meta.createSpan({ text: result.authors, cls: 'hymnary-result-author' });
			}
			if (result.firstLine) {
				meta.createEl('span', { text: ' · ', cls: 'hymnary-dot' });
				meta.createSpan({ text: result.firstLine, cls: 'hymnary-result-firstline' });
			}
			if (result.meter) {
				meta.createEl('span', { text: ` · ${result.meter}`, cls: 'hymnary-result-meter' });
			}

			item.addEventListener('click', () => { void this.importHymn(result); });
		});
	}

	private async importHymn(result: HymnResult): Promise<void> {
		this.resultsContainer.empty();
		this.loadingEl.querySelector<HTMLSpanElement>('.hymnary-loading-text')!.textContent =
			'Fetching lyrics…';
		this.loadingEl.show();

		try {
			const stanzas = await fetchLyrics(result.textAuthNumber);
			this.loadingEl.hide();

			const content = this.buildNoteContent(result, stanzas);
			await this.saveNote(result, content);
			this.close();
		} catch (err) {
			this.loadingEl.hide();
			new Notice(`Failed to import hymn: ${(err as Error).message}`);
			// Re-render results so user can try again — re-run search silently
			void this.doSearch();
		}
	}

	private buildNoteContent(result: HymnResult, stanzas: string[]): string {
		const yaml: string[] = ['---'];

		const esc = (s: string) => s.replace(/"/g, '\\"');

		yaml.push(`title: "${esc(result.displayTitle)}"`);
		if (result.authors) yaml.push(`author: "${esc(result.authors)}"`);
		if (result.firstLine) yaml.push(`first_line: "${esc(result.firstLine)}"`);
		if (result.meter) yaml.push(`meter: "${esc(result.meter)}"`);
		if (this.plugin.settings.includeHymnaryUrl && result.hymnaryUrl) {
			yaml.push(`source: "${result.hymnaryUrl}"`);
		}
		yaml.push('tags:');
		yaml.push('  - hymn');
		yaml.push('---');

		if (stanzas.length > 0) {
			stanzas.forEach((stanza, i) => {
				yaml.push(stanza);
				if (i < stanzas.length - 1) yaml.push('');
			});
		} else {
			yaml.push(
				`*Lyrics not available. Visit [Hymnary.org](${result.hymnaryUrl}) for the full text.*`
			);
		}

		yaml.push('');
		return yaml.join('\n');
	}

	private async saveNote(result: HymnResult, content: string): Promise<void> {
		const folder = normalizePath(this.plugin.settings.importFolder || 'Hymns');

		if (!this.app.vault.getAbstractFileByPath(folder)) {
			await this.app.vault.createFolder(folder);
		}

		const sanitizedTitle = result.displayTitle
			.replace(/[\\/:*?"<>|]/g, '')
			.trim()
			.slice(0, 100) || 'Untitled Hymn';

		const filePath = normalizePath(`${folder}/${sanitizedTitle}.md`);
		const existing = this.app.vault.getAbstractFileByPath(filePath);

		let file: TFile;
		if (existing instanceof TFile) {
			await this.app.vault.modify(existing, content);
			file = existing;
			new Notice(`✓ Updated: ${sanitizedTitle}`);
		} else {
			file = await this.app.vault.create(filePath, content);
			new Notice(`✓ Imported: ${sanitizedTitle}`);
		}

		if (this.plugin.settings.openAfterImport) {
			await this.app.workspace.getLeaf(false).openFile(file);
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
