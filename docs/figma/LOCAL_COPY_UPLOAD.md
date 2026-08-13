# Native `.fig` upload procedure

The canonical local copy for this snapshot is identified by SHA-256:

`cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`

When a binary-safe GitHub path is available, store the source as:

`design/figma/LexiGo Design System.fig`

Recommended mechanism: Git LFS with `*.fig filter=lfs diff=lfs merge=lfs -text`.

After upload, verify the downloaded artifact reproduces the exact SHA-256 above before marking the binary-preservation work complete. Do not use the UTF-8 Contents API for the native artifact.
