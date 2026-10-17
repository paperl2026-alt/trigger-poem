# Round 17: the girls on the title screen must be the girls of the reference mockup (art/ref/ui_p5.png), same pose, same place.
# Codex only separates them from the background; the import aligns the result back onto the mockup 1:1.
NOREDESIGN = "This is NOT a redesign task. "
MOCK = "art/ref/ui_p5.png"

JOBS = {
    "R17_girls": [
        ("art/raw/r17/girls_ref.png", [MOCK],
         "Reference image 1 is an approved game title / settings screen. " + NOREDESIGN +
         "Output the SAME 16:9 image with ONLY the two anime girls kept, exactly as they are drawn in reference image 1: the same pose, the same faces, hair, "
         "ears, glasses, hands, the raised white fur paw arm with red claws, clothes, bells, ribbons and colors, at exactly the same position and size in the frame, "
         "pixel for pixel. Do not move, redraw, restyle or re-pose them. Where a small part of a girl is hidden behind the black city silhouette at the bottom or "
         "behind the white sakura flowers, continue that part of the girl as it obviously continues. Everything else (the white settings panel with all its UI, "
         "the red and black background, the sakura, the city silhouette, the ink flecks) removed and fully transparent."),
    ],
}
