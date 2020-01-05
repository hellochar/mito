/**
 * A Proxy that makes every .get() into a method that, upon invocation,
 * calls the corresponding method name in its backing array with the arguments.
 * Returns void.
 */
export function arrayProxy<T>(values: T[]) {
  return new Proxy(
    {},
    {
      get: (target, p: keyof T) => {
        const v0 = values[0];
        if (v0 != null && typeof v0[p] === "function") {
          return function(...args: any[]) {
            for (const t of values) {
              const method = t[p];
              if (typeof method === "function") {
                method.apply(t, args);
              }
            }
          };
        } else {
          return NO_OP;
        }
      },
    }
  ) as T;
}

const NO_OP = () => {};
