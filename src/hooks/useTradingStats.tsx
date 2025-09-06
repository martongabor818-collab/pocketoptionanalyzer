import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface TradingStats {
  total_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export const useTradingStats = () => {
  const [stats, setStats] = useState<TradingStats>({
    total_trades: 0,
    wins: 0,
    losses: 0,
    win_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadStats = async () => {
    if (!user) {
      setStats({ total_trades: 0, wins: 0, losses: 0, win_rate: 0 });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_trading_stats')
        .select('total_trades, wins, losses, win_rate')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading trading stats:', error);
        return;
      }

      if (data) {
        setStats({
          total_trades: data.total_trades,
          wins: data.wins,
          losses: data.losses,
          win_rate: data.win_rate || 0
        });
      }
    } catch (error) {
      console.error('Error loading trading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = async (isWin: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('update_trading_stats', {
        p_user_id: user.id,
        p_is_win: isWin
      });

      if (error) {
        console.error('Error updating trading stats:', error);
        return;
      }

      // Reload stats after update
      await loadStats();
    } catch (error) {
      console.error('Error updating trading stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  return {
    stats,
    loading,
    updateStats,
    refreshStats: loadStats
  };
};