"""The reader page, joined from the small files in engine/reader/.

Edit the file that owns the thing you are changing; build.py and check.py both read the page through assemble(), so the
page they build and check is the files below joined in this order and nothing else. The joins fall inside the HTML
shell on purpose: head.html ends with the opening <style> tag, body.html starts with the closing one and ends with the
opening <script> tag, tail.html is the closing <script> tag. Placeholders (/*KIT*/, /*TABLES*/, /*FAMILY*/, /*BOOKS*/)
are filled by build.py.
"""
import os

DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'reader')

ORDER = [
    'head.html',          # <head> and the opening <style>
    'style.css',          # all the styling
    'body.html',          # </style>, the stage, buttons and screens, the opening <script>
    'base.js',            # tables, print palette, audio and sound effects
    'pieces.js',          # /*KIT*/ and the drawing pieces added on top of it: farm, storybook style, critters
    'effects.js',         # tagging taps, sway and breathing, bursts, reactions
    'scenes.js',          # backdrops, painted scenes, the shooting gallery, sea and sand
    'flaps.js',           # lift-the-flap
    'age.js',             # age dial, perches, decoys, seeds
    'library.js',         # the family slots and the books on the shelf
    'core.js',            # show a page, bursts, counting, bubbles, layout
    'gates.js',           # hold-to-press gates and the age screen
    'family-screen.js',   # the family screen
    'start.js',           # first-open card, the shelf, who's playing, replay, start
    'tail.html',          # </script>
]


def assemble():
    """(the whole page template, [(file name, offset in the template, text)])"""
    parts, out, at = [], [], 0
    for name in ORDER:
        with open(os.path.join(DIR, name), encoding='utf-8') as f:
            text = f.read()
        parts.append((name, at, text))
        out.append(text)
        at += len(text)
    return ''.join(out), parts


def locate(parts, offset):
    """'file:line' for an offset in the assembled template."""
    for name, start, text in reversed(parts):
        if offset >= start:
            return f'{name}:{text.count(chr(10), 0, offset - start) + 1}'
    return '?'
