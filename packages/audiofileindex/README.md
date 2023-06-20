# audio-database

A NodeJS Audio Database implementation for use in my music player,
[EMP](https://github.com/kevinfrei/EMP). It's not yet integrated, but I'm trying
to get it to a place where I can rip a bunch of stuff out of EMP and replace it
with this, in the hopes that this is better tested, then start adding some
capabilites here. The first one that seems like it's sort of doable is
"incremental updates" to allow the user to edit metadata and not force full DB
refresh.

It's not using a class, because I like data hiding, and closures are a better
model than JavaScript classes, so if you want to use it, await
`MakeAudioDatabase` and you're on your way. I will do my best to stick with
semantic versioning, so I'll make sure and bump the minor version for any
breaking changes. I haven't yet published it to NPM, but I will do so pretty
soon, with the name `@freik/audio-database`.
