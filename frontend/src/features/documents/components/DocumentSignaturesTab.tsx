import React from 'react';
import { AssignDocumentSignatureInput, DocumentSignatureRequest } from '../types';
import { AppUser } from '../../users/types';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';

interface DocumentSignaturesTabProps {
  signatures: DocumentSignatureRequest[];
  signers: AppUser[];
  canManage: boolean;
  signatureForm: AssignDocumentSignatureInput;
  onFormChange: (patch: Partial<AssignDocumentSignatureInput>) => void;
  onAssign: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function DocumentSignaturesTab({
  signatures,
  signers,
  canManage,
  signatureForm,
  onFormChange,
  onAssign,
}: DocumentSignaturesTabProps) {
  return (
    <div className="stack stack--xl">
      {canManage && (
        <section className="form-section stack--compact">
          <h3 className="form-section__title">Assign New Signer</h3>
          <p className="muted">Configure a signature placeholder at a specific page and coordinate.</p>
          <form className="form-grid" onSubmit={onAssign}>
            <div className="grid-3">
              <div>
                <label className="sidebar__status-label">Signer</label>
                <select
                  className="input input--select"
                  value={signatureForm.signerUserId}
                  onChange={(e) => onFormChange({ signerUserId: e.target.value })}
                >
                  <option value="">Select a user...</option>
                  {signers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName} ({s.username})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="sidebar__status-label">Signing Order</label>
                <input
                  className="input"
                  min={1}
                  type="number"
                  value={signatureForm.signingOrder}
                  onChange={(e) => onFormChange({ signingOrder: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="sidebar__status-label">Page Number</label>
                <input
                  className="input"
                  min={1}
                  type="number"
                  value={signatureForm.pageNumber}
                  onChange={(e) => onFormChange({ pageNumber: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid-4">
              <div>
                <label className="sidebar__status-label">Pos X</label>
                <input
                  className="input"
                  type="number"
                  value={signatureForm.positionX}
                  onChange={(e) => onFormChange({ positionX: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="sidebar__status-label">Pos Y</label>
                <input
                  className="input"
                  type="number"
                  value={signatureForm.positionY}
                  onChange={(e) => onFormChange({ positionY: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="sidebar__status-label">Width</label>
                <input
                  className="input"
                  type="number"
                  value={signatureForm.width}
                  onChange={(e) => onFormChange({ width: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="sidebar__status-label">Height</label>
                <input
                  className="input"
                  type="number"
                  value={signatureForm.height}
                  onChange={(e) => onFormChange({ height: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="actions">
              <button
                className="button"
                disabled={!signatureForm.signerUserId}
                type="submit"
              >
                Assign Signer
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Signer</th>
              <th>Status</th>
              <th>Placement</th>
              <th>Activity</th>
            </tr>
          </thead>
          <tbody>
            {signatures.map((sig) => (
              <tr key={sig.id}>
                <td>
                  <strong>#{sig.signingOrder}</strong>
                </td>
                <td>
                  <div>{sig.signerDisplayName}</div>
                  <div className="muted">{sig.signerUsername}</div>
                </td>
                <td>
                  <StatusBadge status={sig.status} />
                </td>
                <td>
                  <div>Page {sig.pageNumber}</div>
                  <div className="muted">
                    {sig.positionX}, {sig.positionY} ({sig.width}×{sig.height})
                  </div>
                </td>
                <td>
                  {sig.signedAt ? (
                    <div className="muted">Signed: {new Date(sig.signedAt).toLocaleString()}</div>
                  ) : (
                    <span className="muted">Pending</span>
                  )}
                  {sig.actions.map((act) => (
                    <div key={act.id} className="comment-block">
                      <div className="muted">
                        {act.actionType} by {act.performedBy}
                      </div>
                      {act.comment && <div className="timeline-comment">{act.comment}</div>}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
            {signatures.length === 0 && (
              <tr>
                <td className="muted" colSpan={5}>
                  No signers assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
