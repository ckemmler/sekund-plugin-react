import SekundPluginReact from "@/main";
import ServerlessService from "@/services/ServerlessService";

export default class EventsWatcherService extends ServerlessService {
  private static _instance: EventsWatcherService;
  private watching = false;
  private resumeToken: any;
  private listeners: { [key: string]: SekundEventListener } = {};

  constructor(plugin: SekundPluginReact) {
    super(plugin);
    EventsWatcherService._instance = this;
  }

  static get instance() {
    return EventsWatcherService._instance;
  }

  public addEventListener(id: string, listener: SekundEventListener) {
    this.listeners[id] = listener;
  }

  public removeEventListener(id: string) {
    delete this.listeners[id];
  }

  public async watchEvents() {
    if (this.watching) {
      return;
    }
    if (this.plugin && this.plugin.user) {
      const events = this.plugin.user.mongoClient("mongodb-atlas").db(this.plugin.settings.subdomain).collection("events");
      if (events) {
        try {
          const cursor = this.resumeToken ? events.watch({ resumeAfter: this.resumeToken }) : events.watch();
          this.watching = true;
          for await (const change of cursor) {
            this.resumeToken = change._id;
            switch (change.operationType) {
              case "insert": {
                const { fullDocument } = change;
                for (const listener of Object.values(this.listeners)) {
                  for (const evtType of listener.eventTypes) {
                    if (fullDocument.type === evtType) {
                      listener.callback(fullDocument);
                    }
                  }
                }
                break;
              }
            }
          }
          this.watching = true;
        } catch (err) {
          setTimeout(() => this.watchEvents(), 5000);
          this.watching = false;
        }
      }
    }
  }
}

export class SekundEventListener {
  public eventTypes: string[];
  public callback: Function;

  constructor(et: string[], cb: Function) {
    this.eventTypes = et;
    this.callback = cb;
  }
}
