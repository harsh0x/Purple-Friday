/**
 * Customizer History Manager
 * Maintains an undo/redo stack capped at a maximum number of steps (default: 30).
 */
export class HistoryManager<T> {
  private past: T[] = [];
  private present: T;
  private future: T[] = [];
  private maxSteps: number;

  constructor(initialState: T, maxSteps: number = 30) {
    this.present = JSON.parse(JSON.stringify(initialState));
    this.maxSteps = Math.max(5, maxSteps);
  }

  public get(): T {
    return JSON.parse(JSON.stringify(this.present));
  }

  public canUndo(): boolean {
    return this.past.length > 0;
  }

  public canRedo(): boolean {
    return this.future.length > 0;
  }

  public getUndoCount(): number {
    return this.past.length;
  }

  public getRedoCount(): number {
    return this.future.length;
  }

  public push(newState: T): void {
    // Deep clone to avoid mutating past states
    const clonedNew = JSON.parse(JSON.stringify(newState));
    const clonedPresent = JSON.parse(JSON.stringify(this.present));

    this.past.push(clonedPresent);
    if (this.past.length > this.maxSteps) {
      this.past.shift(); // Evict oldest
    }
    this.present = clonedNew;
    this.future = []; // Clear future on new action
  }

  public undo(): T {
    if (!this.canUndo()) return this.get();

    const previous = this.past.pop()!;
    this.future.unshift(JSON.parse(JSON.stringify(this.present)));
    this.present = previous;
    return this.get();
  }

  public redo(): T {
    if (!this.canRedo()) return this.get();

    const next = this.future.shift()!;
    this.past.push(JSON.parse(JSON.stringify(this.present)));
    this.present = next;
    return this.get();
  }

  public reset(initialState: T): void {
    this.past = [];
    this.future = [];
    this.present = JSON.parse(JSON.stringify(initialState));
  }
}
