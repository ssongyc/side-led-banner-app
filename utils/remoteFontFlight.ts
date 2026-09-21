export interface RemoteFontDownloadOptions {
  signal?: AbortSignal;
  onProgress?: (fraction: number) => void;
}

interface RemoteFontFlight {
  controller: AbortController;
  promise: Promise<string>;
  progress: number;
  listeners: Set<(fraction: number) => void>;
  consumers: number;
  completed: boolean;
}

const flights = new Map<string, RemoteFontFlight>();

function abortError(): Error {
  const error = new Error("Remote font download cancelled.");
  error.name = "AbortError";
  return error;
}

function joinFlight(
  flight: RemoteFontFlight,
  options?: RemoteFontDownloadOptions,
): Promise<string> {
  if (options?.signal?.aborted) return Promise.reject(abortError());

  flight.consumers += 1;
  if (options?.onProgress) {
    flight.listeners.add(options.onProgress);
    options.onProgress(flight.progress);
  }

  return new Promise((resolve, reject) => {
    let finished = false;

    const leave = () => {
      if (options?.onProgress) flight.listeners.delete(options.onProgress);
      options?.signal?.removeEventListener("abort", onAbort);
      flight.consumers -= 1;
      if (flight.consumers === 0 && !flight.completed) {
        flight.controller.abort();
      }
    };
    const finish = (callback: () => void) => {
      if (finished) return;
      finished = true;
      leave();
      callback();
    };
    const onAbort = () => finish(() => reject(abortError()));

    options?.signal?.addEventListener("abort", onAbort, { once: true });
    flight.promise.then(
      (uri) => finish(() => resolve(uri)),
      (error) => finish(() => reject(error)),
    );
  });
}

export function runRemoteFontDownload(
  key: string,
  options: RemoteFontDownloadOptions | undefined,
  start: (options: Required<Pick<RemoteFontDownloadOptions, "signal" | "onProgress">>) => Promise<string>,
): Promise<string> {
  if (options?.signal?.aborted) return Promise.reject(abortError());

  let flight = flights.get(key);
  if (!flight) {
    const controller = new AbortController();
    flight = {
      controller,
      promise: Promise.resolve(""),
      progress: 0,
      listeners: new Set(),
      consumers: 0,
      completed: false,
    };
    const currentFlight = flight;
    flight.promise = Promise.resolve()
      .then(() =>
        start({
          signal: controller.signal,
          onProgress: (fraction) => {
            currentFlight.progress = fraction;
            currentFlight.listeners.forEach((listener) => listener(fraction));
          },
        }),
      )
      .finally(() => {
        currentFlight.completed = true;
        if (flights.get(key) === currentFlight) flights.delete(key);
      });
    flights.set(key, flight);
  }
  return joinFlight(flight, options);
}
