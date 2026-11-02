# Book format (storybook lane)

One JSON file per book. The engine (`engine/`) draws everything from the drawing kit; the book only names things.

```
{ "id": "YYYY-MM-DD-slug", "series": "Sunny Side Farm", "title": "...", "made": "YYYY-MM-DD",
  "status": "draft | approved | favorite | retired", "start": "cover",
  "pages": {
    "<page id>": {
      "scene": "yard | barn | pond | meadow | night",
      "text": "words for the grown-up to read (<b> allowed)",
      "actors": [ {"who": "hen", "x": 760, "y": 930, "s": 1.2, "wobble": false} ],
      "bug": [x, y],                      // optional hidden ladybug
      "sound": "fanfare",                 // optional, plays on arrival
      "next": "<page id>"  |  "choice": {"options": [ {"label": "The barn", "go": "<page id>", "scene": "yard", "view": "x y w h", "actors": [...]} ]}  |  "end": true
    } } }
```
Actors available: hen, chick, egg, crackedEgg, nest, cow, pig, duck, frog, owl, bunny, rock, potato, cabbage, carrot, scarecrow,
tree, pine, flower, mushroom, cloud, hay, barn, sun, plus the bugs (caterpillar, ladybug, snail). Coordinates: 1600 x 1000 page, ground near y 900-960.
Every "go" and "next" must point at a page that exists, and every path must reach an "end" page.

## Painted backgrounds (optional)
A book may add `"art": { "<scene>": {...} }`. When a page's scene has an entry, the painting replaces the drawn scene.
- `src`, `w`, `h`: the image (WebP, published beside the page) and its pixel size. `top` / `bottom`: fill colors for any edge.
- `hot`: tap targets, in the picture's own pixels: `{"who":"sun","c":[x,y],"r":110}` or `{"who":"fence","poly":[[x,y],...]}`.
  `who` picks the surprises (sun, cloud, barn, fence, grass, tree, pond, flowers, moon, window, nest). Each target takes turns through its surprises.
- `barn` also takes `doorL` and `doorR` polygons: the painted doors are cut out and swing open on their outer hinges.
- Open the built page with `?debug` to see every target outlined in red. Mark targets on the real image, not from memory.

## Finds, counting, letters (added Oct 21 2026)
- `"find": [["ladybug",x,y],["bee",x,y],["caterpillar",x,y]]` hidden critters to find (also snail, squid, starfish). Several of one kind get counted 1, 2, 3 when found. Old `"bug":[x,y]` still means one ladybug.
- Counting happens on its own: put 2+ of the same animal in `actors` and tapping each shows 1, 2, 3, then "3 PIGS!".
- `"letter": ["Pp","/p/","pig"]`: a letter tile; tapping it shows the sound, not the letter name (phonics). Use the sound the word actually starts with ("Cc","/k/","cow").
- Characters draw 1.35x bigger than their `s`. Toddler-sized: finds and characters should be easy to spot.
- Build a shelf: `python3 -I engine/build.py out.html book1.json book2.json ...`
- Hiding: an actor with `"hide": true, "icon": "🐙", "found": "THERE HE IS!"` waits behind things listed in the page's `"front"` (drawn over the actors, taps pass through). Show only a sliver (top of a head, a tail). Add one or two look-alike decoys (similar color or shape) so she looks a little; not Where's Waldo. Tapping the hidden one pops it up with the burst.
- Pass colors/sizes to scenery with `"args"`, e.g. `{"who":"coral","x":760,"y":960,"args":["#ef9a4f",0.8]}`.
- Lift-the-flap: `"flaps": [{"type":"bush","x":640,"y":980,"w":290,"h":200,"hide":{"who":"bunny","s":0.95},"say":"Hop hop!","peek":"PEEKABOO!"}]`. Types: door (swings sideways), bush, blanket, box, hay, reeds (lift up). `hide` can be a list. Tap lifts, tap again closes. Let a little of the animal show (ears over a bush, a tail through reeds) so there's a hint.

## Age and finds (added Nov 1 2026)
The tablet has one age setting (2, 3, 4 or 5, plus auto; see README). The age changes the *mechanics* of a page, never the book: the story text, the words strip, the art, which surprises a page has and which pages exist are the same at every age.

- **Perches.** Every kit scene (yard, barn, pond, meadow, garden, night, reef, kelp, sand, deep) carries a list of perches in the engine: spots a critter can sit on, measured against the drawing (a flower head, a fence post, a tree's low leaves, a ladder rung, a lily pad, a rock, the moon). Each perch is `open` (in plain view) or half hidden, in which case it names a `cover`, a small piece the engine draws in the `front` layer over part of the critter (a grass tuft, a leaf, a pebble, a small rock). Actors bring perches too: a `hive` offers its base and roof, a `rock` or `hay` its top, a `tree` its leaves. A page may add its own: `"perches": [{"x":700,"y":940,"open":true}, {"x":1200,"y":880,"open":false,"cover":0}]`, where a numeric `cover` points at a piece already in the page's `front` list. Open the built page with `?debug` to see every perch outlined (red open, blue half hidden) with its name, and the finds' hit circles.
- **Coordinate-free finds.** A find may leave its coordinates out: `"find": [["ladybug"], ["caterpillar"]]`. The engine then picks a perch for the age: age 2 gets open perches only; age 3 gets any; age 4 and 5 get the half-hidden ones first, except that on a page with two or more coordinate-free finds one of them (picked by the seed) stays in plain view. A flower head goes to a ladybug or bee first, the hive's base to a caterpillar or snail; a cloud edge is for a bee only. No critter ever sits in open sky unless a perch says so. Finds with explicit `x, y` keep working exactly as before and get no perch (so the four published books are unchanged except Bee's Busy Day page 1, the worked example).
- **Size and hit area.** Finds draw at scale 1.0 at age 2 down to 0.55 at age 5. The invisible tap circle behind each find never shrinks below 64 CSS px across at the tablet's size.
- **Decoys.** Look-alikes placed near each find: none at age 2, one at 3, two at 4, four at 5. A red flower head for a ladybug, a yellow one for a bee, a green leaf or pea pod for a caterpillar, a grey pebble for a snail, a shell for a starfish (squid get none). Flower heads land on nearby flower perches, the rest lie on the ground. Tapping a decoy gives a small wobble and nothing else. A page can ask for fewer with `"decoys": 1`: at most that many per critter at any age (Bee's Busy Day page 1 does, so the meadow's many flowers don't all become decoys).
- **Hints.** If nothing on the page has been tapped for 4 s (age 2), 8 s (3), 14 s (4) or 20 s (5), the unfound chip icons pulse and the critters wiggle; it repeats after the same idle time.
- **Replay.** Perch picks and decoys come from a seed made of the book, the page, the visit (the first, second... time the page is shown since the app opened) and the age, so a new visit re-rolls them and the same seed always lays the page out the same way. With `?debug` the seed shows at the bottom of the screen; open the page with `?seed=<that text>` (for example `?debug&seed=2026-10-21-bees-busy-day/p1/1/5`) to see exactly that layout again. Replaying sets the age for that session only; nothing is stored.
- **Other mechanics the age drives.** Letter tiles show from age 3 (hidden at 2). Home, Mute and the gear need a 1.2 s hold at ages 2 and 3, 0.8 s at 4 and 5. Found bursts and surprise animations run their full length at age 2 and about 60% of it at age 5. Counting badges and choice pages are the same at every age.
