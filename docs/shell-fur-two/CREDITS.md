# Two-doll real-time fur study

Independent experimental page for SNOOT CLUB; no archive, account, or database writes.

- Method and reference: Jérémie Piellard, **fur-threejs**, https://piellardj.github.io/fur-threejs/ and https://github.com/piellardj/fur-threejs (main, inspected 2026-11-19).
- `resources/strand-noise.png` is the reference project's `docs/resources/textures/noise.png`. Kept for this material comparison, with its source attribution; no new asset license is asserted here.
- Shell height/tip alpha, rotated-normal combing and fin extrusion are adapted from the reference's published WebGL implementation to the site's Three.js r180 and two archived doll meshes. The upstream application bundle, chair and sphere models are not included.
- Reference page defaults used for comparison: length 2.75 × 0.05 = 0.1375 model units, density 12, comb 0.5, smoothness 0.5, 60 shells. These are model-space parameters, not millimetres.
- Original Bnaear and cup-bear source design data and palette are preserved. The actual 144 × 144 closed model grid is retained. The muzzle uses shorter fur so facial features remain legible.
- White inspection mode overrides only preview material maps; it does not modify stored doll data.
- Two separate WebGL views render on interaction, or continuously while auto-rotation is enabled. Frame rate depends on the device, view size and quality. The study is not a path-traced/offline render and does not claim photographic equivalence.

Shared runtime: existing `../vendor/three.module.js`, `../plush3d.js`, archive-resume modules, fonts and material generation. Three.js copyright/license stays at `../vendor/THREE-LICENSE.txt`.

The strand texture is fully awaited before either WebGL model is constructed; the page does not present a ready state using a placeholder noise texture.
