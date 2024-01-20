export function AsyncHandler<Args extends unknown[], Res>(
  fn: (...args: Args) => Promise<Res>,
): (...args: Args) => void {
  return (...arg) => {
    // eslint-disable-next-line no-console
    fn.apply(arg).catch(console.error);
  };
}
