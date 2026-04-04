import { App, PluginSettingTab, Setting, TFolder, AbstractInputSuggest } from 'obsidian';
import HymnaryPlugin from './main';

class FolderSuggest extends AbstractInputSuggest<TFolder> {
	private inputEl: HTMLInputElement;

	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.inputEl = inputEl;
	}

	getSuggestions(query: string): TFolder[] {
		const lower = query.toLowerCase();
		return this.app.vault
			.getAllFolders()
			.filter(f => f.path.toLowerCase().includes(lower))
			.sort((a, b) => a.path.localeCompare(b.path));
	}

	renderSuggestion(folder: TFolder, el: HTMLElement): void {
		el.setText(folder.path);
	}

	selectSuggestion(folder: TFolder): void {
		this.inputEl.value = folder.path;
		this.inputEl.trigger('input');
		this.close();
	}
}

export interface HymnaryPluginSettings {
	importFolder: string;
	openAfterImport: boolean;
	includeHymnaryUrl: boolean;
	maxSearchResults: number;
}

export const DEFAULT_SETTINGS: HymnaryPluginSettings = {
	importFolder: 'Hymns',
	openAfterImport: true,
	includeHymnaryUrl: true,
	maxSearchResults: 20,
};

export class HymnarySettingTab extends PluginSettingTab {
	plugin: HymnaryPlugin;

	constructor(app: App, plugin: HymnaryPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Hymnary Import' });

		new Setting(containerEl)
			.setName('Import folder')
			.setDesc('Vault folder where imported hymns are saved.')
			.addText(text => {
				new FolderSuggest(this.app, text.inputEl);
				text
					.setPlaceholder('Hymns')
					.setValue(this.plugin.settings.importFolder)
					.onChange(async value => {
						this.plugin.settings.importFolder = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Open after import')
			.setDesc('Automatically open the hymn note after it is imported.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.openAfterImport)
				.onChange(async value => {
					this.plugin.settings.openAfterImport = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Include Hymnary.org URL')
			.setDesc('Add the source URL as a frontmatter property on the note.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeHymnaryUrl)
				.onChange(async value => {
					this.plugin.settings.includeHymnaryUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Max search results')
			.setDesc('Maximum number of results shown per search.')
			.addSlider(slider => slider
				.setLimits(5, 50, 5)
				.setValue(this.plugin.settings.maxSearchResults)
				.setDynamicTooltip()
				.onChange(async value => {
					this.plugin.settings.maxSearchResults = value;
					await this.plugin.saveSettings();
				}));
	}
}
