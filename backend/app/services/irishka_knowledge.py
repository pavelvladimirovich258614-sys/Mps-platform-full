import json
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


KNOWLEDGE_PATH = Path(__file__).resolve().parents[1] / "data" / "irishka_knowledge.json"
WORD_RE = re.compile(r"[^\W_]+", re.UNICODE)
STOP_WORDS = frozenset({
    "а", "в", "вы", "где", "для", "и", "из", "или", "как", "какая", "какой",
    "когда", "ли", "мне", "на", "но", "нужен", "нужна", "нужно", "о", "об",
    "поехать", "подскажите", "посмотреть", "про", "расскажите", "сколько", "тур",
    "туры", "что", "хочу",
})


@dataclass(frozen=True)
class KnowledgeEntry:
    id: int
    tags: tuple[str, ...]
    text: str


def _words(value: str) -> set[str]:
    return set(WORD_RE.findall(value.casefold()))


@lru_cache
def load_knowledge() -> tuple[KnowledgeEntry, ...]:
    payload = json.loads(KNOWLEDGE_PATH.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError("База знаний Иришки должна быть списком записей")
    entries: list[KnowledgeEntry] = []
    for item in payload:
        if not isinstance(item, dict) or not isinstance(item.get("id"), int) or not isinstance(item.get("tags"), list) or not isinstance(item.get("text"), str):
            raise ValueError("База знаний Иришки содержит запись неверного формата")
        if not all(isinstance(tag, str) for tag in item["tags"]):
            raise ValueError("Теги базы знаний Иришки должны быть строками")
        entries.append(KnowledgeEntry(id=item["id"], tags=tuple(item["tags"]), text=item["text"]))
    return tuple(entries)


def _matches(term: str, candidate: str) -> bool:
    return term == candidate or (
        len(term) >= 6 and len(candidate) >= 6 and term[:5] == candidate[:5]
    )


def find_relevant_entries(question: str, limit: int = 5) -> list[KnowledgeEntry]:
    """Return compact keyword-ranked tourism knowledge for one direct question."""

    terms = _words(question) - STOP_WORDS
    if not terms:
        return []
    minimum_matches = 1 if len(terms) == 1 else 2
    scored: list[tuple[int, KnowledgeEntry]] = []
    for entry in load_knowledge():
        tag_words = _words(" ".join(entry.tags))
        text_words = _words(entry.text)
        matched_terms = 0
        score = 0
        for term in terms:
            if any(_matches(term, word) for word in tag_words):
                matched_terms += 1
                score += 3
            elif any(_matches(term, word) for word in text_words):
                matched_terms += 1
                score += 1
        if matched_terms >= minimum_matches:
            scored.append((score, entry))
    return [entry for _, entry in sorted(scored, key=lambda item: (-item[0], item[1].id))[:limit]]
