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
