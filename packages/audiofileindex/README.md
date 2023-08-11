# audio-database

A NodeJS Audio Database implementation for use in my music player,
[EMP](https://github.com/kevinfrei/EMP). It's pulled out of the core player to
ease testing.

It's not using a class, because I like data hiding, and closures are a better
model than JavaScript classes, so if you want to use it, await
`MakeAudioDatabase` and you're on your way. I will do my best to stick with
semantic versioning, so I'll make sure and bump the minor version for any
breaking changes.

Extra notes:

Trailing periods can use

| Original | Replacement                                                                                          | Note                    |
| -------- | ---------------------------------------------------------------------------------------------------- | ----------------------- |
| .        | [․](https://www.compart.com/en/unicode/U+2024)                                                       | Trailing periods U+2024 |
| \*       | [✻](https://www.compart.com/en/unicode/U+273B)                                                       | U+273B                  |
| /        | [╱](https://www.compart.com/en/unicode/U+2571)                                                       | U+2571                  |
| \\       | [╲](https://www.compart.com/en/unicode/U+2572)                                                       | U+2572                  |
| \|       | [┃](https://www.compart.com/en/unicode/U+2503)                                                       | U+2503                  |
| ?        | [Ɂ](https://www.compart.com/en/unicode/U+0241)                                                       | U+0241                  |
| :        | [꞉](https://www.compart.com/en/unicode/U+A789)                                                       | U+A789                  |
| "        | [“](https://www.compart.com/en/unicode/U+201C) and/or [”](https://www.compart.com/en/unicode/U+201D) | U+201C / U+201D         |
| <        | [˂](https://www.compart.com/en/unicode/U+02C2)                                                       | U+02c2                  |
| \>       | [˃](https://www.compart.com/en/unicode/U+02C3)                                                       | U+20c3                  |

[This is also kind of useful for interpretting 'confusable' characters](https://util.unicode.org/UnicodeJsps/confusables.jsp?a=fast%2Bforward%2Blabs&r=None)
