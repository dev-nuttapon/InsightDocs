# PDF Signature Workflow

## Current Architecture

InsightDocs now separates approval from signature workflow.

Core parts:

- `DocumentSignatureRequest`: assignment, signer, order, status, placement coordinates
- `DocumentSignatureAction`: append-only history for assign, sign, reject, and cancel events
- `IDocumentObjectStorage`: reads and writes PDF bytes in MinIO
- `IPdfDigitalSignatureService`: provider abstraction that applies a visible signature block onto the PDF file itself

The current implementation uses a `PdfSharpCore`-based provider to update the PDF binary and persist the signed output back to MinIO.

## Signing Flow

1. A document must already be `Approved`.
2. A `DocumentController`, `Manager`, or `Admin` assigns signers on the current document version.
3. Each signer gets:
   - page number
   - x/y position
   - width/height
   - signing order
4. The assigned signer signs in sequence.
5. The backend loads the latest PDF for that version:
   - previous signed output if earlier signers already signed
   - otherwise the current version's original PDF
6. The PDF signing provider writes a visible signature block onto the PDF.
7. The new signed PDF is stored in MinIO and the version's `SignedObjectKey` is updated.

## Restrictions

- only `Approved` documents can be signed
- only the assigned signer can sign or reject their request, unless an `Admin` intervenes
- later signers are blocked until all earlier signing orders are signed
- signature requests tied to superseded versions are cancelled when a new version is uploaded or restored
- approval and signature remain separate workflows

## Provider Assumption

The current provider updates the PDF file itself and stores real signed-output binaries, but it is not yet a certificate-backed cryptographic signing engine.

The abstraction is designed so a stronger provider can replace the current implementation later without changing controller or workflow contracts.
