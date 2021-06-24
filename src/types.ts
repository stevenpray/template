export type Callback<E = undefined, R = undefined> = (error?: E, result?: R) => void;

export type MaybePromise<T> = T | Promise<T>;

export type Nullable<T> = T | null | undefined;
