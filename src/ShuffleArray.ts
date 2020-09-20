function Rand(max: number): number {
  return Math.floor(Math.random() * max);
}

export default function ShuffleArray<T>(array: T[]): T[] {
  const res: T[] = [];
  const remove: T[] = [...array];
  while (remove.length > 0) {
    const i = Rand(remove.length);
    res.push(remove[i]);
    remove.splice(i, 1);
  }
  return res;
}
