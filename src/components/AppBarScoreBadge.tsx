import { Chip } from '@mui/material';
import { Shield as ShieldIcon } from '@mui/icons-material';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { usePolarisDataContext } from '../api/PolarisDataContext';
import { computeScore, countResults } from '../api/polaris';

/**
 * App bar badge showing cluster Polaris score
 * Clicking navigates to the overview dashboard
 */
export default function AppBarScoreBadge() {
  const { data, loading } = usePolarisDataContext();
  const history = useHistory();

  if (loading || !data) {
    return null; // Graceful degradation when Polaris unavailable
  }

  const counts = countResults(data);
  const score = computeScore(counts);

  // Color based on score
  const getColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  const handleClick = () => {
    history.push('/polaris');
  };

  return (
    <Chip
      icon={<ShieldIcon />}
      label={`Polaris: ${score}%`}
      color={getColor(score)}
      size="small"
      onClick={handleClick}
      style={{ cursor: 'pointer', marginRight: '8px' }}
    />
  );
}
