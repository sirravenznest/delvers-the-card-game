# Legal & IP notes

_This is a developer's good-faith review, not legal advice. Consult an IP lawyer before commercial release._

## What is generally safe
- **Game mechanics** (d20 rolls, Aim-versus-Guard hit maths, hit points, mana, keywords like haste/poison) are ideas and systems, not protected by copyright.
- **Code, card text, lore, and the world of Vaelmark** are original work by this project.
- **Art** is emoji/SVG drawn in-game. Emoji glyphs come from the device's system font, so none is bundled.
- **Generic fantasy creatures and spells** (goblin, skeleton, dragon, Fireball, Magic Missile, Lightning Bolt, Cure Light Wounds, Gelatinous Cube, Owlbear) appear in the Systems Reference Document 5.1, which Wizards of the Coast released under CC-BY-4.0. If you keep these names, include the attribution below.

## Risks and what was done
- "Dungeons & Dragons", "D&D", and "Advanced Dungeons & Dragons" are trademarks of Wizards of the Coast. The game does not use them in its name, UI, or store listing. A reference in the in-game Guide was removed.
- Product-identity names were avoided (no Beholder, Mind Flayer, Drizzt, Forgotten Realms, etc.). The word "drow" was replaced with "dark elves".
- Do not market the game as "D&D compatible" or use the D&D logo/trade dress.
- The name "Delvers: The Card Game" should be checked for trademark conflicts before a store release, since "Delvers" is a common term.

## Attribution (CC-BY-4.0)
This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

## Third-party components
- Android: AndroidX, Google Credentials/Identity libraries (Apache-2.0).
- Windows: Electron (MIT) and electron-builder (MIT).
- Cloud save: Google Firebase (subject to Google's terms).

## Still needed before a wide release
- Choose a licence for this repository's own code (none is set, so default copyright applies).
- Host the privacy policy at a public URL (`PRIVACY.md` on GitHub works) and link it from the app and store pages.
