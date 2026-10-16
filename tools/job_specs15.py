# Round 15: the title / settings screen in the user's chosen P5-like style (art/ref/ui_p5.png). Strict decomposition again:
# Codex isolates exactly what is in the mockup. The controls (toggles, sliders, segmented tabs, START / QUIT slabs, lines) are
# drawn by the game itself from the measured layout; text is a bundled bold font. Characters: the approved girls layer.
P = "art/ref/p5_parts/"
MOCK = "art/ref/ui_p5.png"
NOREDESIGN = "This is NOT a redesign task. "


def strict(what, extra=""):
    return ("Reference image 1 is a crop from an approved game UI mockup. " + NOREDESIGN +
            f"Reproduce ONLY the {what} exactly as it looks there: same shape, same proportions, same colors, same line weight. "
            "Everything else fully transparent. Do not add anything. Make it fill most of the image, keeping its aspect ratio. " + extra)


JOBS = {
    "R15_bg": [
        ("art/raw/r15/p5_back.png", [MOCK],
         "Reference image 1 is an approved game title / settings screen. " + NOREDESIGN +
         "Output the SAME 16:9 image with the same composition, colors and graphic style, but with these removed and the background behind them painted in naturally: "
         "both girls, the whole white settings panel on the left (with every icon, text, toggle, slider, button and line on it), the white sakura flowers, the city silhouette at the bottom and the loose black ink flecks. "
         "Keep only the bold red and black diagonal shapes, the red halftone dot areas, the red window-grid shapes and the white gaps between the shapes, filling the whole frame.", "OPAQUE"),
        ("art/raw/r15/p5_panel.png", [MOCK],
         "Reference image 1 is an approved game title / settings screen. " + NOREDESIGN +
         "Output ONLY the big off-white panel on the left, exactly as in reference image 1: the same outline with its rough grunge / ink-splatter edges, "
         "the black and white jagged slashes along its edges and the halftone dot fringes. Remove everything drawn ON the panel (icons, text, toggles, sliders, "
         "tabs, lines, the red header slash, the red and black START / QUIT buttons) and fill there with the same clean off-white paper texture. "
         "Everything outside the panel fully transparent."),
        ("art/raw/r15/p5_front.png", [MOCK],
         "Reference image 1 is an approved game title / settings screen. " + NOREDESIGN +
         "Output ONLY these foreground decorations exactly as and where they are in reference image 1, at the same position in a 16:9 frame: the white sakura flowers "
         "at the top right, the black city skyline silhouette along the bottom, and the loose black ink flecks and splatters. Everything else fully transparent."),
    ],
    "R15_icons": [
        ("art/raw/r15/icon_gear.png", [P + "icon_gear.png"], strict("black gear icon")),
        ("art/raw/r15/icon_speaker.png", [P + "icon_speaker.png"], strict("black speaker icon with its sound waves")),
        ("art/raw/r15/icon_speaker_off.png", [P + "icon_speaker_off.png"], strict("grey (disabled) speaker icon with its sound waves")),
        ("art/raw/r15/icon_globe.png", [P + "icon_globe.png"], strict("black globe icon")),
        ("art/raw/r15/icon_monitor.png", [P + "icon_monitor.png"], strict("black computer monitor icon")),
        ("art/raw/r15/icon_exit.png", [P + "icon_exit.png"], strict("white exit / log-out icon (a door bracket with an arrow)")),
        ("art/raw/r15/icon_play.png", [P + "icon_play.png"], strict("white play triangle")),
        ("art/raw/r15/header_slash.png", [P + "header_slash.png"], strict("red brush slash shapes under and left of the header (only the red shapes)", "Remove the gear icon and the text.")),
    ],
}

# the whole screen without the girls and without the UI drawn on the panel: the panel keeps exactly the mockup's shape
JOBS["R15_plate"] = [
    ("art/raw/r15/p5_plate.png", [MOCK],
     "Reference image 1 is an approved game title / settings screen. " + NOREDESIGN +
     "Output the SAME 16:9 image, pixel for pixel the same composition, shapes, colors and graphic style, with ONLY these removed: both girls (paint the red and black "
     "shapes behind them naturally), and every UI element drawn on the white panel (the gear icon, all text, the red header slash, the speaker / globe / monitor icons, "
     "the toggles, sliders, percentages, the grey separator lines, the language and display tab bars, the red START slab and the black QUIT slab). "
     "Fill where the UI was with the same clean off-white panel; where the START / QUIT slabs were, continue the panel and the black-and-white jagged shards around it. "
     "Keep the white panel's exact outline and grunge edges, the white sakura, the city skyline and the ink flecks.", "OPAQUE"),
]
