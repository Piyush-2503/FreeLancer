import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import SignaturePad from 'signature_pad';
import { contractsApi } from '../../api/contracts.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { AlertTriangle } from 'lucide-react';

const STATUS_BADGE = { draft: 'default', sent: 'info', signed: 'success', rejected: 'danger' };

export default function ContractSignPage() {
  const { token } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [signerNameError, setSignerNameError] = useState('');
  const [signLoading, setSignLoading] = useState(false);
  const [done, setDone] = useState(null); // 'signed' | 'rejected'
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const canvasRef = useRef(null);
  const sigPadRef = useRef(null);

  useEffect(() => {
    contractsApi.getPublic(token)
      .then(res => setContract(res.data?.data?.contract || res.data?.contract || res.data))
      .catch(() => setError('Contract not found or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  // Initialize SignaturePad after contract loads
  useEffect(() => {
    if (contract && canvasRef.current && !sigPadRef.current && contract.status === 'sent') {
      sigPadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(15, 23, 42)',
      });
    }
  }, [contract]);

  function clearSignature() {
    sigPadRef.current?.clear();
  }

  async function handleSign() {
    let valid = true;
    if (!signerName.trim()) {
      setSignerNameError('Your name is required');
      valid = false;
    } else {
      setSignerNameError('');
    }
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      setError('Please draw your signature before submitting.');
      valid = false;
    }
    if (!valid) return;

    setSignLoading(true);
    setError(null);
    try {
      const sigData = sigPadRef.current.toDataURL();
      await contractsApi.sign(token, {
        signerName: signerName.trim(),
        signatureImage: sigData,
        signatureImageData: sigData,
      });
      setDone('signed');
      setContract(c => ({ ...c, status: 'signed', signerName: signerName.trim() }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sign contract. Please try again.');
    } finally {
      setSignLoading(false);
    }
  }

  async function handleReject() {
    setRejectLoading(true);
    try {
      await contractsApi.reject(token);
      setDone('rejected');
      setContract(c => ({ ...c, status: 'rejected' }));
      setShowRejectConfirm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject contract.');
    } finally {
      setRejectLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-page py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="font-bold text-text-primary text-lg">FreelanceHub</span>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && !contract && (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-danger font-medium mb-2">Not Found</p>
            <p className="text-text-secondary text-sm mb-4">{error}</p>
            <Link to="/" className="text-sm text-accent hover:underline">← Back to FreelanceHub</Link>
          </div>
        )}

        {contract && (
          <div className="space-y-6">
            {/* Status banners */}
            {(contract.status === 'signed' || done === 'signed') && (
              <div className="bg-success-soft border border-success/20 rounded-xl p-4 text-center">
                <p className="font-semibold text-success">✓ Contract Signed</p>
                <p className="text-sm text-text-secondary mt-1">
                  This contract was signed by <strong>{contract.signerName}</strong>.
                  {contract.signedAt && ` Signed on ${new Date(contract.signedAt).toLocaleDateString('en-IN')}.`}
                </p>
              </div>
            )}
            {(contract.status === 'rejected' || done === 'rejected') && (
              <div className="bg-danger-soft border border-danger/20 rounded-xl p-4 text-center">
                <p className="font-semibold text-danger">Contract Rejected</p>
                <p className="text-sm text-text-secondary mt-1">This contract has been declined.</p>
              </div>
            )}

            {/* Contract card */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-text-primary">{contract.title}</h1>
                    {contract.freelancer && (
                      <p className="text-sm text-text-muted mt-1">From: <strong>{contract.freelancer.businessName || contract.freelancer.name}</strong></p>
                    )}
                    {contract.client && (
                      <p className="text-sm text-text-muted">To: <strong>{contract.client.name}</strong></p>
                    )}
                  </div>
                  <Badge variant={STATUS_BADGE[contract.status] || 'default'}>{contract.status}</Badge>
                </div>
              </div>
              <div className="p-6 max-h-64 overflow-y-auto bg-subtle/30">
                <pre className="whitespace-pre-wrap font-sans text-sm text-text-secondary leading-relaxed">
                  {contract.body}
                </pre>
              </div>
            </div>

            {/* E-Signature section (only if 'sent') */}
            {contract.status === 'sent' && !done && (
              <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
                {/* Disclaimer */}
                <div className="flex gap-3 p-4 bg-warning-soft border border-warning/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-warning">Demonstration E-Signature</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      This is a demonstration e-signature for FreelanceHub. It is <strong>not legally certified or binding</strong>.
                      Do not use for legally binding agreements.
                    </p>
                  </div>
                </div>

                {/* Signer name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Your Full Name *</label>
                  <input
                    value={signerName}
                    onChange={e => { setSignerName(e.target.value); setSignerNameError(''); }}
                    placeholder="Type your full legal name"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  {signerNameError && <p className="text-xs text-danger mt-1">{signerNameError}</p>}
                </div>

                {/* Signature pad */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-text-primary">Draw Your Signature *</label>
                    <button onClick={clearSignature} className="text-xs text-accent hover:underline">Clear</button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={150}
                    className="border border-border rounded-lg w-full touch-none bg-white"
                    style={{ touchAction: 'none' }}
                  />
                  <p className="text-xs text-text-muted mt-1">Draw your signature above using mouse or touch</p>
                </div>

                {error && (
                  <div className="p-3 bg-danger-soft border border-danger/20 rounded-lg">
                    <p className="text-sm text-danger">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => setShowRejectConfirm(true)}
                    className="text-danger hover:bg-danger-soft"
                  >
                    Decline / Reject
                  </Button>
                  <Button variant="primary" loading={signLoading} onClick={handleSign}>
                    Sign Contract
                  </Button>
                </div>
              </div>
            )}

            <p className="text-center text-xs text-text-muted">
              Powered by <Link to="/" className="text-accent hover:underline">FreelanceHub</Link>
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showRejectConfirm}
        onClose={() => setShowRejectConfirm(false)}
        onConfirm={handleReject}
        loading={rejectLoading}
        title="Reject Contract"
        message="Are you sure you want to reject this contract?"
      />
    </div>
  );
}
