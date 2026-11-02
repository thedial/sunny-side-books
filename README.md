# Sunny Side Books

Tap-and-explore picture books for toddlers, made at home. Live at **https://sunny-side-books.pages.dev**: it installs to a home screen and works offline.

Every book is a small JSON file that only *names* things: scenes, characters, where they stand, and what happens when you tap. The engine draws everything (no image files) and builds either one page or an installable offline app.

What a page can do:
- **Find it:** hidden critters (ladybugs, bees, snails) tucked into the scene, counted 1, 2, 3 as they're found
- **Counting:** put several of one animal on a page and tapping each one counts it out
- **Phonics:** letter tiles that say the sound, not the letter name ("Pp, /p/, pig")
- **Lift-the-flap:** doors, bushes, blankets and hay that lift to show who's hiding
- **Choose the path:** pages where the child picks where to look next
- **Surprises:** every character and most scenery react to a tap

## Age dial
One setting per tablet, for the grown-up: age 2, 3, 4 or 5, plus auto. Hold the small gear on the shelf for about a second (a toddler's tap does nothing; Home and Mute need the same hold) and pick the big sun. The age changes only the mechanics: how big the hidden critters are and where they sit (in plain view at 2, half behind a leaf or pebble at 4 and 5), how many look-alike decoys sit near them, how soon a hint comes, whether letter tiles show (from 3), and how long the bursts run. The story, the words, the art and the surprises never change. With auto on, the finds move one step easier or harder than the set age from what happened on the last page: all found quickly with no hint steps up, a hint or a long wait steps down. The tablet stores only the age, the auto switch and that one step (`localStorage`), nothing else.

## Build

```
python3 -I engine/build.py --site site books/*.json      # the offline app (service worker + manifest)
python3 -I engine/build.py shelf.html books/*.json       # one self-contained page
```
Host `site/` anywhere static (it runs on Cloudflare Pages).

## Checks
The build runs `engine/check.py` first and writes nothing if a check fails: the book rules, the size budgets, the gentle rules (speed, flashing, loudness, burst length), seeded layouts and the page statechart (`engine/page-states.json`).

The toddler bots play every page in the real engine, in the Chrome already on the machine (headless and muted):
```
python3 -I engine/build.py preview.html books/*.json
node engine/toddler-bots.mjs preview.html                 # about 3 minutes; --runs 4 for a quick look
```
A bot per age (2 to 5) taps at a toddler's pace with misses and decoy taps. It fails when a page is outside its age's band (`tables.json`, `bots`), when a tap target is under 64 CSS px, when a seed does not replay, or when the engine breaks a statechart rule. It prints time to find, hint rate, how often auto would step up or down, and suggested auto thresholds. Every failure carries a seed: open `preview.html?debug&seed=<seed>` to see that exact layout.

## Ratchet
A bug gets its check before its fix. Write the check, watch it fail on the engine as it is, then fix the engine until it passes, and keep the check. Examples: the caterpillar's wiggle ran faster than the speed floor (gentle rules); perches came from `Math.random`, so a bad layout could not be replayed (determinism); a burst or a fanfare from the last page went off on the next one after a quick turn (statechart, `turn-leaves-nothing`). A comment that records a bug is a check waiting to be written.

## Layout
- `engine/kit.js`: the drawing kit (every character and scene, drawn in code) and the tap behaviours
- `engine/book-template.html`: the reader
- `engine/build.py`: builds a page or the offline app from book files
- `engine/check.py`: the build's checks; `engine/tables.json`: the age table, the perches and the bots' bands; `engine/page-states.json`: the page statechart
- `engine/toddler-bots.mjs`, `engine/browser.mjs`: the toddler bots and the headless Chrome they play in
- `books/`: the four published books
- `BOOK-FORMAT.md`: the book format

## Rules for books
Books are pre-made and approved by a parent before they go on the shelf. No child's name or photo goes into a book or into any AI model.
