import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AssignDocumentSignatureInput, DocumentSignatureRequest } from '../types';
import { AppUser } from '../../users/types';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { useTranslation } from '../../../i18n/useTranslation';

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
  const { t } = useTranslation();
  const DEMO_PAGE_WIDTH = 720;
  const DEMO_PAGE_HEIGHT = 980;
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [signatureMode, setSignatureMode] = useState<'hybrid' | 'digital' | 'image'>('hybrid');
  const [appearanceLabel, setAppearanceLabel] = useState(t('signatures.digitalStamp'));
  const [demoRequests, setDemoRequests] = useState<DocumentSignatureRequest[]>(signatures);
  const [dragState, setDragState] = useState<{ offsetX: number; offsetY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const selectedSigner = useMemo(
    () => signers.find((signer) => signer.id === signatureForm.signerUserId) ?? null,
    [signatureForm.signerUserId, signers],
  );
  const previewSignerName = selectedSigner?.displayName || selectedSigner?.username || t('signatures.signerLabel');
  const previewInitials = previewSignerName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'SG';
  const totalSignatures = signatures.length;
  const activeSignatures = isDemoMode ? demoRequests : signatures;
  const pendingSignatures = activeSignatures.filter((signature) => signature.status === 'Pending').length;
  const signedSignatures = activeSignatures.filter((signature) => signature.status === 'Signed').length;
  const pageCount = new Set(activeSignatures.map((signature) => signature.pageNumber)).size;
  const currentDemoOrder = useMemo(() => {
    const pendingOrders = activeSignatures
      .filter((signature) => signature.status === 'Pending')
      .map((signature) => signature.signingOrder);

    return pendingOrders.length > 0 ? Math.min(...pendingOrders) : null;
  }, [activeSignatures]);
  const currentDemoSigner = useMemo(
    () => activeSignatures.find((signature) => signature.status === 'Pending' && signature.signingOrder === currentDemoOrder) ?? null,
    [activeSignatures, currentDemoOrder],
  );

  useEffect(() => {
    setDemoRequests(signatures);
  }, [signatures]);

  useEffect(() => {
    setAppearanceLabel((current) => current.trim().length > 0 ? current : t('signatures.digitalStamp'));
  }, [t]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const activeDragState = dragState;

    function handlePointerMove(event: PointerEvent) {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const nextX = clamp(((event.clientX - rect.left - activeDragState.offsetX) / rect.width) * DEMO_PAGE_WIDTH, 0, DEMO_PAGE_WIDTH - signatureForm.width);
      const nextY = clamp(((event.clientY - rect.top - activeDragState.offsetY) / rect.height) * DEMO_PAGE_HEIGHT, 0, DEMO_PAGE_HEIGHT - signatureForm.height);

      onFormChange({
        positionX: Math.round(nextX),
        positionY: Math.round(nextY),
      });
    }

    function handlePointerUp() {
      setDragState(null);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [DEMO_PAGE_HEIGHT, DEMO_PAGE_WIDTH, dragState, onFormChange, signatureForm.height, signatureForm.width]);

  function generateId(prefix: string) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function buildAction(performedBy: string, actionType: 'Assigned' | 'Signed' | 'Rejected', comment: string | null) {
    return {
      id: generateId('action'),
      actionType,
      performedBy,
      performedAt: new Date().toISOString(),
      comment,
      outputObjectKey: actionType === 'Signed' ? `demo/signed/${generateId('pdf')}.pdf` : null,
    } as DocumentSignatureRequest['actions'][number];
  }

  function getModeLabel(mode: 'hybrid' | 'digital' | 'image') {
    switch (mode) {
      case 'digital':
        return t('signatures.modeDigitalTitle');
      case 'image':
        return t('signatures.modeImageTitle');
      default:
        return t('signatures.modeHybridTitle');
    }
  }

  function addDemoSignature() {
    if (!selectedSigner) {
      return;
    }

    const newRequest: DocumentSignatureRequest = {
      id: generateId('signature'),
      documentId: 'demo-document',
      documentVersionId: 'demo-version',
      signerUserId: selectedSigner.id,
      signerUsername: selectedSigner.username,
      signerDisplayName: selectedSigner.displayName,
      signingOrder: signatureForm.signingOrder,
      status: 'Pending',
      pageNumber: signatureForm.pageNumber,
      positionX: signatureForm.positionX,
      positionY: signatureForm.positionY,
      width: signatureForm.width,
      height: signatureForm.height,
      signedAt: null,
      comment: signatureForm.comment?.trim() || `${t('signatures.modeLabel')}: ${getModeLabel(signatureMode)} • ${appearanceLabel}`,
      isForCurrentVersion: true,
      actions: [
        buildAction('demo.admin', 'Assigned', `${t('signatures.modeLabel')}: ${getModeLabel(signatureMode)}`),
      ],
    };

    setDemoRequests((current) =>
      [...current, newRequest].sort(
        (left: DocumentSignatureRequest, right: DocumentSignatureRequest) =>
          left.signingOrder - right.signingOrder || left.signerDisplayName.localeCompare(right.signerDisplayName),
      ),
    );
  }

  function updateDemoSignature(signatureId: string, action: 'sign' | 'reject') {
    setDemoRequests((current) =>
      current.map((signature) => {
        if (signature.id !== signatureId) {
          return signature;
        }

        const performedBy = signature.signerDisplayName || signature.signerUsername;
        const comment = action === 'sign'
          ? t('signatures.signedNotice')
          : t('signatures.rejectedNotice');

        return {
          ...signature,
          status: action === 'sign' ? 'Signed' : 'Rejected',
          signedAt: action === 'sign' ? new Date().toISOString() : null,
          actions: [
            ...signature.actions,
            buildAction(performedBy, action === 'sign' ? 'Signed' : 'Rejected', comment),
          ],
        };
      }),
    );
  }

  function resetDemoFlow() {
    setDemoRequests(signatures);
  }

  function beginDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDemoMode) {
      return;
    }

    event.stopPropagation();

    const box = event.currentTarget.getBoundingClientRect();

    setDragState({
      offsetX: event.clientX - box.left,
      offsetY: event.clientY - box.top,
    });
  }

  function movePlacementToPoint(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDemoMode || dragState) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const nextX = clamp(((event.clientX - rect.left) / rect.width) * DEMO_PAGE_WIDTH - signatureForm.width / 2, 0, DEMO_PAGE_WIDTH - signatureForm.width);
    const nextY = clamp(((event.clientY - rect.top) / rect.height) * DEMO_PAGE_HEIGHT - signatureForm.height / 2, 0, DEMO_PAGE_HEIGHT - signatureForm.height);

    onFormChange({
      positionX: Math.round(nextX),
      positionY: Math.round(nextY),
    });
  }

  return (
    <div className="stack stack--xl">
      <div className="dashboard-summary-grid">
        <StatCard label={t('signatures.totalAssigned')} value={isDemoMode ? activeSignatures.length : totalSignatures} />
        <StatCard label={t('signatures.totalPending')} value={pendingSignatures} />
        <StatCard label={t('signatures.signedCount')} value={signedSignatures} />
        <StatCard label={t('signatures.signedPages')} value={pageCount} />
      </div>

      <section className="callout signature-demo-callout">
        <div className="signature-demo-callout__header">
          <div className="stack stack--compact">
            <strong>{t('signatures.demoCalloutTitle')}</strong>
            <div className="muted">{t('signatures.demoCalloutDescription')}</div>
          </div>
          <div className="actions">
            <button
              className={`button button--secondary${isDemoMode ? ' is-active' : ''}`}
              type="button"
              onClick={() => setIsDemoMode((current) => !current)}
            >
              {isDemoMode ? t('signatures.useLiveData') : t('signatures.useDemoMode')}
            </button>
            {isDemoMode ? (
              <button className="button button--secondary" type="button" onClick={resetDemoFlow}>
                {t('signatures.resetDemo')}
              </button>
            ) : null}
          </div>
        </div>

        {currentDemoSigner ? (
          <div className="signature-demo-flow">
            <span className="tag">{t('signatures.currentStepTag')}</span>
            <strong>{currentDemoSigner.signerDisplayName}</strong>
            <span className="muted">{t('signatures.currentOrderPage', { order: currentDemoSigner.signingOrder, page: currentDemoSigner.pageNumber })}</span>
          </div>
        ) : (
          <div className="muted">{t('signatures.noPendingDemo')}</div>
        )}
      </section>

      {canManage && (
        <section className="form-section stack--compact">
          <h3 className="form-section__title">{t('signatures.designerTitle')}</h3>
          <p className="muted">{t('signatures.designerDescription')}</p>
          <form className="form-grid" onSubmit={onAssign}>
            <div className="grid-3">
              <div>
                <label className="sidebar__status-label">{t('signatures.signerLabel')}</label>
                <select
                  className="input input--select"
                  value={signatureForm.signerUserId}
                  onChange={(e) => onFormChange({ signerUserId: e.target.value })}
                >
                  <option value="">{t('signatures.chooseUser')}</option>
                  {signers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName} ({s.username})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="sidebar__status-label">{t('signatures.orderInput')}</label>
                <input
                  className="input"
                  min={1}
                  type="number"
                  value={signatureForm.signingOrder}
                  onChange={(e) => onFormChange({ signingOrder: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="sidebar__status-label">{t('signatures.pageInput')}</label>
                <input
                  className="input"
                  min={1}
                  type="number"
                  value={signatureForm.pageNumber}
                  onChange={(e) => onFormChange({ pageNumber: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="stack">
                <label className="sidebar__status-label">{t('signatures.modeLabel')}</label>
                <div className="selection-grid">
                  <button
                    className={`selection-card${signatureMode === 'hybrid' ? ' selection-card--selected' : ''}`}
                    type="button"
                    onClick={() => setSignatureMode('hybrid')}
                  >
                    <span className="selection-card__check" aria-hidden="true">{signatureMode === 'hybrid' ? '✓' : ''}</span>
                    <span className="selection-card__title">{t('signatures.modeHybridTitle')}</span>
                    <span className="selection-card__description">{t('signatures.modeHybridDescription')}</span>
                  </button>
                  <button
                    className={`selection-card${signatureMode === 'digital' ? ' selection-card--selected' : ''}`}
                    type="button"
                    onClick={() => setSignatureMode('digital')}
                  >
                    <span className="selection-card__check" aria-hidden="true">{signatureMode === 'digital' ? '✓' : ''}</span>
                    <span className="selection-card__title">{t('signatures.modeDigitalTitle')}</span>
                    <span className="selection-card__description">{t('signatures.modeDigitalDescription')}</span>
                  </button>
                  <button
                    className={`selection-card${signatureMode === 'image' ? ' selection-card--selected' : ''}`}
                    type="button"
                    onClick={() => setSignatureMode('image')}
                  >
                    <span className="selection-card__check" aria-hidden="true">{signatureMode === 'image' ? '✓' : ''}</span>
                    <span className="selection-card__title">{t('signatures.modeImageTitle')}</span>
                    <span className="selection-card__description">{t('signatures.modeImageDescription')}</span>
                  </button>
                </div>
              </div>
              <div className="stack">
                <label className="sidebar__status-label" htmlFor="signature-appearance-label">{t('signatures.appearanceLabelTitle')}</label>
                <input
                  id="signature-appearance-label"
                  className="input"
                  value={appearanceLabel}
                  onChange={(event) => setAppearanceLabel(event.target.value)}
                  placeholder={t('signatures.appearancePlaceholder')}
                />
                <p className="muted">{t('signatures.appearanceDescription')}</p>
              </div>
              <div className="signature-preview-panel">
                <div className="signature-preview-panel__header">
                  <strong>{t('signatures.previewFrameTitle')}</strong>
                  <span className="status-pill status-pill--subtle">
                    {signatureMode === 'hybrid' ? t('signatures.previewModeHybrid') : signatureMode === 'digital' ? t('signatures.previewModeDigital') : t('signatures.previewModeImage')}
                  </span>
                </div>
                <div className={`signature-preview signature-preview--${signatureMode}`}>
                  <div className="signature-preview__stamp">{appearanceLabel}</div>
                  <div className="signature-preview__identity">
                    <div className="signature-preview__avatar">{previewInitials}</div>
                    <div className="stack stack--compact">
                      <strong>{previewSignerName}</strong>
                      <span className="muted">{t('signatures.previewPageOrder', { page: signatureForm.pageNumber, order: signatureForm.signingOrder })}</span>
                    </div>
                  </div>
                  {signatureMode !== 'digital' ? (
                    <div className="signature-preview__image">
                      <span className="signature-preview__scribble">{t('signatures.signatureWord')}</span>
                    </div>
                  ) : null}
                  <div className="signature-preview__meta">
                    <span>X:{signatureForm.positionX}</span>
                    <span>Y:{signatureForm.positionY}</span>
                    <span>{signatureForm.width} × {signatureForm.height}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="signature-canvas-section">
              <div className="signature-canvas-section__header">
                <div className="stack stack--compact">
                  <strong>{t('signatures.canvasTitle')}</strong>
                  <span className="muted">{t('signatures.canvasDescription')}</span>
                </div>
                <div className="tag-list">
                  <span className="tag">{t('signatures.page', { value: signatureForm.pageNumber })}</span>
                  <span className="tag">X {signatureForm.positionX}</span>
                  <span className="tag">Y {signatureForm.positionY}</span>
                </div>
              </div>

              <div
                ref={canvasRef}
                className="signature-canvas"
                onPointerDown={movePlacementToPoint}
                role="presentation"
              >
                <div className="signature-canvas__sheet">
                  <div className="signature-canvas__header">
                    <strong>{t('documents.pdfPreviewMetric')}</strong>
                    <span>{t('signatures.page', { value: signatureForm.pageNumber })}</span>
                  </div>
                  <div className="signature-canvas__body">
                    <div className="signature-canvas__line signature-canvas__line--short" />
                    <div className="signature-canvas__line" />
                    <div className="signature-canvas__line" />
                    <div className="signature-canvas__line signature-canvas__line--mid" />
                    <div className="signature-canvas__line" />

                    {activeSignatures.map((signature) => (
                      <div
                        key={signature.id}
                        className={`signature-canvas__placed signature-canvas__placed--${signature.status.toLowerCase()}`}
                        style={toCanvasStyle(signature.positionX, signature.positionY, signature.width, signature.height, DEMO_PAGE_WIDTH, DEMO_PAGE_HEIGHT)}
                      >
                        <span>{signature.signerDisplayName}</span>
                      </div>
                    ))}

                    <div
                      className={`signature-canvas__draft signature-canvas__draft--${signatureMode}`}
                      style={toCanvasStyle(signatureForm.positionX, signatureForm.positionY, signatureForm.width, signatureForm.height, DEMO_PAGE_WIDTH, DEMO_PAGE_HEIGHT)}
                      onPointerDown={beginDrag}
                      role="presentation"
                    >
                      <span>{previewSignerName}</span>
                      <small>{appearanceLabel}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid-4">
              <div>
                <label className="sidebar__status-label">{t('signatures.positionXLabel')}</label>
                <input
                  className="input"
                  type="number"
                  value={signatureForm.positionX}
                  onChange={(e) => onFormChange({ positionX: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="sidebar__status-label">{t('signatures.positionYLabel')}</label>
                <input
                  className="input"
                  type="number"
                  value={signatureForm.positionY}
                  onChange={(e) => onFormChange({ positionY: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="sidebar__status-label">{t('signatures.widthLabel')}</label>
                <input
                  className="input"
                  type="number"
                  value={signatureForm.width}
                  onChange={(e) => onFormChange({ width: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="sidebar__status-label">{t('signatures.heightLabel')}</label>
                <input
                  className="input"
                  type="number"
                  value={signatureForm.height}
                  onChange={(e) => onFormChange({ height: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="callout">
              <strong>{t('signatures.demoNoteTitle')}</strong>
              <div className="muted">{t('signatures.demoNoteDescription')}</div>
            </div>

            <div className="actions">
              <button
                className="button"
                disabled={!signatureForm.signerUserId}
                type={isDemoMode ? 'button' : 'submit'}
                onClick={isDemoMode ? addDemoSignature : undefined}
              >
                {t('signatures.addSigner')}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="registry-list">
        {activeSignatures.map((sig) => (
          <article key={sig.id} className="registry-item">
            <div className="registry-item__main">
              <div className="registry-item__header">
                <div className="stack stack--compact">
                  <strong className="registry-item__title">{sig.signerDisplayName}</strong>
                  <p className="muted">{sig.signerUsername}</p>
                </div>
                <div className="tag-list">
                  <span className="tag">{t('signatures.orderLabel', { order: sig.signingOrder })}</span>
                  {isDemoMode && currentDemoOrder === sig.signingOrder && sig.status === 'Pending' ? <span className="tag">{t('signatures.readyToSign')}</span> : null}
                  <StatusBadge status={sig.status} />
                </div>
              </div>

              <div className="registry-meta">
                <span>{t('signatures.page', { value: sig.pageNumber })}</span>
                <span>X:{sig.positionX} Y:{sig.positionY}</span>
                <span>{sig.width} × {sig.height}</span>
                <span>{sig.isForCurrentVersion ? t('signatures.currentVersionLabel') : t('signatures.oldVersionLabel')}</span>
              </div>

              <div className="signature-placement-card">
                <div className="signature-placement-card__header">
                  <strong>{t('signatures.placementTitle')}</strong>
                  <span className="muted">{t('signatures.page', { value: sig.pageNumber })}</span>
                </div>
                <div className="signature-placement-preview">
                  <div
                    className="signature-placement-preview__box"
                    style={{
                      left: `${Math.max(4, Math.min(78, sig.positionX / 8))}%`,
                      top: `${Math.max(6, Math.min(72, sig.positionY / 11))}%`,
                      width: `${Math.max(14, Math.min(28, sig.width / 10))}%`,
                      height: `${Math.max(12, Math.min(24, sig.height / 5))}%`,
                    }}
                  >
                    <span>{t('signatures.placementLabel')}</span>
                  </div>
                </div>
                <div className="signature-placement-card__meta">
                  <span>{t('signatures.orderLabel', { order: sig.signingOrder })}</span>
                  <span>X {sig.positionX}</span>
                  <span>Y {sig.positionY}</span>
                  <span>W {sig.width}</span>
                  <span>H {sig.height}</span>
                </div>
              </div>

              <div className="callout signature-callout">
                <strong>{t('signatures.recommendedTitle')}</strong>
                <div className="muted">{t('signatures.recommendedDescription')}</div>
              </div>

              {sig.signedAt ? (
                <div className="muted">{t('signatures.signedAt', { value: new Date(sig.signedAt).toLocaleString() })}</div>
              ) : (
                <span className="muted">{t('signatures.pendingAction')}</span>
              )}

              {isDemoMode ? (
                <div className="actions">
                  <button
                    className="button"
                    type="button"
                    disabled={sig.status !== 'Pending' || currentDemoOrder !== sig.signingOrder}
                    onClick={() => updateDemoSignature(sig.id, 'sign')}
                  >
                    {t('signatures.simulateSign')}
                  </button>
                  <button
                    className="button button--secondary"
                    type="button"
                    disabled={sig.status !== 'Pending' || currentDemoOrder !== sig.signingOrder}
                    onClick={() => updateDemoSignature(sig.id, 'reject')}
                  >
                    {t('signatures.simulateReject')}
                  </button>
                </div>
              ) : null}

              {sig.actions.map((act) => (
                <div key={act.id} className="comment-block">
                  <div className="muted">
                    {t('signatures.actionBy', { action: act.actionType, name: act.performedBy })}
                  </div>
                  {act.comment ? <div className="timeline-comment">{act.comment}</div> : null}
                </div>
              ))}
            </div>
          </article>
        ))}

        {activeSignatures.length === 0 ? (
          <div className="callout">
            <strong>{t('signatures.noSignersTitle')}</strong>
            <div className="muted">{t('signatures.noSignersDescription')}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toCanvasStyle(x: number, y: number, width: number, height: number, pageWidth: number, pageHeight: number) {
  return {
    left: `${(x / pageWidth) * 100}%`,
    top: `${(y / pageHeight) * 100}%`,
    width: `${(width / pageWidth) * 100}%`,
    height: `${(height / pageHeight) * 100}%`,
  };
}
