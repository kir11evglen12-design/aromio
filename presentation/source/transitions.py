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

PLAN = {2: CURTAINS, 3: MORPH, 4: MORPH, 5: PRESTIGE, 6: MORPH}



def timing(xml, start=900, stagger=180, dur=900):
    """Staggered fade-in for every plain text box (morphing '!!' objects and page numbers stay put)."""
    ids = []
    for sp in re.findall(r"<p:sp>.*?</p:sp>", xml, flags=re.S):
        m = re.search(r'<p:cNvPr id="(\d+)" name="([^"]*)"', sp)
        if m and 'txBox="1"' in sp and not m.group(2).startswith("!!") and m.group(2) != "pageNum":
            ids.append(m.group(1))
    if not ids:
        return ""
    n = [3]

    def nid():
        n[0] += 1
        return n[0]

    effects = ""
    for i, spid in enumerate(ids):
        effects += (
            f'<p:par><p:cTn id="{nid()}" fill="hold"><p:stCondLst><p:cond delay="{start + i * stagger}"/></p:stCondLst><p:childTnLst>'
            f'<p:par><p:cTn id="{nid()}" presetID="10" presetClass="entr" presetSubtype="0" fill="hold" grpId="0" nodeType="withEffect">'
            f'<p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
            f'<p:set><p:cBhvr><p:cTn id="{nid()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr>'
            f'<p:to><p:strVal val="visible"/></p:to></p:set>'
            f'<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="{nid()}" dur="{dur}"/>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:animEffect>'
            f'</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>')
    bld = "".join(f'<p:bldP spid="{i}" grpId="0"/>' for i in ids)
    return ('<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
            '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
            '<p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/>'
            '<p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>'
            + effects +
            '</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn>'
            '<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
            '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst>'
            '</p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>'
            f'<p:bldLst>{bld}</p:bldLst></p:timing>')


src, dst = sys.argv[1], sys.argv[2]
zin = zipfile.ZipFile(src)
with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        m = re.fullmatch(r"ppt/slides/slide(\d+)\.xml", item.filename)
        if m and int(m.group(1)) in PLAN:
            xml = data.decode("utf8")
            xml = re.sub(r"<p:transition.*?</p:transition>|<p:transition[^>]*/>", "", xml, flags=re.S)
            xml = re.sub(r"<p:timing>.*?</p:timing>", "", xml, flags=re.S)
            tr = PLAN[int(m.group(1))] + timing(xml)
            if "</p:clrMapOvr>" in xml:
                xml = xml.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + tr, 1)
            else:
                xml = xml.replace("</p:cSld>", "</p:cSld>" + tr, 1)
            data = xml.encode("utf8")
        zout.writestr(item, data)
print("transitions injected")
