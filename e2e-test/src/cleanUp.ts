export type Token = number;

export function register(callback: () => Promise<void>): Token {
  return cleaner.register(callback);
}

export function deRegister(token: Token) {
  cleaner.deRegister(token);
}

export interface ResourceManager {
  resourceAcquired: () => void;
  resourceCleared: () => void;
  clear: () => Promise<void>;
}

class Cleaner {
  private lastToken: Token = 0;
  private callbacks: { [index: number]: () => Promise<void> } = {};
  private clearCalled = false;

  constructor() {
    process.on("SIGINT", this.clearCallback);
  }

  public register(callback: () => Promise<void>): Token {
    this.lastToken += 1;
    this.callbacks[this.lastToken] = callback;
    return this.lastToken;
  }

  public deRegister(token: Token) {
    delete this.callbacks[token];
  }

  private clearCallback = async () => {
    if (this.clearCalled) {
      return;
    }
    this.clearCalled = true;

    console.log("Catch SIGINT");
    for (const key in this.callbacks) {
      if (this.callbacks.hasOwnProperty(key)) {
        console.log("Call cleanup");
        await this.callbacks[key]();
      }
    }
    process.exit(1);
  };
}

const cleaner = new Cleaner();
