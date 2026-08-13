# Figma source artifacts

LexiGo's canonical cloud design source is the Figma file `3xXmBWnf38jbvLjtziwber` (`LexiGo Design System`).

Offline local-copy evidence is recorded in [`offline-source-snapshot.md`](./offline-source-snapshot.md). Native `.fig` files are binary ZIP/Kiwi artifacts and must only be committed through a binary-safe transport such as Git LFS or a binary-capable GitHub upload/release action. The repository's current ChatGPT GitHub connector writes UTF-8 text only and must not be used to fake a `.fig` blob.

Before accepting a native source snapshot, verify its SHA-256 against the recorded manifest. Production implementation still requires explicit canonical Figma node IDs; an offline snapshot does not make every matrix/concept frame production source of truth.
