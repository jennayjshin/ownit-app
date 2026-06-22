#!/usr/bin/env python3
"""
Classify English sentences into easy/medium/hard for Korean learners.
Criteria: vocabulary frequency, key expression complexity, sentence structure.
Target distribution: ~35% easy, ~45% medium, ~20% hard
"""

import csv
import re
from collections import defaultdict

# Top ~1500 most common English words (Oxford 3000 A1-B1 subset)
COMMON_WORDS = set("""
a able about above accept actually add address after again against age ago agree
all allow almost alone already also always am among an and another any anyone
anything anyway apart appear apply approach are area aren around as ask at away
back bad based be beautiful because become been before begin being believe best
better between big bit both break bring build but buy by
call can care carry cause change check child close come common complete concern
continue could cover create cut
day dead decide decision deep develop difference difficult do does done down
during
each early easy end enough even ever every example exist expect explain
face fact fall family far feel few find first follow for form found from front
full
get give go good great
had happen hard has have he head help her here him his how
idea if in increase information instead into is issue its
just
keep kind know
large last late lead leave let life like list live look long lot love
make man many may me mean might mind more most much must my
name need never new next no not now
of off often old on once only open or other our out own
part past people per person place plan point possible problem put
question quite
rather read real really result right
same say see seem self set short should side since small so social start stay
still such sure
take talk than that the their then there these they think though through time
to today together too top try turn
under until up use
very
want was way we well what when where which while who will with within without
word work world would write
year yet you young your
a about after again all also am an and any are as at
back big bit both
call can could
day did do does don't down
each end every
few find first for found from
give go going got great
had has have he help her here him his how
i if in into is it its
just keep know
last let like little look long
make may me more most much my
need never new next no not now
of off on one only or other our out over
really right
said same see should so some still
take than that the their them then there they think this time to too
up us use
very
want was we well went were what when which who will with would
you your
perfect fine nice great pretty cool awesome bad good better best
morning evening night today tomorrow yesterday
always never sometimes often
quick quickly slow slowly easy easily hard hardly
small big large tall short long
old new young
happy sad angry tired
work job home school friend family
go come leave stay try need want
talk say tell ask answer
think feel know believe understand
look watch see hear listen
give take send receive
make do get have
hot cold warm cool
pretty much quite rather fairly
already yet still even just
really actually basically
ca do
going coming looking working talking saying thinking feeling knowing
getting taking making trying putting doing telling asking helping
giving living coming watching listening
went came got took made tried put worked did said told thought felt knew looked
asking trying staying leaving helping keeping using moving starting sending finding
happened changed turned seems seemed looked called called tried needed
getting having going working coming looking making trying
going back up down around forward through together along away ahead
already still yet even always never just really quite
pretty rather fairly mostly mostly mostly quite enough
""".split())

# B2-C1 vocabulary indicators (harder words)
ADVANCED_WORDS = set("""
absolutely acknowledge acquire aggressive albeit ambiguous anticipate apparent
approximately assess assumption astronomical
bizarre brainstorm breakthrough
catastrophic circumstance compelling compromise confidential consequently
considerable contemplate controversial
deliberately demonstrate dilemma discrepancy dismiss disproportionate
elaborate eliminate encounter endeavor enormous equip essentially evaluate
exaggerate exceptional exhaust explicit extraordinary
facilitate feasible fluctuate fundamental
genuinely granular guarantee
hesitate hypothesis
implication inadvertently inevitable innovative insignificant integrity
intimidate
jeopardize
legitimate literally loophole
magnitude manipulate meticulous minimize misconception
negotiate nuance
objective obscure optimize overwhelm
paradox perceive perspective plausible pragmatic primarily prioritize
profound proportion pursuit
regardless reluctant remarkable restructure retrieve
scrutinize simultaneously skeptical sophisticated spectrum speculate substantial
superficial sustainable
thorough transparent tremendous
ultimately underlying unprecedented utilize
virtually vulnerable
""".split())

def count_syllables(word):
    word = word.lower().strip(".,!?;:'\"()-")
    if not word or not any(c.isalpha() for c in word):
        return 0
    vowels = "aeiouy"
    count = 0
    prev_vowel = False
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    # Silent e
    if len(word) > 2 and word.endswith('e') and word[-2] not in vowels:
        count = max(1, count - 1)
    return max(1, count)

def normalize_word(word):
    """Normalize contractions to base form."""
    word = word.lower()
    word = re.sub(r"n't$", "", word)   # don't → do, can't → ca
    word = re.sub(r"'s$", "", word)    # it's → it, that's → that
    word = re.sub(r"'re$", "", word)   # you're → you
    word = re.sub(r"'ve$", "", word)   # i've → i
    word = re.sub(r"'ll$", "", word)   # i'll → i
    word = re.sub(r"'d$", "", word)    # i'd → i
    word = re.sub(r"'m$", "", word)    # i'm → i
    return word

def get_words(text):
    raw = re.findall(r"\b[a-zA-Z']+\b", text)
    return [normalize_word(w) for w in raw if len(w) > 1]

def score_sentence(english, key_expr, category):
    """
    Score a sentence for difficulty. Higher = harder.
    Components:
      1. Key expression complexity (word count, syllables)
      2. Vocabulary: proportion of uncommon/advanced words
      3. Sentence length
      4. Category bonus
    """
    words = get_words(english)
    key_words = get_words(key_expr)

    if not words:
        return 0

    score = 0

    # --- 1. Key expression complexity (most important for language learners) ---
    key_word_count = len(key_words)
    key_syllables_avg = sum(count_syllables(w) for w in key_words) / max(1, len(key_words))
    sentence_word_count = len(words)

    # If key expression covers most of the sentence, it's probably not a true idiom
    # (just a sentence fragment used as key) — reduce its weight
    key_coverage = key_word_count / max(1, sentence_word_count)
    key_uncommon_ratio = sum(1 for w in key_words if w not in COMMON_WORDS) / max(1, len(key_words))

    # Effective idiom complexity = word count * (0.4 + 0.6 * uncommon ratio)
    # Penalize if key expression is just a big chunk of all-common words
    if key_coverage > 0.6:
        # Key is basically the whole sentence — not truly idiomatic
        effective_key_score = key_word_count * 2
    else:
        effective_key_score = key_word_count * (4 + 6 * key_uncommon_ratio)

    score += min(effective_key_score, 38)  # cap contribution

    # High-syllable key expressions
    if key_syllables_avg >= 3:
        score += 8
    elif key_syllables_avg >= 2.3:
        score += 4

    # --- 2. Vocabulary complexity ---
    advanced_count = sum(1 for w in words if w in ADVANCED_WORDS)
    uncommon_count = sum(1 for w in words if w not in COMMON_WORDS)
    total = len(words)

    uncommon_ratio = uncommon_count / total
    score += uncommon_ratio * 30

    if advanced_count >= 2:
        score += 15
    elif advanced_count == 1:
        score += 7

    # --- 3. Sentence length ---
    word_count = len(words)
    if word_count >= 16:
        score += 15
    elif word_count >= 13:
        score += 8
    elif word_count <= 6:
        score -= 5

    # --- 4. Category bonus ---
    if category == "Idioms & Patterns":
        score += 8
    elif category in ("Meetings", "Email & Phone"):
        score += 4

    # --- 5. Complex structures ---
    eng_lower = english.lower()
    complexity_markers = [
        "not only", "not just", "neither", "nor", "regardless",
        "in spite of", "despite the fact", "as long as", "assuming that",
        "provided that", "in the event", "on the condition",
        "let alone", "much less", "if anything",
    ]
    for marker in complexity_markers:
        if marker in eng_lower:
            score += 8
            break

    return score

def classify(score):
    if score < 20:
        return "easy"
    elif score < 38:
        return "medium"
    else:
        return "hard"

def main():
    csv_path = "/home/yoojins2/dj-nativefit/sentence.csv"
    rows = []

    with open(csv_path, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            english = row['english_expression']
            key_expr = row['key_expression']
            category = row['category']
            score = score_sentence(english, key_expr, category)
            difficulty = classify(score)
            rows.append({
                'id': row['id'],
                'english': english,
                'key_expression': key_expr,
                'korean': row['korean_translation'],
                'category': category,
                'difficulty': difficulty,
                'score': round(score, 1),
                'words': len(get_words(english)),
            })

    counts = defaultdict(int)
    for r in rows:
        counts[r['difficulty']] += 1
    total = len(rows)

    print("=== 난이도 분류 결과 ===")
    print(f"Easy:   {counts['easy']:3d}개 ({counts['easy']/total*100:.1f}%)")
    print(f"Medium: {counts['medium']:3d}개 ({counts['medium']/total*100:.1f}%)")
    print(f"Hard:   {counts['hard']:3d}개 ({counts['hard']/total*100:.1f}%)")
    print(f"Total:  {total:3d}개")
    print()

    for level in ['easy', 'medium', 'hard']:
        samples = [r for r in rows if r['difficulty'] == level][:5]
        print(f"=== {level.upper()} 샘플 5개 ===")
        for s in samples:
            print(f"  [{s['id']:3s}] score:{s['score']:4.1f} words:{s['words']:2d} | {s['english']}")
            print(f"        key({len(s['key_expression'].split()):d}w): {s['key_expression']}")
            print(f"        {s['korean']}")
        print()

    # Show edge cases to verify
    print("=== 경계 케이스 확인 ===")
    edge = sorted(rows, key=lambda r: r['score'])
    print("Score 최하 5개 (easy 끝):")
    for r in edge[:5]:
        print(f"  [{r['id']:3s}] score:{r['score']:4.1f} → {r['difficulty']} | {r['english']}")
    print("Score 최상 5개 (hard 끝):")
    for r in edge[-5:]:
        print(f"  [{r['id']:3s}] score:{r['score']:4.1f} → {r['difficulty']} | {r['english']}")

    # Save CSV
    out_path = "/home/yoojins2/dj-nativefit/sentence_classified.csv"
    with open(out_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'english', 'key_expression', 'korean', 'category', 'difficulty', 'score', 'words'])
        writer.writeheader()
        writer.writerows(rows)
    print(f"\n결과 저장: {out_path}")

if __name__ == '__main__':
    main()
