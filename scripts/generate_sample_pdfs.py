from __future__ import annotations

from pathlib import Path


PAGE_WIDTH = 595
PAGE_HEIGHT = 842


def escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def text_line(text: str, x: int, y: int, size: int = 12, font: str = "F1") -> str:
    return f"BT /{font} {size} Tf {x} {y} Td ({escape_pdf_text(text)}) Tj ET"


def rect(x: int, y: int, width: int, height: int) -> str:
    return f"{x} {y} {width} {height} re S"


def build_pdf(lines: list[str]) -> bytes:
    objects: list[bytes] = []

    content_stream = "\n".join(lines).encode("latin-1", errors="replace")
    stream_object = (
        f"<< /Length {len(content_stream)} >>\nstream\n".encode("latin-1")
        + content_stream
        + b"\nendstream"
    )

    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objects.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objects.append(
        (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
            "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>"
        ).encode("latin-1")
    )
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    objects.append(stream_object)

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]

    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("latin-1"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    pdf.extend(b"0000000000 65535 f \n")

    for offset in offsets[1:]:
        pdf.extend(f"{offset:010} 00000 n \n".encode("latin-1"))

    pdf.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF"
        ).encode("latin-1")
    )

    return bytes(pdf)


def document_lines(
    title: str,
    subtitle: str,
    owner: str,
    controller: str,
    version: str,
    status: str,
    summary_lines: list[str],
    signature_boxes: list[tuple[str, int, int, int, int]],
) -> list[str]:
    lines = [
        "0.16 0.23 0.35 RG",
        "0.96 0.97 0.99 rg",
        "40 760 515 54 re f",
        "0.16 0.23 0.35 rg",
        text_line("InsightDocs Sample PDF", 56, 792, 14, "F2"),
        text_line(title, 56, 770, 24, "F2"),
        text_line(subtitle, 56, 748, 11, "F1"),
        "0.87 0.90 0.95 rg",
        "40 680 250 48 re f",
        "40 620 250 48 re f",
        "305 680 250 48 re f",
        "305 620 250 48 re f",
        "0.16 0.23 0.35 rg",
        text_line(f"Owner: {owner}", 56, 708, 12, "F1"),
        text_line(f"Controller: {controller}", 56, 648, 12, "F1"),
        text_line(f"Version: {version}", 321, 708, 12, "F1"),
        text_line(f"Status: {status}", 321, 648, 12, "F1"),
        text_line("Document Summary", 40, 585, 16, "F2"),
    ]

    current_y = 558
    for line in summary_lines:
        lines.append(text_line(f"- {line}", 52, current_y, 11, "F1"))
        current_y -= 22

    lines.extend(
        [
            text_line("Signature Layout Preview", 40, 360, 16, "F2"),
            "0.25 0.47 0.85 RG",
            "0.97 0.98 1 rg",
            "40 80 515 250 re B",
        ]
    )

    for label, x, y, width, height in signature_boxes:
        lines.extend(
            [
                "0.20 0.55 0.80 RG",
                "0.88 0.96 1 rg",
                f"{x} {y} {width} {height} re B",
                "0.16 0.23 0.35 rg",
                text_line(label, x + 10, y + height - 18, 10, "F2"),
                text_line("Digital + Visible Signature", x + 10, y + height - 34, 8, "F1"),
            ]
        )

    return lines


def main() -> None:
    output_dir = Path("frontend/public/mock-pdfs")
    output_dir.mkdir(parents=True, exist_ok=True)

    documents = [
        (
            "consulting-services-contract.pdf",
            document_lines(
                title="Consulting Services Agreement",
                subtitle="Demo contract document for enterprise signature workflow",
                owner="Legal Department",
                controller="Kanya S.",
                version="v3",
                status="Approved",
                summary_lines=[
                    "Prepared for external advisory engagement.",
                    "Approved and ready for sequential signature assignment.",
                    "Two signers are expected on page one.",
                ],
                signature_boxes=[
                    ("Signer 1", 90, 180, 180, 54),
                    ("Signer 2", 310, 180, 180, 54),
                ],
            ),
        ),
        (
            "expense-approval-policy-2026.pdf",
            document_lines(
                title="Expense Approval Policy 2026",
                subtitle="Demo policy document currently in review workflow",
                owner="Finance Department",
                controller="Phum T.",
                version="v5",
                status="In Review",
                summary_lines=[
                    "Pending manager review for final wording approval.",
                    "Current revision includes updated approval thresholds.",
                    "Signature section reserved after approval.",
                ],
                signature_boxes=[
                    ("Manager Signature", 120, 150, 200, 56),
                ],
            ),
        ),
        (
            "employee-appointment-letter.pdf",
            document_lines(
                title="Employee Appointment Letter",
                subtitle="Demo HR letter still in draft stage",
                owner="HR Department",
                controller="Ingfa P.",
                version="v2",
                status="Draft",
                summary_lines=[
                    "Awaiting latest PDF upload before review submission.",
                    "Fields prepared for manager and employee signature.",
                    "Visible signature blocks are reserved in advance.",
                ],
                signature_boxes=[
                    ("Manager", 90, 150, 170, 52),
                    ("Employee", 320, 150, 170, 52),
                ],
            ),
        ),
    ]

    for filename, lines in documents:
        (output_dir / filename).write_bytes(build_pdf(lines))


if __name__ == "__main__":
    main()
