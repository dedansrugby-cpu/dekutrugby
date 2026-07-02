'use client';

interface Match {
  id: string;
  date: string;
  opponent: string;
  venue: string;
  format: string;
  status: string;
  score_for: number;
  score_against: number;
  result: string;
}

interface MatchListProps {
  matches: Match[];
  onEdit: (match: Match) => void;
  onDelete: (id: string) => void;
}

export default function MatchList({ matches, onEdit, onDelete }: MatchListProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      scheduled: { bg: 'bg-blue-900', text: 'text-blue-200' },
      live: { bg: 'bg-green-900', text: 'text-green-200' },
      completed: { bg: 'bg-gray-700', text: 'text-gray-200' },
      cancelled: { bg: 'bg-red-900', text: 'text-red-200' },
    };
    const badge = badges[status] || badges.scheduled;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win':
        return 'text-green-400';
      case 'loss':
        return 'text-red-400';
      case 'draw':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No matches scheduled yet.</p>
        <p className="text-gray-500 text-sm">Click "Add New Match" to create one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <div
          key={match.id}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-red-600 transition"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Match Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white">
                  Dedan Marshalls vs {match.opponent}
                </h3>
                {getStatusBadge(match.status)}
              </div>
              <p className="text-gray-400 text-sm mb-2">{formatDate(match.date)}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-gray-300">
                  📍 <span className="font-semibold">{match.venue}</span>
                </span>
                <span className="text-gray-300">
                  🏉 <span className="font-semibold">{match.format}</span>
                </span>
                {match.status === 'completed' && (
                  <span className={`font-semibold ${getResultColor(match.result)}`}>
                    {match.score_for} - {match.score_against} ({match.result.toUpperCase()})
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(match)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(match.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
