import {App, Modal, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';

import TerminalView, { TERMINAL_VIEW } from './terminal.js';

export interface TerminalSettings {
    profiles: Record<string, ShellProfile>,
    default: keyof TerminalSettings["profiles"]
}

export const default_settings: TerminalSettings = {
    profiles: {
        Default: {
            shell: null
        }
    },
    default: 'default'
};

export interface ShellProfile {
    shell: null | string
}

export default class Terminal extends Plugin {
    settings: TerminalSettings = default_settings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new SettingsTab(this.app, this));
        this.registerView(TERMINAL_VIEW, leaf => new TerminalView(leaf, this.settings.profiles[this.settings.default]));

        this.addCommand({
            id: "open-new-terminal-tab",
            name: "New Terminal Tab",
            callback: async () => await this.app.workspace.getLeaf(true).setViewState({ type: TERMINAL_VIEW, active: true })
            });
    }

    async loadSettings() {
        this.settings = Object.assign({}, default_settings, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

export class SettingsTab extends PluginSettingTab {
    constructor(app: App, private plugin: Terminal) {
        super(app, plugin);
    }

    display() {
        this.containerEl.empty();

        new Setting(this.containerEl)
            .setName("Default Profile")
            .setDesc("Which profile should be opened by default")
            .addDropdown(dd => {
                Object.keys(this.plugin.settings.profiles)
                    .forEach(name => dd.addOption(name, name));

                dd.addOption('', "Create New Profile");

                dd.onChange(value => {
                    if (value in this.plugin.settings.profiles)
                        return this.plugin.settings.default = value;
                    else
                        this.new_profile();
                });
            });

    }

    private new_profile() {
        let max_new_profile = Math.max(0, ...Object.keys(this.plugin.settings.profiles)
            .filter(i => i.match(/^New Profile (\(\d+\))$/)?.[1])
            .map(i => Number(i)));

        let new_name = max_new_profile > 1 ? `New Profile (${max_new_profile})` : `New Profile`;

        this.plugin.settings.profiles[new_name] = {
            shell: null
        };

        new EditProfile(this.app, this.plugin, new_name, () => this.display())
            .open();
    }
}

export class EditProfile extends Modal {
    private readonly profile: ShellProfile;
    private readonly original_name: string

    constructor(app: App, private plugin: Terminal, private profile_name: keyof TerminalSettings["profiles"], private afterClose: () => void) {
        super(app);

        this.profile = plugin.settings.profiles[profile_name];
        this.original_name = profile_name;
    }

    onOpen(): void {
        new Setting(this.contentEl)
            .setName("Profile Name")
            .setDesc("A brief description of how you choose to use this profile")
            .addText(name => name
                .setValue(this.profile_name)
                .onChange(change => this.profile_name = change.trim()));

        new Setting(this.contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText("Save")
                    .setCta()
                    .onClick(() => {
                        if (this.profile_name.trim().length > 0) {
                            this.close();

                            if (this.original_name != this.profile_name)
                                delete this.plugin.settings.profiles[this.original_name];

                            this.plugin.settings.profiles[this.profile_name] = this.profile;

                            console.log(this.plugin.settings);
                            this.afterClose();
                        } else {
                            new Notice("Profile should have a non-empty name");
                        }
                    }));
    }
}