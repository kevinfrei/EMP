/*
export function AsyncHandler<Arg, Res>(
  fn: (args: Arg) => Promise<Res>,
): (args: Arg) => void {
  // eslint-disable-next-line no-console
  return (arg) => {
    fn(arg).catch(console.error);
  };
}
*/

export function AsyncHandler<Args extends unknown[], Res>(
  fn: (...args: Args) => Promise<Res>,
): (...args: Args) => void {
  return (...arg) => {
    // eslint-disable-next-line no-console
    fn.apply(arg).catch(console.error);
  };
}
