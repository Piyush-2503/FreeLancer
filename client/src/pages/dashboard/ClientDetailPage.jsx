import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { clientsApi } from '../../api/clients.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ArrowLeft, Mail, Phone, Building2, MapPin, FileText, Archive, Edit2 } from 'lucide-react';

export default function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    clientsApi.get(id)
      .then(res => setClient(res.data?.data?.client || res.data?.client || res.data))
      .catch(() => {
        showToast('Client not found', 'error');
        navigate('/dashboard/clients');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!client) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard/clients">
          <button className="p-2 rounded-input hover:bg-surface-subtle transition-colors">
            <ArrowLeft className="w-4 h-4 text-text-muted" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text">{client.name}</h1>
          {client.company && <p className="text-text-muted text-sm">{client.company}</p>}
        </div>
        <div className="flex items-center gap-2">
          {client.archivedAt ? (
            <Badge variant="neutral">Archived</Badge>
          ) : (
            <Badge variant="success">Active</Badge>
          )}
          <Link to={`/dashboard/clients`}>
            <Button variant="secondary" size="sm">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-text mb-4">Contact Information</h2>
            <div className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-text-muted shrink-0" />
                  <a href={`mailto:${client.email}`} className="text-sm text-accent hover:underline">{client.email}</a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-text-muted shrink-0" />
                  <span className="text-sm text-text-secondary">{client.phone}</span>
                </div>
              )}
              {client.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-text-muted shrink-0" />
                  <span className="text-sm text-text-secondary">{client.company}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  <span className="text-sm text-text-secondary">{client.address}</span>
                </div>
              )}
            </div>
          </Card>

          {client.notes && (
            <Card>
              <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Notes
              </h2>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{client.notes}</p>
            </Card>
          )}
        </div>

        {/* Placeholder for Projects and Invoices */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-text mb-4">Projects</h2>
            <div className="text-center py-8 text-text-muted text-sm">
              Projects will appear here — coming in Phase 2
            </div>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold text-text mb-4">Invoices</h2>
            <div className="text-center py-8 text-text-muted text-sm">
              Invoices will appear here — coming in Phase 2
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
