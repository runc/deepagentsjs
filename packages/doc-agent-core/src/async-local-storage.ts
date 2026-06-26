/**
 * Browser AsyncLocalStorage polyfill for LangGraph interrupt/HITL support.
 *
 * @langchain/core falls back to MockAsyncLocalStorage in browsers, which never
 * stores context — so interrupt() and getRunnableConfig() fail during agent runs.
 */
export class BrowserAsyncLocalStorage<T = unknown> {
  #stack: T[] = [];

  getStore(): T | undefined {
    return this.#stack.at(-1);
  }

  run<R>(store: T, callback: () => R): R {
    this.#stack.push(store);
    let async = false;
    try {
      const result = callback();
      if (result instanceof Promise) {
        async = true;
        return result.finally(() => {
          this.#stack.pop();
        }) as R;
      }
      return result;
    } finally {
      if (!async) {
        this.#stack.pop();
      }
    }
  }

  enterWith(store: T): void {
    this.#stack.push(store);
  }
}
