import {ItemView, WorkspaceLeaf} from "obsidian";
import * as xterm from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type * as pty from 'node-pty';

import type { ShellProfile } from "./main.js";

export const TERMINAL_VIEW = "terminal-view";

export interface TerminalState {
    title: string
}

export default class TerminalView extends ItemView implements TerminalState {
    title: string = "";
    terminal: xterm.Terminal;
    fit: FitAddon;
    
    child: pty.IPty;

    constructor(leaf: WorkspaceLeaf, private profile: ShellProfile) {
        super(leaf);
        this.terminal = new xterm.Terminal({
            cursorStyle: "bar",
        });
        
        this.terminal.loadAddon(this.fit = new FitAddon());

        this.child = pty.spawn('bash', [], {
            cols: this.terminal.cols,
            rows: this.terminal.rows,
            useConpty: false 
        });
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
        
        this.terminal.on('data', data => this.child.write(data));
        this.child.on('data', data => this.terminal.write(data));

        term.on('resize', size => this.terminal.resize(
            Math.max(size ? size.cols : term.cols, 1),
            Math.max(size ? size.rows : term.rows, 1)
        ));

        this.terminal.open(container as HTMLElement);
    }
}
