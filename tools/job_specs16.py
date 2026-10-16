# Round 16: the title girls layer is cut by straight lines (the white fur sleeve at the left edge, both bodies along the bottom),
# which shows on screen. Codex only continues the drawing past those cuts; tools/r16_import.py puts the original pixels
# (with the canonical seal) back on top, so only the new parts come from this job.
NOREDESIGN = "This is NOT a redesign task. "

JOBS = {
    "R16_girls_ext": [
        ("art/raw/r16/girls_ext.png", ["art/ref/p5_parts/girls_pad.png"],
         "Reference image 1 shows two anime girls on a transparent background, already approved. " + NOREDESIGN +
         "The drawing is cut off by straight lines: the white fluffy fur sleeve on the left girl is cut by a vertical line at the left, and both girls' bodies and clothes "
         "are cut by a horizontal line near the bottom, with empty space below and to the left. Output the SAME image at the same framing, with the same two girls exactly "
         "as drawn (same faces, pose, colors, clothes, line art, the red seal on the fur sleeve), and ONLY continue the drawing naturally past those straight cuts: "
         "the fur sleeve continues to the left and downward, the kimono, sash, bells, tassels and the pink dress continue down to the very bottom edge of the image. "
         "No new objects, no hands or legs added, no background. Everything that is not the girls stays fully transparent."),
    ],
}
