export function AsyncHandler<Args, Res>(
  fn: (args: Args) => Promise<Res>,
): (args: Args) => void {
  // eslint-disable-next-line no-console
  return (args) => {
    fn(args).catch(console.error);
  };
}
