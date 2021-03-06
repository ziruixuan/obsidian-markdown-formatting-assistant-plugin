import {
  App,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from 'obsidian';

import { addIcons } from './icons';

import {
  SidePanelControlView,
  SidePanelControlViewType,
} from './SidePanelControlView';
import { CommandListView } from './CommandListView';

export interface PluginSettings {
  triggerChar: string;
  sidePaneSideLeft: Boolean;
  savedColors: string[];
}

const DEFAULT_SETTINGS: PluginSettings = {
  triggerChar: '\\',
  sidePaneSideLeft: false,
  savedColors: ['#ff0000'],
};

export default class MarkdownAutocompletePlugin extends Plugin {
  settings: PluginSettings;
  private sidePanelControlView: SidePanelControlView;
  private commandListView: CommandListView;
  private keyUpFunction: (cm: CodeMirror.Editor, event: KeyboardEvent) => {};

  async onload() {
    console.log('loading obsidian-markdown-formatting-assistant-plugin');

    await this.loadSettings();
    addIcons();

    this.registerView(SidePanelControlViewType, (leaf) => {
      this.sidePanelControlView = new SidePanelControlView(leaf, this);
      return this.sidePanelControlView;
    });

    this.addRibbonIcon('viewIcon', 'Open Markdown Formatting Assistant', () => {
      this.toggleSidePanelControlView();
    });

    this.addSettingTab(new SettingsTab(this.app, this));

    this.keyUpFunction = (cm: CodeMirror.Editor, event: KeyboardEvent) => {
      return CommandListView.display(
        this.app,
        cm,
        event,
        this.settings.triggerChar,
      );
    };

    this.registerCodeMirror((cm: CodeMirror.Editor) => {
      cm.on('keyup', this.keyUpFunction);
    });
  }

  onunload() {
    this.app.workspace.iterateCodeMirrors((cm: CodeMirror.Editor) => {
      cm.off('keyup', this.keyUpFunction);
    });
  }

  async loadSettings() {
    this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private readonly toggleSidePanelControlView = async (): Promise<void> => {
    // const existing = this.app.workspace.getLeavesOfType(
    //   SidePanelControlViewType,
    // );

    // if (existing.length) {
    //   this.app.workspace.revealLeaf(existing[0]);
    //   return;
    // }

    this.app.workspace.detachLeavesOfType(SidePanelControlViewType);

    if (this.settings.sidePaneSideLeft) {
      await this.app.workspace.getLeftLeaf(false).setViewState({
        type: SidePanelControlViewType,
        active: true,
      });
    } else {
      await this.app.workspace.getRightLeaf(false).setViewState({
        type: SidePanelControlViewType,
        active: true,
      });
    }

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(SidePanelControlViewType)[0],
    );
  };
}

class SettingsTab extends PluginSettingTab {
  plugin: MarkdownAutocompletePlugin;

  constructor(app: App, plugin: MarkdownAutocompletePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display() {
    let { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', {
      text: 'Markdown Formatting Assistant Settings',
    });

    new Setting(containerEl)
      .setName('Trigger Char')
      .setDesc('Char which triggers the autocompletion')
      .addText((text) =>
        text
          .setPlaceholder('Enter a char to trigger the autocompletion')
          .setValue(this.plugin.settings.triggerChar)
          .onChange(async (value) => {
            this.plugin.settings.triggerChar = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Side Pane Side')
      .setDesc('Choose on which side the Side Pane accours. ()')
      .addText((text) =>
        text
          .setPlaceholder('Enter left or right')
          .setValue(this.plugin.settings.sidePaneSideLeft ? 'left' : 'right')
          .onChange(async (value) => {
            this.plugin.settings.sidePaneSideLeft =
              value === 'left' ? true : false;
            await this.plugin.saveSettings();
          }),
      );
  }
}
