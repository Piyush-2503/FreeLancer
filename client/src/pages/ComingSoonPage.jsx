import { LayoutDashboard, Clock } from 'lucide-react';
import Card from '../components/ui/Card.jsx';

export default function ComingSoonPage({ feature = 'This feature', phase = '?' }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center p-10">
        <div className="w-16 h-16 bg-accent-soft rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-xl font-bold text-text mb-2">{feature}</h2>
        <p className="text-text-secondary mb-4">
          This feature is being built in Phase {phase} of the development roadmap.
        </p>
        <p className="text-sm text-text-muted">
          Phase 1 is complete: Authentication, Clients, and the Landing Page are live.
        </p>
      </Card>
    </div>
  );
}
