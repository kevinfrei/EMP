declare module 'album-art' {
  export default function albumArt(
    artistName: string,
    options?: { album: string; size: 'small' | 'medium' | 'large' },
    callback?: (error: string, response: string) => void,
  ): Promise<string>;
}
