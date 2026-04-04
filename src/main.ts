import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, HymnaryPluginSettings, HymnarySettingTab } from './settings';
import { HymnSearchModal } from './modal';

export default class HymnaryPlugin extends Plugin {
	settings: HymnaryPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('music', 'Search Hymnary.org', () => {
			new HymnSearchModal(this.app, this).open();
		});

		this.addCommand({
			id: 'search-hymnary',
			name: 'Search Hymnary.org',
			callback: () => {
				new HymnSearchModal(this.app, this).open();
			},
		});

		this.addSettingTab(new HymnarySettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData() as Partial<HymnaryPluginSettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

