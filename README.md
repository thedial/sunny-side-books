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

## Layout
- `engine/kit.js`: the drawing kit (every character and scene, drawn in code) and the tap behaviours
- `engine/book-template.html`: the reader
- `engine/build.py`: builds a page or the offline app from book files
- `books/`: the four published books
- `BOOK-FORMAT.md`: the book format

## Rules for books
Books are pre-made and approved by a parent before they go on the shelf. No child's name or photo goes into a book or into any AI model.
