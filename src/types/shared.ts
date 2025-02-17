export type NonNullableDeepRecordValues<T> = {
  [P in keyof T]: T[P] extends any[]
    ? Array<NonNullableDeepRecordValues<T[P][number]>>
    : T[P] extends Record<string, any>
      ? NonNullableDeepRecordValues<T[P]>
      : NonNullable<T[P]>;
};
