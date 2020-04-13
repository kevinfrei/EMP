//@flow

function Rand(max: number): number {
  return Math.random() * max;
}

export default function ShuffleArray<T>(array: Array<T>): Array<T> {
  const res: Array<T> = [];
  const remove: Array<T> = [...array];
  while (remove.length > 0) {
    const i = Rand(remove.length);
    res.push(remove[i]);
    remove.splice(i, 1);
  }
  return res;
}
