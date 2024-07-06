export function AsyncHandler<Args extends unknown[], Res>(
  fn: (...args: Args) => Promise<Res>,
): (...args: Args) => void {
  return (...args) => {
    fn.apply(args).catch(console.error);
  };
}
