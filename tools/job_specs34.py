# Round 34: the R23 monster sheets that had attack effects drawn in (docs/ART.md: no effects in the art) are cleaned: the same sheet, pixel
# for pixel, with only the effects removed (the game draws sound waves, shards and chalk itself).
NOREDESIGN = ("Reference image 1 is an approved game sprite sheet (3 x 2 poses of one monster on a transparent background). This is NOT a "
              "redesign task. Output the SAME sprite sheet, pixel for pixel the same monster, poses, positions, sizes, colours and line work, "
              "on a transparent background, with ONLY these removed: ")
JOBS = {
    "R34_clean": [
        ("art/raw/r34/horn.png", ["art/raw/r23/horn.png"], NOREDESIGN +
         "every glowing pink sound wave, ring of sound, light burst, glow and sparkle around the horns in the bottom row (wind-up and blast "
         "poses). Where they covered the monster, continue the monster as it is drawn in the other poses. Keep the horns, lips, cables, bows "
         "and frills exactly."),
        ("art/raw/r34/frame.png", ["art/raw/r23/frame.png"], NOREDESIGN +
         "every flying mirror shard, light burst, glow and sparkle in the bottom row (wind-up and firing poses), and the loose photo falling "
         "out in the last pose. Where they covered the monster, continue the monster as it is drawn in the other poses."),
        ("art/raw/r34/board.png", ["art/raw/r23/board.png"], NOREDESIGN +
         "every flying chalk stick, chalk dust cloud, motion streak, glow and sparkle around the monster (keep the chalk stick it holds in "
         "its hand in the wind-up pose). Where they covered the monster, continue the monster as it is drawn in the other poses."),
    ],
}
