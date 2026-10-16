# Round 22: the corridor 2.5D test (docs/DESIGN.md "场景的 3D 感"): the user's corridor concept split into an empty background plate
# (projected onto a depth mesh made with Depth Anything V2) and the near cover pieces (each its own relief mesh). Strict decomposition.
REF = "art/ref/corridor_concept.png"
NOREDESIGN = "This is NOT a redesign task. "
JOBS = {
    "R22_corridor": [
        ("art/raw/r22/corridor_plate.png", [REF],
         "Reference image 1 is an approved concept of a school corridor scene. " + NOREDESIGN +
         "Output the SAME 16:9 image, same size, same camera, same perspective, same sunset light, colours and painting style, with ONLY these removed and the "
         "corridor behind them painted in naturally: both girls, every monster (the megaphone monster, the bulletin-board monster, the photo-frame girl, the "
         "shoe-locker monster), all flying papers, shoes, bullets, shells and muzzle / magic flashes, the wheeled bookshelf cart at the left front and the bench "
         "with the shoe shelf at the right front. Keep the floor (with its raised wooden folds), walls, windows, lockers, notice boards, banners and the view "
         "outside exactly as they are.", "OPAQUE"),
        ("art/raw/r22/cover_cart.png", [REF],
         "Reference image 1 is an approved concept of a school corridor scene. " + NOREDESIGN +
         "Output the SAME 16:9 image, same size, with ONLY the wheeled wooden bookshelf cart at the left front kept, exactly as drawn there (same shape, books, "
         "shoes, wheels, light), at exactly the same position and size. Where the girl hides behind it, continue the cart as it obviously continues. "
         "Everything else fully transparent."),
        ("art/raw/r22/cover_bench.png", [REF],
         "Reference image 1 is an approved concept of a school corridor scene. " + NOREDESIGN +
         "Output the SAME 16:9 image, same size, with ONLY the low wooden bench with the shoe shelf at the right front kept, exactly as drawn there, at exactly "
         "the same position and size. Where the cat girl crouches in front of it, continue the bench as it obviously continues. Everything else fully transparent."),
    ],
}

JOBS["R22_bench"] = [
    ("art/raw/r22/cover_bench.png", ["art/raw/r22/cover_bench_prev.png"],
     "Reference image 1 shows a low wooden bench with a shoe shelf, and a white-haired cat girl crouching on and in front of it, on a transparent background. "
     + NOREDESIGN + "Output the SAME image, same size, the bench at exactly the same position, size, shape, colours and light, but with the girl completely "
     "REMOVED (no girl, no hair, no tail, no clothes, no shoes of hers): continue the bench and its shoe shelf where she covered it, as it obviously "
     "continues, with the indoor slippers on its shelves. Everything that is not the bench stays fully transparent."),
]

# windows: the plate with its window panes cut out, and the outside view on its own far layer (seen through the frames when the camera moves)
JOBS["R22_window"] = [
    ("art/raw/r22/corridor_nowin.png", ["art/raw/r22/corridor_plate.png"],
     "Reference image 1 is an approved empty school corridor. " + NOREDESIGN + "Output the SAME image, same size, pixel for pixel the same, except that every "
     "window pane through which the outside is seen (the sky, clouds, buildings, trees, fence and running track outside the big windows on the right, and any "
     "other window showing the outside) is made fully transparent. Keep the window frames, mullions, curtains, sills and everything inside the corridor exactly as they are."),
    ("art/raw/r22/corridor_outside.png", ["art/raw/r22/corridor_plate.png"],
     "Reference image 1 is an approved empty school corridor. " + NOREDESIGN + "Output ONLY the view outside the windows, as one continuous wide landscape picture "
     "in the same sunset light and painting style: the same sky, clouds, school buildings, trees, fence and red running track, at the same place, size and "
     "perspective as seen through the windows, and continue that landscape naturally behind the window frames, mullions and curtains so it is complete. "
     "Everything below and left of the windows (the corridor itself) fully transparent.", "OPAQUE"),
]
