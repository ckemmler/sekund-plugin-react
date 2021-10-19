import SekundHomeComponent from "@/ui/home/SekundHomeComponent";
import SekundView from "@/ui/SekundView";
import { HOME_VIEW_ICON, HOME_VIEW_TYPE } from "@/_constants";
import React from "react";
import ReactDOM from "react-dom";

export default class SekundHomeView extends SekundView {

    getViewType(): string {
        return HOME_VIEW_TYPE;
    }

    getDisplayText(): string {
        return "Sekund Home";
    }

    getIcon(): string {
        return HOME_VIEW_ICON;
    }

    async onOpen(): Promise<void> {
        ReactDOM.render(<SekundHomeComponent view={this} />, this.containerEl.children[1]);
        this.updateOnlineStatus();
    }

}