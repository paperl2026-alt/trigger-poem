# Round 21: tutorial (prologue) monster + boss concept sheets for the user to approve (docs/DESIGN.md "怪物").
# Direction from the user: like the mirror / photo-frame girl and the megaphone girl in art/ref/monster_ref.webp: the whole creature
# reads as a strange but cute, girlified monster ("怪但娘化"); NOT an object with a woman's eyes / mouth / nose stuck on it.
# The monsters are the classmates, teachers and school objects warped by the unknown energy that hit the school.
REF = "art/ref/monster_ref.webp"
STYLE = ("Reference image 1 shows the approved art direction for this game's monsters: look at how the photo-frame / mirror girl and the megaphone "
         "girl are made, a strange creature that as a whole is clearly a cute girlified monster (body, silhouette, hair, clothes, pose all girl-like), "
         "not an object with a woman's face stuck on it. Same anime art style as reference image 1, clean line art with a white sticker outline, "
         "full colour. Draw a character concept sheet on a plain light grey background: the monster large in full body, front three-quarter view, "
         "and next to it the same monster smaller in its attack pose. No text, no labels, no letters anywhere. 16:9. ")
JOBS = {
    "R21_monsters": [
        ("art/raw/r21/m_desk.png", [REF], STYLE + "The monster: a classmate schoolgirl warped into one with her own school desk and chair: the desk lid opens around her like a "
         "hood and shield, the chair legs have become four long slender spider-like legs under her pleated skirt, pencils and erasers float around her; "
         "attack pose: she snaps the desk lid open and flings a fan of pencils."),
        ("art/raw/r21/m_notebook.png", [REF], STYLE + "The monster: a classmate warped into a girl made of notebooks and loose homework pages: a skirt of fanned ruled paper, "
         "hair of long paper strips, sleeves of rolled exercise books, red-pen correction marks like tattoos, she floats; attack pose: a storm of paper planes."),
        ("art/raw/r21/m_chalk.png", [REF], STYLE + "The monster: a young female homeroom teacher warped into one with the classroom blackboard: the green chalkboard is her long "
         "coat and torso, chalk sticks are her hairpins and fingertips, the eraser is a hair ornament, chalk dust swirls around her; attack pose: she writes "
         "a huge glowing formula in the air (a long wind-up) before it bursts into a chalk barrage."),
        ("art/raw/r21/m_frame.png", [REF], STYLE + "The monster: a girl assembled from the hallway's photo frames and a cracked full-length mirror: the mirror is her skirt "
         "and her reflections inside the frames move on their own, frames hang like a cape and twin tails; attack pose: mirror shards fly out while her "
         "reflections in the frames all aim at the viewer."),
        ("art/raw/r21/m_horn.png", [REF], STYLE + "The monster: a girl warped into the school's PA system: her twin tails are two brass megaphone horns, speaker grilles on "
         "her chest like a frilly bib, cables like ribbons, a small microphone on her headband; attack pose: she inhales, both horns glow, about to blast a "
         "huge visible sound wave."),
        ("art/raw/r21/m_shoe.png", [REF], STYLE + "The monster: a girl warped into the shoe lockers at the school entrance: locker doors fold around her like a hooded cape, "
         "white indoor school slippers orbit her, the locker shelves form a frilly layered skirt; attack pose: the locker doors burst open and a volley of "
         "slippers shoots out."),
    ],
    "R21_bosses": [
        ("art/raw/r21/b_coach.png", [REF], STYLE.replace("the monster large in full body, front three-quarter view, and next to it the same monster smaller in its attack pose",
         "the same boss in three forms side by side from left to right, each larger than the one before") + "The schoolyard boss, option A: the PE teacher "
         "warped by the energy. Form 1: a tall sporty woman in a track jersey with a whistle and a starting pistol, summoning hurdles. Form 2: she fuses with "
         "the vaulting box, the mats and the hurdles into a big charging beast-girl, her glowing whistle core hidden deep inside the vaulting box. Form 3: the "
         "running track lanes become huge ribbons around her and the field lines glow, the core now exposed on her chest."),
        ("art/raw/r21/b_flag.png", [REF], STYLE.replace("the monster large in full body, front three-quarter view, and next to it the same monster smaller in its attack pose",
         "the same boss in three forms side by side from left to right, each larger than the one before") + "The schoolyard boss, option B: the student "
         "council president warped together with the school's flagpole and flag. Form 1: an elegant girl with the council armband holding the school flag like "
         "a spear. Form 2: the flag becomes a vast cape that wraps and hides her glowing crest-shaped core, the flagpole a giant lance. Form 3: a towering form "
         "with flag-banner wings and the school crest opened like an eye on her chest."),
    ],
}
