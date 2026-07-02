'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Match {
  id?: string;
  date: string;
  opponent: string;
  venue: string;
  format: string;
  status: string;
  score_for: number;
  score_against: number;
  result: string;
  notes?: string;
}

interface MatchFormProps {
  match?: Match;
  onClose: () => void;
}

export default function MatchForm({ match, onClose }: MatchFormProps) {
  const [formData, setFormData] = useState<Match>(
    match || {
      date: new Date().toISOString().slice(0, 16),
      opponent: '',
      venue: 'Home',
      format: '15s',
      status: 'scheduled',
      score_for: 0,
      score_against: 0,
      result: 'pending',
      notes: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['score_for', 'score_against'].includes(name) ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.opponent.trim()) {
        throw new Error('Opponent name is required');
      }

      if (match?.id) {
        // Update existing match
        const { error: updateError } = await supabase
          .from('matches')
          .update(formData)
          .eq('id', match.id);

        if (updateError) throw updateError;
        alert('Match updated successfully');
      } else {
        // Create new match
        const { error: insertError } = await supabase
          .from('matches')
          .insert([formData]);

        if (insertError) throw insertError;
        alert('Match created successfully');
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error saving match:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date & Time */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Date & Time *
          </label>
          <input
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-600"
          />
        </div>

        {/* Opponent */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Opponent *
          </label>
          <input
            type="text"
            name="opponent"
            value={formData.opponent}
            onChange={handleChange}
            placeholder="e.g., Nairobi Sevens"
            required
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-600 placeholder-gray-500"
          />
        </div>

        {/* Venue */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Venue
          </label>
          <input
            type="text"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            placeholder="e.g., Nairobi Stadium"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-600 placeholder-gray-500"
          />
        </div>

        {/* Format */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Format
          </label>
          <select
            name="format"
            value={formData.format}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-600"
          >
            <option value="7s">Sevens (7s)</option>
            <option value="10s">Tens (10s)</option>
            <option value="15s">Full (15s)</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-600"
          >
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Result */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Result
          </label>
          <select
            name="result"
            value={formData.result}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-600"
          >
            <option value="pending">Pending</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="draw">Draw</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Score For */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Our Score
          </label>
          <input
            type="number"
            name="score_for"
            value={formData.score_for}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-600"
          />
        </div>

        {/* Score Against */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Opponent Score
          </label>
          <input
            type="number"
            name="score_against"
            value={formData.score_against}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-600"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add match notes, highlights, or observations..."
          rows={4}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-600 placeholder-gray-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
        >
          {loading ? 'Saving...' : match ? 'Update Match' : 'Create Match'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
