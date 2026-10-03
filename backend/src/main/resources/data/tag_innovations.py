"""Add challengeAreas + problemTags to the scraped innovations.

Tags were assigned by reading each innovation's problem statement (keyword matching
was too noisy, e.g. "prawn" inside "niepełnosprawność"). Primary tag first.

Usage: python tag_innovations.py <raw innovations.json> <output dir>
"""
import json
import os
import sys

# Challenge areas = the 8 areas of ROPS "Mapa Wyzwań Społecznych" (see challenge-areas.json)
AREA = {
    "FAM": "FAMILY_FOSTER_CARE", "HOME": "HOMELESSNESS", "DIS": "DISABILITY", "POV": "POVERTY",
    "MIG": "MIGRANT_INTEGRATION", "HEA": "HEALTH", "MEN": "MENTAL_HEALTH", "SEN": "SENIORS",
}

PROBLEM_TAGS = {
    "LONELINESS": "Samotność i izolacja",
    "MENTAL_HEALTH": "Zdrowie psychiczne, stres, kryzys emocjonalny",
    "DEMENTIA_MEMORY": "Demencja i problemy z pamięcią",
    "DIGITAL_EXCLUSION": "Wykluczenie cyfrowe",
    "MOBILITY": "Trudności w poruszaniu się, bariery architektoniczne i transportowe",
    "COMMUNICATION": "Bariery w komunikacji i dostępie do informacji",
    "DAILY_INDEPENDENCE": "Trudności w samodzielnym codziennym funkcjonowaniu",
    "CARE_ACCESS": "Dostęp do usług opiekuńczych i asystenckich",
    "CAREGIVER_SUPPORT": "Wsparcie opiekunów i rodzin osób zależnych",
    "REHABILITATION": "Rehabilitacja i terapia",
    "HEALTHCARE_ACCESS": "Dostęp do opieki zdrowotnej i leczenia",
    "HEALTHY_LIFESTYLE": "Zdrowy styl życia, dieta, otyłość",
    "EMPLOYMENT": "Praca i aktywizacja zawodowa",
    "EDUCATION": "Edukacja i nauka",
    "POVERTY": "Ubóstwo i brak podstawowych zasobów",
    "HOMELESSNESS": "Bezdomność",
    "FAMILY_SUPPORT": "Trudności w rodzinie i wychowaniu",
    "VIOLENCE": "Przemoc",
    "MIGRANT_INTEGRATION": "Integracja cudzoziemców (język, kultura)",
    "CULTURE_LEISURE": "Dostęp do kultury, sportu, turystyki i czasu wolnego",
    "SOCIAL_INCLUSION": "Wykluczenie społeczne i budowanie relacji",
    "PUBLIC_SERVICES": "Sprawy urzędowe, prawne i dostęp do usług publicznych",
    "SAFETY": "Bezpieczeństwo (upadki, zagrożenia)",
}

# id -> (areas, problem tags)
TAGS = {
    "bawita": ("SEN HEA", "DEMENTIA_MEMORY REHABILITATION"),
    "senior-cuder": ("SEN MEN", "MENTAL_HEALTH LONELINESS DEMENTIA_MEMORY SOCIAL_INCLUSION"),
    "merkury": ("SEN", "DIGITAL_EXCLUSION PUBLIC_SERVICES"),
    "organizator-kompleksowej-opieki-w-miejscu-zamieszkania": ("SEN HEA", "CARE_ACCESS CAREGIVER_SUPPORT HEALTHCARE_ACCESS"),
    "przenosne-modularne-lazienki": ("POV SEN", "POVERTY DAILY_INDEPENDENCE LONELINESS"),
    "terapeuta-przestrzeni": ("SEN", "DAILY_INDEPENDENCE CARE_ACCESS SAFETY"),
    "talerze-zdrowia": ("SEN HEA DIS", "HEALTHY_LIFESTYLE DAILY_INDEPENDENCE"),
    "therapy-set": ("SEN", "REHABILITATION CARE_ACCESS"),
    "sciezka-treningu-umyslu": ("SEN HEA", "DEMENTIA_MEMORY REHABILITATION"),
    "edu-gra-hahaha": ("SEN MEN DIS", "MENTAL_HEALTH REHABILITATION SOCIAL_INCLUSION"),
    "obu-obuwie-po-domu": ("SEN", "SAFETY MOBILITY"),
    "centrum-antydepresyjne": ("SEN MEN", "MENTAL_HEALTH LONELINESS"),
    "zeglowanie-w-wyobrazni-czyli-sposob-na-strachy-na-wodzie": ("DIS SEN", "CULTURE_LEISURE MOBILITY"),
    "stworzenie-narzedzia-ulatwiajacego-seniorom-prawidlowe-regulowanie-spraw-spadkowych": ("SEN", "PUBLIC_SERVICES"),
    "mobilne-centrum-pomocy-dla-osob-starszych": ("SEN", "LONELINESS MENTAL_HEALTH PUBLIC_SERVICES SOCIAL_INCLUSION"),
    "kody-qr-na-pomoc-seniorom": ("SEN HEA", "DEMENTIA_MEMORY SAFETY MOBILITY"),
    "e-rzecznik-konsumenta-seniora": ("SEN", "PUBLIC_SERVICES"),
    "sciezka-motosensoryczna": ("SEN", "REHABILITATION MOBILITY"),
    "korytarz-wspomnien": ("SEN", "DEMENTIA_MEMORY"),
    "wirtualne-izby-pamieci": ("SEN", "DIGITAL_EXCLUSION LONELINESS SOCIAL_INCLUSION"),
    "komix-zyciowy": ("FAM MEN", "MENTAL_HEALTH FAMILY_SUPPORT"),
    "patryk-i-kropka": ("DIS", "COMMUNICATION CULTURE_LEISURE EDUCATION"),
    "edki-kredki-terapeutyczne": ("DIS", "REHABILITATION"),
    "rodzina-adopcyjna-dorasta": ("FAM", "FAMILY_SUPPORT MENTAL_HEALTH"),
    "puzzle-3d": ("DIS", "EDUCATION COMMUNICATION"),
    "hop-hop-mobilny-plac-zabaw": ("DIS HEA", "REHABILITATION HEALTHY_LIFESTYLE"),
    "mobilny-pomocnik-dydaktyczno-sensoryczny-dla-uczniowstudentow-ze-spektrum-autyzmu": ("DIS", "EDUCATION"),
    "przewodnik-dla-osob-z-asd-moje-potrzeby-gdzie-i-jak-je-realizowac": ("DIS", "SOCIAL_INCLUSION DAILY_INDEPENDENCE EDUCATION"),
    "bez-presji-z-depresji": ("MEN", "MENTAL_HEALTH EDUCATION"),
    "bez-stresu-do-sukcesu-terapia-neurologiczna-przyjazna-dziecku": ("DIS HEA", "REHABILITATION HEALTHCARE_ACCESS"),
    "uwaznione-rodzienstwo": ("FAM DIS", "FAMILY_SUPPORT CAREGIVER_SUPPORT"),
    "brzuszkole-brzuszek-zostaje-w-przedszkolu": ("HEA FAM", "HEALTHY_LIFESTYLE"),
    "to-nie-koniec-swiata-to-poczatek-swiata": ("FAM DIS", "FAMILY_SUPPORT CAREGIVER_SUPPORT"),
    "jezykolamacz": ("DIS", "COMMUNICATION"),
    "piosenki-uczestniczace": ("DIS", "COMMUNICATION SOCIAL_INCLUSION EDUCATION"),
    "moj-pomocny-virtual-world": ("MIG", "MIGRANT_INTEGRATION EDUCATION"),
    "mobilna-pomoc-terapeutyczna": ("FAM", "VIOLENCE FAMILY_SUPPORT"),
    "marimbaza": ("FAM", "SOCIAL_INCLUSION EDUCATION CULTURE_LEISURE"),
    "nasz-wspolny-rodzinny-swiat-poznaje-ucze-reaguje": ("FAM DIS", "FAMILY_SUPPORT CAREGIVER_SUPPORT HEALTHCARE_ACCESS"),
    "mpatyk": ("DIS", "SOCIAL_INCLUSION EDUCATION"),
    "czas-na-aktywnosc": ("DIS", "SOCIAL_INCLUSION CULTURE_LEISURE"),
    "agencja-pracy-incydentalnej": ("POV", "EMPLOYMENT POVERTY"),
    "niewypaleni": ("DIS", "EMPLOYMENT MENTAL_HEALTH"),
    "konsultant-etr": ("DIS", "EMPLOYMENT COMMUNICATION"),
    "mobilna-gielda-pracy": ("POV", "EMPLOYMENT"),
    "oddawacze": ("POV", "POVERTY SOCIAL_INCLUSION"),
    "uniodziez": ("DIS", "MOBILITY DAILY_INDEPENDENCE"),
    "zakupy-na-jednym-wozku-z-dzieckiem-z-niepelnosprawnoscia-ruchowa": ("DIS FAM", "CAREGIVER_SUPPORT DAILY_INDEPENDENCE"),
    "kompleksowa-pomoc-dla-osob-po-amputacji-konczyny-dolnej": ("DIS HEA", "REHABILITATION HEALTHCARE_ACCESS"),
    "puzzles-ramp": ("DIS", "MOBILITY"),
    "chlap-pro": ("DIS", "MOBILITY DAILY_INDEPENDENCE"),
    "marina-pai": ("DIS SEN", "MOBILITY CULTURE_LEISURE"),
    "zakupy-bez-barier": ("DIS SEN", "DAILY_INDEPENDENCE MOBILITY"),
    "nakreceni-na-aktywnosc": ("DIS", "MOBILITY SOCIAL_INCLUSION CULTURE_LEISURE"),
    "moduly-niezaleznosci": ("DIS", "CULTURE_LEISURE MOBILITY"),
    "biustspinka": ("DIS", "DAILY_INDEPENDENCE"),
    "szablony-piekna": ("DIS", "DAILY_INDEPENDENCE"),
    "ev-modul-do-wozkow-inwalidzkich": ("DIS", "MOBILITY"),
    "dostepny-stol-targowy": ("DIS", "DAILY_INDEPENDENCE MOBILITY"),
    "cloudleg": ("DIS", "DAILY_INDEPENDENCE"),
    "lekki-wozek-aktywny": ("DIS", "MOBILITY"),
    "wozek-szermierczy": ("DIS", "CULTURE_LEISURE MOBILITY"),
    "dostepna-szermierka": ("DIS", "CULTURE_LEISURE MOBILITY"),
    "innotextil": ("DIS SEN HEA", "REHABILITATION HEALTHCARE_ACCESS"),
    "straznik": ("DIS", "SAFETY COMMUNICATION"),
    "wsparcie-imprez-masowych-dla-osob-z-niepelnosprawnoscia-wzroku": ("DIS", "CULTURE_LEISURE MOBILITY"),
    "teleasystent": ("DIS", "DAILY_INDEPENDENCE CARE_ACCESS"),
    "hear-it": ("DIS", "EDUCATION EMPLOYMENT COMMUNICATION"),
    "gluchy-czytelnik-w-bibliotece": ("DIS", "CULTURE_LEISURE COMMUNICATION"),
    "blue-sea-eye": ("DIS", "CULTURE_LEISURE"),
    "osoby-niewidome-i-niedowidzace-jako-nauczyciele-jezyka-polskiego": ("DIS MIG", "EMPLOYMENT MIGRANT_INTEGRATION"),
    "ngoz-nawigacja-glosowa-osob-zaleznych": ("DIS", "MOBILITY PUBLIC_SERVICES"),
    "wibraap": ("DIS", "CULTURE_LEISURE"),
    "my-way-to-culture": ("DIS", "CULTURE_LEISURE MOBILITY"),
    "glucha-ankieta": ("DIS", "COMMUNICATION"),
    "dostepny-wniosek-dla-ggluchych": ("DIS", "PUBLIC_SERVICES COMMUNICATION"),
    "czytamoda": ("DIS", "DAILY_INDEPENDENCE"),
    "dostepny-transport-publiczny": ("DIS", "MOBILITY COMMUNICATION"),
    "turystyka-gorskawspinaczka-dostepna-dla-wszystkich": ("DIS", "CULTURE_LEISURE"),
    "zdobadz-swoje-szczyty": ("DIS", "CULTURE_LEISURE"),
    "spotkania-kulturlove": ("DIS", "CULTURE_LEISURE SOCIAL_INCLUSION"),
    "zmysly-w-ruchu-model-choreografii-dla-osob-niewidomych": ("DIS", "CULTURE_LEISURE REHABILITATION"),
    "kaski-binauralne": ("DIS", "REHABILITATION DAILY_INDEPENDENCE"),
    "wielodziedzinowy-slownik-terminow-specjalistycznych-pl-pjm": ("DIS", "COMMUNICATION"),
    "bajkala": ("MIG", "MIGRANT_INTEGRATION"),
    "dialog-ponad-kulturami": ("MIG FAM", "FAMILY_SUPPORT MIGRANT_INTEGRATION"),
    "wortal-informacyjny": ("MIG", "MIGRANT_INTEGRATION COMMUNICATION"),
    "dialog-ponad-kulturami-1": ("MIG", "COMMUNICATION MIGRANT_INTEGRATION"),
    "health-guide-pl": ("MIG HEA", "HEALTHCARE_ACCESS MIGRANT_INTEGRATION"),
    "zrozum-moja-kulture-zrozum-mnie": ("MIG", "MIGRANT_INTEGRATION SOCIAL_INCLUSION"),
    "urzedowy-ambaras": ("DIS", "PUBLIC_SERVICES EDUCATION"),
    "stop-otylosci-innowacyjna-metoda-pracy-z-osobami-niepelnosprawnymi-intelektualnie": ("DIS HEA", "HEALTHY_LIFESTYLE"),
    "pelna-wokanda": ("DIS", "PUBLIC_SERVICES EDUCATION"),
    "pelnia-zdrowia": ("DIS HEA", "HEALTHCARE_ACCESS EDUCATION"),
    "niepelnosprawnosc-szansa-na-pelnosprawnosc-w-pracy-i-zyciu": ("DIS", "EMPLOYMENT SOCIAL_INCLUSION"),
    "dostepna-polska": ("DIS", "CULTURE_LEISURE COMMUNICATION"),
    "zalatw-to-sam": ("DIS", "PUBLIC_SERVICES DAILY_INDEPENDENCE"),
    "go-ahead-mow-smialo": ("DIS", "COMMUNICATION SOCIAL_INCLUSION"),
    "autyzm-i-ja": ("DIS FAM", "EDUCATION COMMUNICATION"),
    "podroz-poza-domem-w-wirtualnej-rzeczywistosci": ("DIS MEN", "MENTAL_HEALTH REHABILITATION"),
    "ta-sciezka-terapeutyczna-sciezka-kulturowa-dla-dzieci-i-doroslych-z-autyzmem": ("DIS", "PUBLIC_SERVICES CULTURE_LEISURE"),
    "osa-i-eco-puzzle": ("DIS FAM", "FAMILY_SUPPORT EMPLOYMENT SOCIAL_INCLUSION"),
    "rodzinny-system-wzajemnej-pomocy": ("DIS", "EMPLOYMENT SOCIAL_INCLUSION CAREGIVER_SUPPORT"),
    "mix-ar-i-vr-dla-koordynacji-ruchowej": ("DIS", "REHABILITATION"),
    "szlakiem-ludzi-bezdomnych": ("HOME HEA", "HOMELESSNESS HEALTHCARE_ACCESS"),
    "wiejski-program-pomocy-osobom-w-kryzysie-bezdomnosci-sciezka-feniksa": ("HOME POV", "HOMELESSNESS POVERTY"),
    "paszport-pacjenta-z-choroba-rzadka": ("HEA", "HEALTHCARE_ACCESS"),
    "himalaje-autyzmu": ("HEA DIS", "HEALTHCARE_ACCESS"),
    "gra-o-zdrowie": ("MEN HEA", "MENTAL_HEALTH EMPLOYMENT"),
    "telerehabilitacja-oddechowa": ("HEA", "REHABILITATION HEALTHCARE_ACCESS"),
    "inteligentny-organizer-do-lekow": ("HEA SEN", "CAREGIVER_SUPPORT SAFETY"),
    "drogowskazy-ajkum": ("HEA", "HEALTHCARE_ACCESS MOBILITY"),
    "cold-box": ("HEA", "HEALTHCARE_ACCESS DAILY_INDEPENDENCE"),
    "pacjent-pro": ("MEN HEA", "MENTAL_HEALTH HEALTHCARE_ACCESS"),
    "oncotriada": ("HEA MEN", "MENTAL_HEALTH HEALTHCARE_ACCESS"),
}


def main(src, out_dir):
    items = json.load(open(src, encoding="utf-8"))
    missing = [x["id"] for x in items if x["id"] not in TAGS]
    if missing:
        sys.exit(f"untagged innovations: {missing}")
    out = []
    for item in items:
        areas, tags = TAGS[item["id"]]
        tagged = {}
        for k, v in item.items():
            tagged[k] = v
            if k == "targetGroups":
                tagged["challengeAreas"] = [AREA[a] for a in areas.split()]
                tagged["problemTags"] = tags.split()
        assert all(t in PROBLEM_TAGS for t in tagged["problemTags"]), item["id"]
        out.append(tagged)
    with open(os.path.join(out_dir, "innovations.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    with open(os.path.join(out_dir, "problem-tags.json"), "w", encoding="utf-8") as f:
        json.dump(PROBLEM_TAGS, f, ensure_ascii=False, indent=2)
    print(f"tagged {len(out)} innovations")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
