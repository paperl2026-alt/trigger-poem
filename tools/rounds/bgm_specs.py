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
  # ---------------------------------------------------------------- the prologue and episode 1 (user 2026-10-20: the references in
  # Downloads\BGM - commercial, heard for their style only: the Kuon piece for the bosses, the Kusarihime ones for the stages). Measured
  # (tools: ffmpeg + numpy): the boss reference about 103 bpm in D minor, the stage ones 84 - 129 bpm, all warm and mid-heavy, sustained
  # layers, little bass and little drumming - ours were two thirds bass and pounding. So: the bosses in the miyako-bushi scale (D Eb G A
  # Bb / C Db F G Ab) on drones and a koto ostinato, a bending shakuhachi line, the taiko only in the second half, the prologue's with the
  # girls chanting (vocals); the stages slow-building, layered pads, an electric piano / music box line, a soft pulse.
  "ep0_boss": dict(bpm=104, key="D minor", loop=True,
    caption="dark Japanese horror boss battle music, eerie and ritualistic, two female voices chanting in Japanese, a droning low choir, a "
            "shakuhachi with bending notes, koto and shamisen ostinato, deep taiko pulses, a temple bell, tense and haunting, warm and "
            "mid-heavy, light bass, game soundtrack",
    vocals="[intro]\n\n[verse]\nりん ぴょう とう しゃ かい じん れつ ざい ぜん\nりん ぴょう とう しゃ かい じん れつ ざい ぜん\n\n[chorus]\n"
           "きゅうきゅう にょりつりょう\nあくりょう たいさん はらいたまえ\n\n[verse]\nオン アビラウンケン ソワカ\nねむれ ねむれ もう かえれない\n\n"
           "[chorus]\nりん ぴょう とう しゃ かい じん れつ ざい ぜん\nきゅうきゅう にょりつりょう",
    sections=[
      dict(bars=4, chords=["Dm"], pad="choir", bell=2, lead="flute",
           melody=[("A4", 3), ("Bb4", 1), ("A4", 4), ("G4", 2), ("Eb4", 2), ("D4", 4)]),
      dict(bars=16, chords=["Dm", "Dm", "Eb", "Eb", "Gm", "Gm", "Dm", "A"], drums="heart", pad="choir", lead="flute",
           ostinato=["D4", "A3", "D4", "Eb4", "D4", "A3", "G3", "A3"],
           melody=[("D5", 2), ("Eb5", 1), ("D5", 1), ("A4", 4), ("Bb4", 2), ("A4", 1), ("G4", 1), ("A4", 4),
                   ("G4", 2), ("A4", 1), ("Bb4", 1), ("A4", 2), ("G4", 2), ("Eb4", 3), ("D4", 1), ("D4", 4),
                   ("A4", 2), ("D5", 2), ("Eb5", 3), ("D5", 1), ("Bb4", 2), ("A4", 2), ("G4", 4),
                   ("A4", 1), ("Bb4", 1), ("A4", 1), ("G4", 1), ("Eb4", 2), ("G4", 2), ("D4", 6), (None, 2)]),
      dict(bars=16, chords=["Gm", "Gm", "Dm", "Dm", "Eb", "Eb", "A", "A"], drums="taiko", bass="quarter", pad="strings", arp="shamisen", lead="koto",
           melody=[("D5", 1), ("D5", 1), ("Eb5", 2), ("G5", 2), ("A5", 2), ("G5", 1), ("Eb5", 1), ("D5", 2), ("Bb4", 4),
                   ("A4", 2), ("Bb4", 2), ("D5", 2), ("Eb5", 2), ("D5", 4), (None, 4),
                   ("G5", 2), ("A5", 2), ("Bb5", 2), ("A5", 2), ("G5", 1), ("Eb5", 1), ("D5", 2), ("A4", 4),
                   ("Bb4", 1), ("A4", 1), ("G4", 1), ("Eb4", 1), ("D4", 4), ("Eb4", 2), ("D4", 6)]),
      dict(bars=8, chords=["Dm", "Eb", "Dm", "A"], drums="heart", pad="choir", bell=4, lead="flute",
           melody=[("D5", 4), ("Eb5", 4), ("D5", 4), ("A4", 4), ("Bb4", 4), ("A4", 4), ("G4", 4), ("A4", 4)]),
    ]),
  "ep1_boss": dict(bpm=96, key="C minor", loop=True,
    caption="dark Japanese horror boss music in a haunted mansion, ritualistic and sorrowful, a wordless female choir wailing, a music box, "
            "koto ostinato, a shakuhachi with bending notes, deep taiko pulses, tremolo strings, tense, warm and mid-heavy, light bass, "
            "game soundtrack, instrumental",
    sections=[
      dict(bars=4, chords=["Cm"], pad="strings", lead="musicbox",
           melody=[("G5", 2), ("Ab5", 2), ("G5", 4), ("F5", 2), ("Db5", 2), ("C5", 4)]),
      dict(bars=16, chords=["Cm", "Cm", "Db", "Db", "Fm", "Fm", "Cm", "G"], drums="heart", pad="choir", lead="flute",
           ostinato=["C4", "G3", "C4", "Db4", "C4", "G3", "F3", "G3"],
           melody=[("G4", 1), ("C5", 1), ("Db5", 2), ("C5", 2), ("G4", 2), ("Ab4", 3), ("G4", 1), ("F4", 4),
                   ("Db4", 2), ("F4", 2), ("G4", 2), ("Ab4", 2), ("G4", 6), (None, 2),
                   ("C5", 1), ("Db5", 1), ("F5", 2), ("G5", 2), ("F5", 1), ("Db5", 1), ("C5", 4), ("Ab4", 4),
                   ("G4", 2), ("Ab4", 1), ("G4", 1), ("F4", 2), ("Db4", 2), ("C4", 8)]),
      dict(bars=16, chords=["Fm", "Fm", "Cm", "Cm", "Db", "Db", "G", "G"], drums="taiko", bass="quarter", pad="strings", arp="koto", lead="strings",
           melody=[("C5", 3), ("Db5", 1), ("C5", 2), ("Ab4", 2), ("G4", 4), ("F4", 4),
                   ("Ab4", 3), ("G4", 1), ("F4", 2), ("Db4", 2), ("C4", 8),
                   ("F5", 2), ("G5", 2), ("Ab5", 4), ("G5", 2), ("F5", 2), ("Db5", 4),
                   ("C5", 2), ("Db5", 2), ("C5", 2), ("Ab4", 2), ("G4", 8)]),
      dict(bars=8, chords=["Cm", "Db", "Cm", "G"], pad="choir", bell=4, lead="musicbox",
           melody=[("G5", 4), ("Ab5", 4), ("G5", 4), ("F5", 4), ("Db5", 4), ("C5", 4), ("Db5", 4), ("C5", 4)]),
    ]),
  "ep0_stage": dict(bpm=92, key="A minor", loop=True,
    caption="melancholic dark ambient game music, dreamy and decadent, warm layered synth pads and strings, a lonely electric piano melody, "
            "a soft pulsing bass, light gentle percussion, slow build, eerie but beautiful, warm and mid-heavy, instrumental",
    sections=[
      dict(bars=4, chords=["Am", "F"], pad="strings", lead="epiano",
           melody=[("E5", 2), ("C5", 2), ("A4", 4), ("G4", 2), ("A4", 2), ("E4", 4)]),
      dict(bars=16, chords=["Am", "F", "C", "G", "Am", "F", "Dm", "E"], drums="soft", bass="whole", pad="strings", lead="epiano",
           melody=[("A4", 2), ("C5", 1), ("E5", 1), ("D5", 2), ("C5", 2), ("B4", 3), ("A4", 1), ("G4", 4),
                   ("A4", 2), ("C5", 1), ("E5", 1), ("F5", 2), ("E5", 2), ("D5", 4), ("C5", 2), ("B4", 2),
                   ("C5", 2), ("B4", 1), ("A4", 1), ("G4", 2), ("A4", 2), ("F4", 4), ("E4", 4),
                   ("D4", 2), ("E4", 1), ("F4", 1), ("A4", 2), ("G#4", 2), ("A4", 8)]),
      dict(bars=16, chords=["F", "G", "Em", "Am", "F", "G", "E", "E"], drums="soft", bass="quarter", pad="choir", arp="strings", lead="strings",
           melody=[("A5", 3), ("G5", 1), ("F5", 2), ("E5", 2), ("D5", 2), ("E5", 2), ("C5", 4),
                   ("B4", 2), ("C5", 2), ("D5", 2), ("E5", 2), ("B4", 8),
                   ("A5", 3), ("G5", 1), ("F5", 2), ("E5", 2), ("D5", 2), ("C5", 2), ("B4", 4),
                   ("C5", 2), ("B4", 2), ("A4", 2), ("G#4", 2), ("A4", 8)]),
      dict(bars=8, chords=["Am", "F", "Dm", "E"], pad="strings", lead="musicbox",
           melody=[("E5", 4), ("D5", 4), ("C5", 4), ("B4", 4), ("A4", 4), ("C5", 4), ("B4", 8)]),
    ]),
  "ep1_stage": dict(bpm=84, key="D minor", loop=True,
    caption="melancholic gothic ambient game music in a decaying mansion, dreamy and eerie, warm layered strings and choir pads, an electric "
            "piano and a music box melody, a soft heartbeat pulse, slow and hypnotic, sad and beautiful, warm and mid-heavy, instrumental",
    sections=[
      dict(bars=4, chords=["Dm", "Bb"], pad="choir", lead="musicbox",
           melody=[("A5", 2), ("F5", 2), ("D5", 4), ("C5", 2), ("D5", 2), ("A4", 4)]),
      dict(bars=16, chords=["Dm", "Bb", "Gm", "A", "Dm", "Bb", "C", "A"], drums="heart", bass="whole", pad="strings", lead="epiano",
           melody=[("D5", 3), ("E5", 1), ("F5", 2), ("E5", 2), ("D5", 2), ("C5", 2), ("A4", 4),
                   ("Bb4", 2), ("A4", 2), ("G4", 2), ("F4", 2), ("E4", 4), ("A4", 4),
                   ("D5", 3), ("E5", 1), ("F5", 2), ("G5", 2), ("A5", 4), ("F5", 4),
                   ("E5", 2), ("D5", 2), ("C#5", 2), ("E5", 2), ("D5", 8)]),
      dict(bars=16, chords=["Gm", "C", "F", "Bb", "Gm", "A", "Dm", "Dm"], drums="soft", bass="quarter", pad="choir", arp="strings", lead="strings",
           melody=[("G5", 2), ("F5", 2), ("E5", 2), ("D5", 2), ("C5", 4), ("F5", 4),
                   ("Bb4", 2), ("C5", 2), ("D5", 2), ("Bb4", 2), ("A4", 8),
                   ("G5", 2), ("A5", 2), ("Bb5", 2), ("A5", 2), ("G5", 2), ("E5", 2), ("C#5", 4),
                   ("D5", 2), ("E5", 2), ("F5", 2), ("E5", 2), ("D5", 8)]),
      dict(bars=8, chords=["Dm", "Gm", "Bb", "A"], pad="strings", bell=4, lead="musicbox",
           melody=[("A5", 4), ("G5", 4), ("F5", 4), ("E5", 4), ("D5", 4), ("F5", 4), ("E5", 8)]),
    ]),
}
