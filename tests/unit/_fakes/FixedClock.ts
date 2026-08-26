import type { Clock } from "../../../src/application/ports/Clock.js";

export class FixedClock implements Clock {
  constructor(private readonly fixedDate: Date) {}

  now(): Date {
    return this.fixedDate;
  }
}
