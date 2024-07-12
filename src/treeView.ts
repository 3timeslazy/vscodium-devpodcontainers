import * as vscode from "vscode";
import { listDevpods } from "./devpod/commands";

// https://code.visualstudio.com/api/extension-guides/tree-view
//   - TODO: open when click on tree item
//   - TODO: inline actions

type DevpodTreeItem = {
    devpodId: string
};

type EventData = DevpodTreeItem | undefined | null | void;

export class DevpodTreeView implements vscode.TreeDataProvider<DevpodTreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<EventData> = new vscode.EventEmitter<EventData>();
    readonly onDidChangeTreeData: vscode.Event<EventData> = this._onDidChangeTreeData.event;

    constructor() {}
    
    getTreeItem(element: DevpodTreeItem): vscode.TreeItem {
        const item = new vscode.TreeItem(element.devpodId);
        item.iconPath = new vscode.ThemeIcon('vm');
        return item;
    }

    async getChildren(element?: DevpodTreeItem): Promise<DevpodTreeItem[]> {
        if (element) {
            return [];
        }

        const devpods = await listDevpods();
        return devpods.map((d) => ({ devpodId: d.id }));
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}