# Round 118: the prologue's small enemies redrawn with longer, grown-up proportions. They are all an object on short stubby girl legs
# (two heads tall, chibi); the prologue boss is a girl of normal height. Test on one frame of each enemy's first look (a / b); the other
# frames and the b / c looks follow once a direction is chosen. The enemy's own frame is the thing to redraw; the boss standing frame is
# only for the proportions.
MODE = "brief"
R = "art/raw/r118/"
BOSS = "public/content/base/levels/ep0/assets/boss/qq_s1_idle0.webp"
BASE = "public/content/base/assets/enemy/"
EP0 = "public/content/base/levels/ep0/assets/enemy/"
FRAMES = {
    "desk": BASE + "desk_walk0.webp",
    "board": BASE + "board_idle.webp",
    "chair": EP0 + "chair_walk0.webp",
    "book": EP0 + "book_idle.webp",
    "clock": EP0 + "clock_idle.webp",
    "ext": EP0 + "ext_idle.webp",
    "drip": EP0 + "drip_idle.webp",
}
HOW = """An enemy sprite for an anime horror shooting game: one frame, the whole figure, transparent background, nothing else in the picture (no ground, no shadow, no text, no effects).
Redraw the enemy in the first reference image with new proportions. Everything else stays as it is: the same monster, the same object, the same parts, colours, clothes, shoes, hair, ribbons, faces, mouths, pose and drawing style. Add nothing and leave nothing out.
What changes: now it is small and squat - short stubby legs under a big object, like a chibi. Give its girl parts grown-up proportions like the girl in the second reference image: long slim legs with the knee halfway between hip and heel, full-length arms where it has arms. The object part becomes small against the whole: about a quarter of the whole height or less. The whole creature is tall and big.
The second reference image is only for those proportions: take nothing else from it - not its tentacles, eyes, hair, uniform, colours or pose.
"""
JOBS = {f"R118_{k}": [(f"{R}{k}_{v}.png", [ref, BOSS], HOW) for v in "ab"] for k, ref in FRAMES.items()}
