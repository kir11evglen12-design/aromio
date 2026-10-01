"""Inject premium PowerPoint transitions (Morph, Curtains, Prestige) into a pptxgenjs deck."""
import re, shutil, sys, zipfile

MC = "http://schemas.openxmlformats.org/markup-compatibility/2006"
P14 = "http://schemas.microsoft.com/office/powerpoint/2010/main"
P15 = "http://schemas.microsoft.com/office/powerpoint/2012/main"
P159 = "http://schemas.microsoft.com/office/powerpoint/2015/09/main"


def alt(requires, ns, inner, dur, fallback):
    return (f'<mc:AlternateContent xmlns:mc="{MC}">'
            f'<mc:Choice xmlns:p14="{P14}" {ns} Requires="{requires}">'
            f'<p:transition spd="slow" p14:dur="{dur}">{inner}</p:transition></mc:Choice>'
            f'<mc:Fallback><p:transition spd="slow">{fallback}</p:transition></mc:Fallback>'
            f'</mc:AlternateContent>')


FADE_BLACK = alt("p14", "", '<p:fade thruBlk="1"/>', 2000, '<p:fade thruBlk="1"/>')
CURTAINS = alt("p15", f'xmlns:p15="{P15}"', '<p15:prstTrans prst="curtains"/>', 3500, "<p:fade/>")
PRESTIGE = alt("p15", f'xmlns:p15="{P15}"', '<p15:prstTrans prst="prestige"/>', 2500, "<p:fade/>")
MORPH = alt("p159", f'xmlns:p159="{P159}"', '<p159:morph option="byObject"/>', 2200, "<p:fade/>")

PLAN = {1: FADE_BLACK, 2: CURTAINS, 3: MORPH, 4: MORPH, 5: PRESTIGE, 6: MORPH}

src, dst = sys.argv[1], sys.argv[2]
zin = zipfile.ZipFile(src)
with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        m = re.fullmatch(r"ppt/slides/slide(\d+)\.xml", item.filename)
        if m and int(m.group(1)) in PLAN:
            xml = data.decode("utf8")
            xml = re.sub(r"<p:transition.*?</p:transition>|<p:transition[^>]*/>", "", xml, flags=re.S)
            tr = PLAN[int(m.group(1))]
            if "</p:clrMapOvr>" in xml:
                xml = xml.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + tr, 1)
            else:
                xml = xml.replace("</p:cSld>", "</p:cSld>" + tr, 1)
            data = xml.encode("utf8")
        zout.writestr(item, data)
print("transitions injected")
