# Builds one lineup sheet per round/egg group: out/lineups/<group>.png  (python3 lineup.py)
import json, re, os
from PIL import Image, ImageDraw, ImageFont, ImageChops
pets = json.load(open('pets.json'))
snake = lambda k: re.sub(r'([a-z])([A-Z])', r'\1_\2', k).lower()
COL = {'Common': (110,110,110), 'Uncommon': (30,150,60), 'Rare': (130,60,200), 'Epic': (40,110,220), 'Legendary': (235,150,20),
       'Mythic': (220,40,90), 'Godly': (200,30,30), 'Secret': (30,30,30), 'Celestial': (60,170,220), 'Divine': (240,190,30),
       'Robux egg': (0,160,120), 'Admin': (120,0,160)}
def crop(im):
    bb = ImageChops.difference(im, Image.new(im.mode, im.size, (255,255,255))).getbbox(); return im.crop(bb) if bb else im
fb = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
F, S, T = ImageFont.truetype(fb, 30), ImageFont.truetype(fb, 20), ImageFont.truetype(fb, 46)
groups = {}
for p in pets: groups.setdefault(p['group'], []).append(p)
os.makedirs('out/lineups', exist_ok=True)
for gi, (g, ps) in enumerate(groups.items()):
    CW, CH, cols = 400, 400, 4; rows = (len(ps) + cols - 1) // cols
    sheet = Image.new('RGB', (CW * cols, 90 + (CH + 86) * rows), 'white'); d = ImageDraw.Draw(sheet)
    w = d.textlength(g, font=T); d.text(((CW * cols - w) / 2, 20), g, fill=(20,20,20), font=T)
    for i, p in enumerate(ps):
        mod = p['key'] if os.path.exists(f"out/{p['key']}") else snake(p['key'])
        im = crop(Image.open(f"out/{mod}/preview_three_quarter.png").convert('RGB'))
        s = min((CW - 30) / im.width, (CH - 20) / im.height); im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
        r, c = divmod(i, cols); last = len(ps) - r * cols
        off = (cols - last) * CW / 2 if r == rows - 1 and last < cols else 0
        x = int(c * CW + off); y = 90 + r * (CH + 86)
        sheet.paste(im, (x + (CW - im.width) // 2, y + CH - im.height))
        t = p['name']; f = F if d.textlength(t, font=F) < CW - 10 else S
        d.text((x + (CW - d.textlength(t, font=f)) / 2, y + CH + 2), t, fill=(20,20,20), font=f)
        rt = p['rarity'].upper(); rw = d.textlength(rt, font=S) + 32
        d.rounded_rectangle((x + (CW - rw) / 2, y + CH + 42, x + (CW + rw) / 2, y + CH + 72), radius=15, fill=COL.get(p['rarity'], (90,90,90)))
        d.text((x + (CW - rw) / 2 + 16, y + CH + 45), rt, fill='white', font=S)
    name = f"{gi+1:02d}_" + re.sub(r'[^a-z0-9]+', '-', g.lower()).strip('-')
    sheet.save(f'out/lineups/{name}.png', optimize=True); print(name, len(ps))
