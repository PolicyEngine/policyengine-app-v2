/** A task the test settles by hand, with whether it has started. */
export interface ControlledTask {
  run: () => Promise<string>;
  started: () => boolean;
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
}

export function controlledTask(): ControlledTask {
  let hasStarted = false;
  let resolveTask!: (value: string) => void;
  let rejectTask!: (reason: Error) => void;
  const settled = new Promise<string>((resolve, reject) => {
    resolveTask = resolve;
    rejectTask = reject;
  });
  return {
    run: () => {
      hasStarted = true;
      return settled;
    },
    started: () => hasStarted,
    resolve: (value) => resolveTask(value),
    reject: (reason) => rejectTask(reason),
  };
}

/** Lets queued promise callbacks run. */
export const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export const TASK_LIMIT = 2;
export const TASK_RESULT = 'done';
export const TASK_FAILURE = new Error('The request failed');
