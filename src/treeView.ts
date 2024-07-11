import * as vscode from "vscode";
import { listDevpods } from "./devpod/commands";

// https://code.visualstudio.com/api/extension-guides/tree-view
//   - TODO: implement refresh button
//   - TODO: open when click on tree item
//   - TODO: inline actions

type DevpodTreeItem = {
    devpodId: string
};

export class DevpodTreeView implements vscode.TreeDataProvider<DevpodTreeItem> {

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
}