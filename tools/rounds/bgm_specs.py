# The BGM Claude wrote (tools/bgm_guide.py renders the guide, tools/bgm_ace.py has ACE-Step play it with real instruments; docs/DESIGN.md
# 「BGM」: after the style of the references the user named, the melodies and harmonies our own). Per track: bpm, key, the caption ACE-Step
# hears (instruments and mood only, no names of other works), sections: bars, chords (one per bar, repeating), the groove (drums), bass,
# pad, arpeggio / ostinato, the melody as (note, beats) and the instrument that plays it in the guide.
TRACKS = {
  # ---------------------------------------------------------------- episode 2 (DESIGN 第 2 话): her chase; the quiet inn; the bell tower
  "ep2_she": dict(bpm=138, key="D minor", loop=True,
    caption="Japanese horror chase music, tense and creepy, fast shamisen ostinato, pounding taiko drums, ticking clock percussion, an eerie "
            "music box, dissonant tremolo strings, a haunting shakuhachi melody, dark cinematic game soundtrack, instrumental",
    sections=[
      dict(bars=8, chords=["Dm", "Dm", "Eb", "Eb", "Gm", "Gm", "Asus4", "A"], drums="heart", ticks=True, pad="strings", lead="musicbox",
           melody=[("D5", 1), ("Eb5", 1), ("D5", 1), ("A4", 1), ("Bb4", 1), ("A4", 1), ("G4", 2), ("D5", 1), ("Eb5", 1), ("G5", 1), ("A5", 1),
                   ("G5", 1), ("Eb5", 1), ("D5", 2), ("D5", 1), ("Eb5", 1), ("D5", 1), ("A4", 1), ("Bb4", 1), ("A4", 1), ("G4", 1), ("Eb4", 1),
                   ("D4", 4), (None, 4)]),
      dict(bars=16, chords=["Dm", "Dm", "Eb", "Eb", "Gm", "Gm", "Asus4", "A"], drums="taiko", bass="eighth", pad="strings", lead="flute",
           ostinato=["D3", "D3", "A3", "D4", "Eb4", "D4", "A3", "G3"],
           melody=[("A4", 2), ("Bb4", 1), ("A4", 1), ("G4", 2), ("Eb4", 2), ("D4", 3), (None, 1), (None, 4),
                   ("A4", 2), ("Bb4", 1), ("C5", 1), ("D5", 2), ("Eb5", 1), ("D5", 1), ("A4", 4), (None, 4),
                   ("D5", 1), ("Eb5", 1), ("D5", 1), ("A4", 1), ("Bb4", 1), ("A4", 1), ("G4", 1), ("Eb4", 1), ("D4", 2), ("G4", 2), ("A4", 4),
                   ("Bb4", 1), ("A4", 1), ("G4", 1), ("Eb4", 1), ("D4", 2), ("Eb4", 2), ("D4", 4), (None, 4)]),
      dict(bars=16, chords=["Dm", "Dm", "Gm", "Dm", "Dm", "Eb", "Gm", "Asus4", "Gm", "Dm", "Eb", "Dm", "Gm", "Eb", "Asus4", "A"], drums="rock",
           bass="eighth", arp="strings", pad="choir", lead="brass", ostinato=["D3", "D3", "A3", "D4", "Eb4", "D4", "A3", "G3"],
           melody=[("D5", 1.5), ("D5", 0.5), ("Eb5", 1), ("D5", 1), ("A4", 2), ("G4", 2), ("Bb4", 1.5), ("A4", 0.5), ("G4", 1), ("Eb4", 1), ("D4", 4),
                   ("D5", 1.5), ("D5", 0.5), ("Eb5", 1), ("G5", 1), ("A5", 2), ("G5", 2), ("Eb5", 1.5), ("D5", 0.5), ("Bb4", 1), ("A4", 1), ("A4", 4),
                   ("G5", 2), ("Eb5", 2), ("D5", 2), ("A4", 2), ("Bb4", 1), ("A4", 1), ("G4", 1), ("Eb4", 1), ("D4", 4),
                   ("G5", 1), ("A5", 1), ("Bb5", 1), ("A5", 1), ("G5", 1), ("Eb5", 1), ("D5", 2), ("A4", 2), ("Bb4", 1), ("A4", 1), ("D5", 4)]),
      dict(bars=8, chords=["Dm", "Eb", "Gm", "Asus4"], drums="heart", ticks=True, pad="strings", lead="musicbox",
           melody=[("D5", 2), ("Eb5", 2), ("D5", 2), ("A4", 2), ("Bb4", 2), ("A4", 2), ("G4", 4), ("D5", 2), ("Eb5", 2), ("G5", 2), ("A5", 2),
                   ("G5", 2), ("Eb5", 2), ("D5", 4)]),
    ]),
  "ep2_final": dict(bpm=160, key="D minor", loop=True,
    caption="epic Japanese final boss battle music, a huge taiko ensemble, a deep temple bell, fierce shamisen riffs, heroic brass, a powerful "
            "choir, full orchestra, intense and triumphant, dawn breaking, cinematic game soundtrack, instrumental",
    sections=[
      dict(bars=4, chords=["Dm"], ticks=True, pad="choir", bell=2, melody=[(None, 16)]),
      dict(bars=16, chords=["Dm", "Bb", "C", "Am", "Dm", "Bb", "Gm", "A"], drums="taiko", bass="eighth", pad="strings", lead="brass",
           ostinato=["D3", "A3", "D4", "A3", "F4", "A3", "D4", "A3"],
           melody=[("D5", 2), ("F5", 1), ("E5", 1), ("D5", 2), ("A4", 2), ("Bb4", 1), ("C5", 1), ("D5", 1), ("E5", 1), ("F5", 4),
                   ("E5", 2), ("D5", 1), ("C5", 1), ("D5", 2), ("Bb4", 2), ("A4", 1), ("Bb4", 1), ("C5", 1), ("E5", 1), ("D5", 4),
                   ("A5", 2), ("G5", 1), ("F5", 1), ("E5", 2), ("C5", 2), ("D5", 1), ("E5", 1), ("F5", 1), ("G5", 1), ("A5", 4),
                   ("G5", 2), ("F5", 1), ("E5", 1), ("F5", 2), ("D5", 2), ("E5", 1), ("C5", 1), ("A4", 1), ("C#5", 1), ("D5", 4)]),
      dict(bars=16, chords=["F", "C", "Dm", "Bb", "Gm", "A", "Dm", "Dm"], drums="rock", bass="eighth", arp="strings", pad="choir", lead="choir",
           melody=[("F5", 2), ("E5", 2), ("C5", 2), ("G5", 2), ("A5", 3), ("G5", 1), ("F5", 4), ("D5", 2), ("E5", 1), ("F5", 1), ("E5", 2), ("C#5", 2),
                   ("D5", 4), (None, 4), ("A5", 2), ("G5", 2), ("E5", 2), ("G5", 2), ("F5", 3), ("E5", 1), ("D5", 4), ("Bb4", 2), ("C5", 1), ("D5", 1),
                   ("E5", 2), ("A5", 2), ("D5", 4), (None, 4)]),
      dict(bars=8, chords=["Bb", "C", "Dm", "Dm", "Bb", "C", "A", "A"], drums="march", bass="quarter", pad="choir", bell=4, lead="brass",
           melody=[("D5", 4), ("E5", 4), ("F5", 4), ("A5", 4), ("Bb5", 4), ("G5", 4), ("A5", 8)]),
    ]),
  "ep2_inn": dict(bpm=76, key="D major", loop=True,
    caption="a quiet old Japanese inn at night, gentle koto and shakuhachi, soft strings, lonely and nostalgic with a slightly eerie undertone, "
            "ambient game soundtrack, instrumental",
    sections=[
      dict(bars=16, chords=["D", "Bm", "G", "A"], drums="soft", pad="strings", arp="koto", lead="flute",
           melody=[("A4", 2), ("B4", 1), ("D5", 1), ("E5", 3), ("D5", 1), ("B4", 2), ("A4", 2), ("G4", 4), ("A4", 2), ("D5", 1), ("E5", 1),
                   ("G5", 3), ("E5", 1), ("D5", 2), ("B4", 2), ("A4", 4), ("E5", 2), ("D5", 1), ("B4", 1), ("A4", 3), ("G4", 1), ("E4", 2), ("G4", 2),
                   ("A4", 4), ("D5", 2), ("E5", 1), ("G5", 1), ("A5", 3), ("G5", 1), ("E5", 2), ("D5", 2), ("D5", 4)]),
    ]),
  # ---------------------------------------------------------------- the prologue (the user's references for its boss: big JRPG battle themes)
  "ep0_boss": dict(bpm=150, key="E minor", loop=True,
    caption="intense heroic boss battle music, orchestral rock, driving drums, heavy electric guitar riffs, a soaring brass melody, a choir, fast "
            "strings, epic JRPG battle theme, instrumental",
    sections=[
      dict(bars=4, chords=["Em", "Em", "C", "B"], drums="march", pad="choir", lead="brass", melody=[("E4", 4), ("G4", 4), ("A4", 4), ("B4", 4)]),
      dict(bars=16, chords=["Em", "C", "D", "Bm", "Em", "C", "Am", "B7"], drums="rock", bass="eighth", arp="strings", pad="strings", lead="brass",
           melody=[("E5", 2), ("D5", 1), ("B4", 1), ("C5", 2), ("G4", 2), ("A4", 1), ("B4", 1), ("C5", 1), ("D5", 1), ("B4", 4),
                   ("E5", 2), ("F#5", 1), ("G5", 1), ("A5", 2), ("G5", 1), ("F#5", 1), ("E5", 1), ("C5", 1), ("A4", 1), ("B4", 1), ("B4", 4),
                   ("G5", 2), ("F#5", 1), ("E5", 1), ("E5", 2), ("C5", 2), ("D5", 1), ("E5", 1), ("F#5", 1), ("A5", 1), ("F#5", 4),
                   ("G5", 2), ("A5", 1), ("B5", 1), ("C6", 2), ("B5", 1), ("A5", 1), ("G5", 1), ("E5", 1), ("C5", 1), ("D#5", 1), ("E5", 4)]),
      dict(bars=16, chords=["C", "D", "Em", "Em", "Am", "B", "Em", "E"], drums="march", bass="eighth", pad="choir", arp="strings", lead="choir",
           melody=[("C5", 4), ("D5", 4), ("E5", 2), ("G5", 2), ("B5", 4), ("A5", 2), ("G5", 2), ("F#5", 4), ("E5", 8),
                   ("E5", 4), ("F#5", 4), ("G5", 2), ("B5", 2), ("E6", 4), ("D6", 2), ("C6", 2), ("B5", 4), ("E5", 8)]),
    ]),
  "ep0_stage": dict(bpm=140, key="A minor", loop=True,
    caption="upbeat urgent anime school action music, energetic pop rock, fast drums, crunchy electric guitar, a bright synth arpeggio, a catchy "
            "piano melody, game soundtrack, instrumental",
    sections=[
      dict(bars=16, chords=["Am", "F", "C", "G", "Am", "F", "G", "E"], drums="rock", bass="eighth", arp="chip", pad="strings", lead="epiano",
           melody=[("A4", 1), ("C5", 1), ("E5", 1), ("D5", 1), ("C5", 2), ("A4", 2), ("G4", 1), ("A4", 1), ("C5", 1), ("D5", 1), ("E5", 4),
                   ("A4", 1), ("C5", 1), ("E5", 1), ("G5", 1), ("F5", 2), ("E5", 2), ("D5", 1), ("C5", 1), ("B4", 1), ("G#4", 1), ("A4", 4),
                   ("A5", 1), ("G5", 1), ("E5", 1), ("C5", 1), ("D5", 2), ("C5", 2), ("G4", 1), ("A4", 1), ("C5", 1), ("E5", 1), ("D5", 4),
                   ("C5", 1), ("D5", 1), ("E5", 1), ("G5", 1), ("A5", 2), ("G5", 2), ("F5", 1), ("E5", 1), ("D5", 1), ("B4", 1), ("A4", 4)]),
      dict(bars=16, chords=["F", "G", "Em", "Am", "Dm", "G", "C", "E"], drums="rock", bass="eighth", arp="chip", pad="choir", lead="chip",
           melody=[("F5", 2), ("E5", 2), ("C5", 2), ("G5", 2), ("E5", 4), (None, 4), ("D5", 2), ("E5", 2), ("F5", 2), ("E5", 1), ("D5", 1),
                   ("E5", 4), ("G#4", 4), ("F5", 2), ("G5", 2), ("A5", 2), ("G5", 2), ("E5", 4), (None, 4), ("D5", 2), ("C5", 2), ("B4", 2), ("C5", 1),
                   ("D5", 1), ("E5", 4), ("E5", 4)]),
    ]),
  # ---------------------------------------------------------------- episode 1 (sweet horror)
  "ep1_stage": dict(bpm=120, key="A minor", loop=True,
    caption="cute but creepy gothic music, a music box melody, pizzicato strings, harpsichord, soft percussion, sweet horror in a candy mansion, "
            "game soundtrack, instrumental",
    sections=[
      dict(bars=16, chords=["Am", "Dm", "E", "Am", "F", "Dm", "E", "E"], drums="soft", bass="quarter", arp="strings", pad="strings", lead="musicbox",
           melody=[("E5", 1), ("A5", 1), ("C6", 1), ("B5", 1), ("A5", 2), ("E5", 2), ("F5", 1), ("E5", 1), ("D5", 1), ("B4", 1), ("C5", 2), ("E5", 2),
                   ("A4", 1), ("C5", 1), ("E5", 1), ("A5", 1), ("G#5", 2), ("E5", 2), ("F5", 1), ("D5", 1), ("B4", 1), ("G#4", 1), ("A4", 4),
                   ("C6", 1), ("B5", 1), ("A5", 1), ("E5", 1), ("F5", 2), ("D5", 2), ("E5", 1), ("C5", 1), ("A4", 1), ("B4", 1), ("C5", 4),
                   ("A4", 1), ("B4", 1), ("C5", 1), ("E5", 1), ("D5", 2), ("B4", 2), ("C5", 1), ("B4", 1), ("A4", 1), ("G#4", 1), ("A4", 4)]),
      dict(bars=16, chords=["F", "G", "C", "Am", "Dm", "E", "Am", "Am"], drums="waltz", bass="quarter", arp="strings", pad="choir", lead="strings",
           melody=[("A5", 3), ("G5", 1), ("F5", 2), ("E5", 2), ("D5", 3), ("C5", 1), ("B4", 4), ("C5", 2), ("E5", 2), ("A5", 2), ("G#5", 2), ("A5", 8),
                   ("C6", 3), ("B5", 1), ("A5", 2), ("G5", 2), ("F5", 3), ("E5", 1), ("D5", 4), ("E5", 2), ("G#5", 2), ("B5", 2), ("E6", 2), ("A5", 8)]),
    ]),
  "ep1_boss": dict(bpm=140, key="C minor", loop=True,
    caption="dark gothic boss battle music, a pipe organ, a dramatic choir, frantic strings, heavy drums, a twisted waltz feel, sweet horror, "
            "intense, game soundtrack, instrumental",
    sections=[
      dict(bars=16, chords=["Cm", "Ab", "Fm", "G", "Cm", "Ab", "Bb", "G"], drums="rock", bass="eighth", arp="strings", pad="choir", lead="brass",
           melody=[("C5", 2), ("Eb5", 1), ("D5", 1), ("C5", 2), ("G4", 2), ("Ab4", 1), ("Bb4", 1), ("C5", 1), ("D5", 1), ("B4", 4),
                   ("C5", 2), ("G5", 1), ("F5", 1), ("Eb5", 2), ("C5", 2), ("D5", 1), ("Eb5", 1), ("F5", 1), ("D5", 1), ("G5", 4),
                   ("Ab5", 2), ("G5", 1), ("F5", 1), ("Eb5", 2), ("C5", 2), ("Db5", 1), ("C5", 1), ("Bb4", 1), ("Ab4", 1), ("G4", 4),
                   ("C5", 1), ("D5", 1), ("Eb5", 1), ("F5", 1), ("G5", 2), ("Eb5", 2), ("D5", 1), ("B4", 1), ("G4", 1), ("B4", 1), ("C5", 4)]),
      dict(bars=16, chords=["Ab", "Bb", "Gm", "Cm", "Fm", "G", "Cm", "Cm"], drums="march", bass="quarter", pad="choir", arp="strings", lead="choir",
           melody=[("Eb5", 4), ("F5", 4), ("D5", 2), ("G5", 2), ("Eb5", 4), ("C5", 2), ("F5", 2), ("D5", 2), ("B4", 2), ("C5", 8),
                   ("G5", 4), ("Ab5", 4), ("F5", 2), ("Bb5", 2), ("G5", 4), ("Ab5", 2), ("G5", 2), ("F5", 2), ("D5", 2), ("C5", 8)]),
    ]),
}
