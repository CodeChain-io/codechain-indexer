import { IncomingWebhook, MessageAttachment } from "@slack/client";
import * as _ from "lodash";

export interface Slack {
    sendError(msg: string): void;
    sendWarning(text: string): void;
    sendInfo(title: string, text: string): void;
}

class NullSlack implements Slack {
    public sendError(__: string) {
        // empty
    }
    public sendWarning(__: string) {
        // empty
    }
    public sendInfo(__: string, ___: string) {
        // empty
    }
}

// tslint:disable-next-line:max-classes-per-file
class SlackWebhook implements Slack {
    private readonly tag: string;
    private readonly webhook: IncomingWebhook;
    private unsentAttachments: MessageAttachment[] = [];

    public constructor(tag: string, slackWebhookUrl: string) {
        this.tag = tag;
        this.webhook = new IncomingWebhook(slackWebhookUrl, {});
    }

    public sendError(text: string) {
        const title = `[error]${this.tag} has a problem`;
        this.unsentAttachments.push({ title, text, color: "danger" });
        this.send();
    }

    public sendWarning(text: string) {
        console.log(`Warning: ${text}`);
        this.unsentAttachments.push({
            title: `[warn]${this.tag} finds a problem`,
            text,
            color: "warning"
        });
        this.send();
    }

    public sendInfo(title: string, text: string) {
        console.log(`Info: ${text}`);
        this.unsentAttachments.push({
            title: `[info]${this.tag} ${title}`,
            text,
            color: "good"
        });
        this.send();
    }

    private send() {
        this.webhook
            .send({
                attachments: this.unsentAttachments
            })
            .catch((err: Error) => {
                if (err) {
                    console.error("IncomingWebhook failed!", err);
                    return;
                }
            });
        this.unsentAttachments = [];
    }
}

export function createSlack(
    tag: string,
    slackWebhookUrl: string | undefined
): Slack {
    if (slackWebhookUrl) {
        console.log("Slack connected");
        return new SlackWebhook(tag, slackWebhookUrl);
    } else {
        console.log("Slack not connected");
        console.log("You can set SLACK_WEBHOOK env variable to connect Slack");
        return new NullSlack();
    }
}
