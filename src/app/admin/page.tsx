'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { SiteShell } from '@/components/site-shell';
import MatchForm from '@/components/MatchForm';
import MatchList from '@/components/MatchList';

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

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Admin emails
  const ADMIN_EMAILS = ['dedansrugby@gmail.com', 'admin@dekutrugby.com'];

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        const userEmail = session.user?.email;
        
        if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
          router.push('/');
          return;
        }

        setUser(session.user);
        loadMatches();
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  const loadMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;

    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMatches(matches.filter(m => m.id !== id));
      alert('Match deleted successfully');
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Failed to delete match');
    }
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setEditingMatch(null);
    setShowForm(false);
    loadMatches();
  };

  if (loading) {
    return (
      <SiteShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading admin dashboard...</p>
          </div>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Welcome, {user?.email}</p>
        </div>

        {/* Actions */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
          >
            {showForm ? 'Cancel' : '+ Add New Match'}
          </button>
        </div>

        {/* Match Form */}
        {showForm && (
          <div className="mb-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingMatch ? 'Edit Match' : 'Add New Match'}
            </h2>
            <MatchForm 
              match={editingMatch || undefined}
              onClose={handleFormClose}
            />
          </div>
        )}

        {/* Matches List */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6">Manage Matches</h2>
          <MatchList 
            matches={matches}
            onEdit={handleEditMatch}
            onDelete={handleDeleteMatch}
          />
        </div>
      </div>
    </SiteShell>
  );
}
