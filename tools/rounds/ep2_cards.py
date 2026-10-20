"""Episode 2's pictures on the select screen: its chapter card (the same card shape as the others, tools/rounds/r59_import.py card(): the bell
tower's concept painting inside, toned in the inn's lacquer red over indigo night) and the thumbnail of its one stage (a strip of the entrance
hall's concept painting, like episode 1's thumbnails). usage: python -I tools/rounds/ep2_cards.py"""
import json, pathlib, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
A = ROOT / "public" / "content" / "base" / "assets"
sys.path[:0] = [str(ROOT / "tools" / "rounds"), str(ROOT / "tools")]
import packs  # noqa: E402   (where content lives: the base pack or a chapter's level pack, docs/TECH.md「关卡包」)
from r59_import import card

TONE = ((8, 6, 24), (170, 52, 48), (255, 222, 176))
if __name__ == "__main__":
    man = packs.manifest()
    im = card(ROOT / "art" / "raw" / "r62" / "sc_kane_a.png", Image.open(man.path("ui/sel_next_ep1")), TONE)
    im.save(man.dir("ui/sel_card_ep2") / "assets" / "ui" / "sel_card_ep2.webp", quality=90, method=6); man["ui/sel_card_ep2"] = {"dom": True, "src": "assets/ui/sel_card_ep2.webp", "w": im.width, "h": im.height}
    src = Image.open(ROOT / "art" / "raw" / "r62" / "sc_genkan_a.png").convert("RGB"); W, H = src.size
    h = round(W * 363 / 1200); y0 = (H - h) // 2 + H // 10
    th = src.crop((0, y0, W, y0 + h)).resize((1200, 363), Image.LANCZOS)
    th.save(man.dir("ui/sel_thumb_ep2_inn") / "assets" / "ui" / "sel_thumb_ep2_inn.webp", quality=88, method=6); man["ui/sel_thumb_ep2_inn"] = {"dom": True, "src": "assets/ui/sel_thumb_ep2_inn.webp", "w": 1200, "h": 363}
    man.save()
    print("ok", im.size)
