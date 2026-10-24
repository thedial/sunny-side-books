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
