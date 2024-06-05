import {ItemView, WorkspaceLeaf} from "obsidian";
import * as xterm from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

import type { ShellProfile } from "./main.js";

export const TERMINAL_VIEW = "terminal-view";

export interface TerminalState {
    title: string
}

export default class TerminalView extends ItemView implements TerminalState {
    title: string = "";
    terminal: xterm.Terminal;
    fit: FitAddon;
    
    constructor(leaf: WorkspaceLeaf, private profile: ShellProfile) {
        super(leaf);
        this.terminal = new xterm.Terminal({
            cursorStyle: "bar",
        });
        
        this.terminal.loadAddon(this.fit = new FitAddon());
    }
    
    getViewType(): string {
        return TERMINAL_VIEW
    }
    
    getDisplayText(): string {
        return "New Terminal";
    }    
    
    async onOpen() {
        this.contentEl.addClass("terminal-tab-container");
        const container = this.containerEl.children[1];
        container.empty();
        
        this.fit.fit();
        this.containerEl.addEventListener("resize", _ => this.fit.fit());
        
        this.terminal.open(container as HTMLElement);
    }
}