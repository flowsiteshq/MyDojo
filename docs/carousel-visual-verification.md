# Homepage Program Carousel — Visual Verification

Verified in the development preview on 2026-08-12.

- The carousel advances automatically and switched from the Little Ninjas message to the Teens & Adults message during the 5.5-second verification interval.
- Manual slide controls are present for all four programs.
- The Little Ninjas banner rendered correctly with a disciplined, happy-kids scene and MyDojo-style attire.
- The first Teens & Adults image returned an **"Image generation failed"** placeholder. It was replaced with the independently generated `mydojo-carousel-teens-adults-v2` asset before release.
- The remaining program images also require a quick final visual check after the failed teens image is replaced.

## Replacement Verification

The replacement Teens & Adults image was inspected locally after generation. It rendered successfully as a 2560 × 1440 editorial martial-arts scene with a clear left-side headline-safe area and students in white, black-and-red-trimmed uniforms on the right. The first-generation Kids image displayed a failed placeholder in website storage, so both the Kids and Kickboxing slides were replaced with independently generated v2 assets using the official MyDojo logo reference and simplified single-scene prompts.

The regenerated Kids Martial Arts and Kickboxing v2 images were inspected locally and both passed. Each is 2560 × 1440 with a dark, empty left-side text-safe area; the Kids image depicts disciplined, cheerful children in white, black-and-red-trimmed uniforms, and the Kickboxing image depicts supervised, safe adult pad work in black MyDojo-branded training shirts. No failed placeholders remain in the final image set.
