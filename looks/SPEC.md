# Looks: spec (stage 2, for Scott to pick a direction)

A **look** is one named theme a family picks on the family screen, next to the cast. It changes how every page of
every book looks and sounds. It never changes the story, the words, the family, where things stand or what a tap does.

Prototypes: `looks/proto/fantasy.js`, `looks/proto/robots.js`, run at screenshot time with
`node engine/shots.mjs peekaboo-family/p1 --eval looks/proto/fantasy.js`. They are sketches, not engine code.

## What the engine already gives us
Every scene is built from named pieces (`P.barn`, `P.tree`, `P.sun`, `P.fence`, `P.sky`...), and every color passes
through one palette map (`PAL`, `recolor`). Taps, flaps, perches and finds hang off a piece's place, not its drawing.
So a look can swap what a piece looks like and leave everything that a tap or a check depends on alone. The two
prototypes did exactly that in about 40 lines each, and the page still works (the flap, the find, the hunt chip).

## What a look file holds
A look is a data file plus a small drawing file, like the family cast (`family.json` + `cast.js`):
- `looks/<name>.json`: name, a palette map (scene color to look color, each with a job: sky, ground, hills, accent),
  the motifs to sprinkle per scene (sparkles, rivets), the sound set, and the bubble type face.
- `looks/<name>.js`: the pieces it redraws (`barn`, `tree`, `sun`, `fence`, the flap types, `barnInside`...), each
  with **the same footprint and hotspots** as the piece it replaces (the castle keeps the barn's door, perches and
  size), and at most one prop for the cast (a crown, an antenna headband).
- Anything a look leaves out falls back to the default look, so a look can start small and grow.

## Recommended answers to the brief's questions
1. **What changes:** scenery pieces, colors, sky and ground, motifs, flap drawings, sounds, bubble font. **What stays:**
   the story and words, the cast's own looks (a look may add one prop per member, never replace them), page layout,
   finds, letters, every tap. Critters and farm animals stay as they are in the first version; they are the book's
   characters, the way the family is.
2. **Books don't each need art per look.** The look redraws kit pieces, so every kit-drawn book works in every look
   for free. A book with a painted background (`art`) keeps its painting in every look; it can declare
   `"looks": ["default"]` so the family screen says the look won't change it.
3. **Guardrails hold in every look,** checked by the build the same way as today: each look is drawn and run through
   the gentle rules (motion speed, flashing, loudness), its palette must keep text and finds readable (a contrast
   check on the words strip, the hunt chip and each critter against its scene), a swapped piece must keep its
   hotspots (checked against the default piece's perches and door), and no look draws anything scary (no teeth,
   weapons, skulls or angry faces; a parent approves each look like a book).

## What the shots showed (and the spec has to cover)
- **Flaps belong to the look too.** The barn-door flap is its own piece, so on p1 the red farm door sits on the
  castle and on the workshop. Each look redraws the flap types (door, bush, blanket, box, hay, reeds).
- **The words still say "farm" and "barn door"** while the picture shows a castle. Either the look stays out of the
  words entirely (simplest; "barn" in a castle look is a little odd), or books name a few props as slots like the
  family (`{barn}` reads "castle" in fantasy). Scott's call; the recommendation is no word changes in version one.
- Insides (`barnInside`) and the night scene each need their own redraw, or a fantasy book turns back into a farm
  on p4 and at bedtime.
- Faces on scenery must stay smiling: the first robot sun had a flat mouth and read stern.

## Order of work (build stage, after the family go-live)
1. The look file format, the reader loading the picked look, the family screen picker, `--look` in shots.
2. The checks (footprint and hotspots, contrast, gentle rules per look).
3. Fantasy and robots in full: every kit scene, insides, night, the six flap types, sounds.
4. Then the other looks Scott named (pixel art, classic storybook, soft painted naturalist), one at a time.

## Questions for Scott
1. Fantasy and robots as the first two? (Shots: current, fantasy, robots on the cover and page 1.)
2. One prop on the kid only (as shot), on everyone, or none?
3. Words stay as written, or a look may rename a few props ("castle" for "barn")?
