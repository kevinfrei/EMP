export function AsyncHandler<Args extends unknown[], Res>(
  fn: (...args: Args) => Promise<Res>,
): (...args: Args) => void {
  // eslint-disable-next-line no-console
  return (...args) => {
    fn.apply(args).catch(console.error);
  };
}
