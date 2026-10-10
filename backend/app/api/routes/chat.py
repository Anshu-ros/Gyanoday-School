import re
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.security import verify_csrf_token

router = APIRouter(prefix="/api")
limiter = Limiter(key_func=get_remote_address)
INFORMATION_FILE = Path(__file__).resolve().parents[4] / "SCHOOL_INFORMATION.md"


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    previous_question: str | None = Field(default=None, max_length=500)


def _read_information() -> str:
    try:
        return INFORMATION_FILE.read_text(encoding="utf-8")
    except OSError:
        return ""


def _section(document: str, heading: str) -> str:
    match = re.search(
        rf"^## {re.escape(heading)}\s*$([\s\S]*?)(?=^## |\Z)",
        document,
        re.MULTILINE,
    )
    return match.group(1) if match else ""


def _table_rows(section: str) -> tuple[list[str], list[dict[str, str]]]:
    rows = [line.strip() for line in section.splitlines() if line.strip().startswith("|")]
    parsed = [[cell.strip() for cell in row.strip("|").split("|")] for row in rows]
    parsed = [row for row in parsed if row and not all(set(cell) <= {"-", ":", " "} for cell in row)]
    if len(parsed) < 2:
        return [], []
    headers = parsed[0]
    return headers, [dict(zip(headers, row)) for row in parsed[1:] if len(row) == len(headers)]


def _is_confirmed(value: str) -> bool:
    normalized = value.strip().lower()
    unconfirmed_markers = ("confirm with office", "to be confirmed", "pending confirmation", "not provided", "placeholder")
    return bool(normalized) and "[" not in value and "]" not in value and not any(marker in normalized for marker in unconfirmed_markers)


def _document_is_approved(document: str) -> bool:
    match = re.search(r"^>\s*\*\*Status:\s*([^*]+)", document, re.MULTILINE | re.IGNORECASE)
    return bool(match and match.group(1).strip().lower().startswith("approved"))


def _contact_instruction(document: str) -> str:
    if not _document_is_approved(document):
        return " The school information document is not approved yet and has no verified contact details; please contact the school office through its official channel."
    contact = _section(document, "School Contact")
    details = []
    for line in contact.splitlines():
        match = re.match(r"-\s*(Official phone|Official email):\s*(.+)", line.strip(), re.IGNORECASE)
        if match and _is_confirmed(match.group(2)):
            details.append(f"{match.group(1)}: {match.group(2)}")
    if details:
        return " The document lists " + " and ".join(details) + "."
    return " The document does not list an official phone or email yet; please contact the school office through its official channel."


def _class_number(message: str) -> str | None:
    if message.strip() in {"6", "7", "8", "9", "10"}:
        return message.strip()
    match = re.search(r"\b(?:class|grade)\s*(6|7|8|9|10)\b|\b(6|7|8|9|10)\s*(?:th|st|nd|rd)?\s*(?:class|grade)\b", message, re.IGNORECASE)
    if not match:
        return None
    return next(group for group in match.groups() if group)


def _answer_from_table(document: str, heading: str, class_number: str, intro: str) -> str:
    if not _document_is_approved(document):
        return f"{intro} The school information document is still a draft, so I can't provide confirmed details yet." + _contact_instruction(document)
    _, rows = _table_rows(_section(document, heading))
    row = next(
        (
            item
            for item in rows
            if _class_number(next((value for key, value in item.items() if key.lower().startswith("class")), "")) == class_number
        ),
        None,
    )
    if not row:
        return f"{intro} I couldn't find an approved entry for Class {class_number}." + _contact_instruction(document)

    details = [f"{key}: {value}" for key, value in row.items() if not key.lower().startswith("class") and _is_confirmed(value)]
    if heading == "Fee Structure":
        currency_pattern = re.compile(r"(?:[$€£¥₹]|\b(?:INR|USD|EUR|GBP|CAD|AUD|NZD|SGD|AED)\b|\bRs\.?\b)", re.IGNORECASE)
        amounts = [value for key, value in row.items() if ("fee" in key.lower() or "charges" in key.lower()) and _is_confirmed(value)]
        if any(not currency_pattern.search(value) for value in amounts):
            return f"Fee amounts are listed for Class {class_number}, but the document doesn't specify their currency. Please confirm the amounts and currency with the school office." + _contact_instruction(document)
    if details:
        return f"For Class {class_number}: " + "; ".join(details) + "."
    return f"{intro} The document doesn't yet provide approved details for Class {class_number}." + _contact_instruction(document)


def _reply(message: str, document: str, previous_question: str | None = None) -> str:
    normalized = message.strip().lower()
    if not normalized:
        return "Please ask about fees, class timings, or course details."

    if re.fullmatch(r"(?:hi|hello|hey|good morning|good afternoon|good evening)[!. ]*", normalized):
        return "Hello! I can help with school fees, class timings, and course details. What would you like to know?"

    if previous_question and re.fullmatch(
        r"(?:class|grade)?\s*(?:6|7|8|9|10)(?:st|nd|rd|th)?\s*(?:class|grade)?(?:\s+(?:please|thanks))?[?.! ]*",
        normalized,
    ):
        normalized = f"{previous_question.strip().lower()} {normalized}"

    class_number = _class_number(normalized)
    if re.search(r"\b(pay fees|make (?:a )?payment|payment link|pay now|payment method|where to pay)\b", normalized):
        return "The information document does not provide an approved payment channel. Please contact the school office for official payment instructions."

    fee_question = bool(re.search(r"\b(fee|fees|tuition|cost|price|installment|payment|refund|discount|registration)\b|how much", normalized))
    timing_question = bool(re.search(r"\b(time|timings?|schedule|when|days|batch|session|start date|duration of class)\b", normalized))
    course_question = bool(re.search(r"\b(course|courses|class|classes|grade|grades|subject|subjects|syllabus|prerequisite|eligibility|certificate|certification|curriculum)\b", normalized))

    if fee_question:
        if not class_number and re.search(r"\b(how much|fee|fees|tuition|cost|price)\b", normalized):
            return "Which class are you asking about?"
        if class_number:
            return _answer_from_table(document, "Fee Structure", class_number, "I can help with fee information.")
        return "I can help with tuition, registration, installments, discounts, or refunds. Which class and fee detail do you mean?"

    if timing_question:
        if not class_number:
            return "Which class or batch are you asking about?"
        return _answer_from_table(document, "Class Timings", class_number, "I can help with class timings.")

    if re.search(r"\b(apply|admission process|enrol|enroll|enrollment|enrolment)\b", normalized):
        return "For applications, please use the Admission page on this website. For payment instructions, contact the school office; the information document does not provide an approved payment channel."

    if course_question:
        if not class_number and re.search(r"\b(which|what)\s+(?:classes|grades)\b|\bclasses offered\b|\bgrades offered\b", normalized):
            if not _document_is_approved(document):
                return "The school information document is still a draft, so current class offerings are not confirmed. Please contact the school office through its official channel."
            return "The information document says the website presents the school as serving classes 6 through 10. Please confirm current offerings with the school office."
        if not class_number:
            return "Which class would you like course details for?"
        return _answer_from_table(document, "Courses and Classes", class_number, "I can help with course information.")

    return "I can answer questions about school fees, class timings, and course details. For other questions, please contact the school office through its official channel."


@router.post("/chat")
@limiter.limit("12/minute")
def chat(request: Request, payload: ChatRequest) -> dict[str, str]:
    verify_csrf_token(request.headers.get("x-csrf-token"))
    document = _read_information()
    if not document:
        raise HTTPException(status_code=503, detail="School information is temporarily unavailable.")
    return {"answer": _reply(payload.message, document, payload.previous_question)}
