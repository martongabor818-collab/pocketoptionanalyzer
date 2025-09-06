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
    console.log('useTradingStats: Loading stats for user:', user?.id);
    
    if (!user) {
      console.log('useTradingStats: No user, setting default stats');
      setStats({ total_trades: 0, wins: 0, losses: 0, win_rate: 0 });
      setLoading(false);
      return;
    }

    try {
      console.log('useTradingStats: Querying database for user:', user.id);
      const { data, error } = await supabase
        .from('user_trading_stats')
        .select('total_trades, wins, losses, win_rate')
        .eq('user_id', user.id)
        .single();

      console.log('useTradingStats: Database response:', { data, error });

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('useTradingStats: Error loading trading stats:', error);
        return;
      }

      if (data) {
        console.log('useTradingStats: Setting stats from database:', data);
        setStats({
          total_trades: data.total_trades,
          wins: data.wins,
          losses: data.losses,
          win_rate: data.win_rate || 0
        });
      } else {
        console.log('useTradingStats: No data found, keeping default stats');
      }
    } catch (error) {
      console.error('useTradingStats: Exception loading trading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = async (isWin: boolean) => {
    console.log('useTradingStats: Updating stats for user:', user?.id, 'isWin:', isWin);
    
    if (!user) {
      console.log('useTradingStats: No user for updateStats');
      return;
    }

    try {
      console.log('useTradingStats: Calling update_trading_stats RPC function');
      const { error } = await supabase.rpc('update_trading_stats', {
        p_user_id: user.id,
        p_is_win: isWin
      });

      console.log('useTradingStats: RPC response error:', error);

      if (error) {
        console.error('useTradingStats: Error updating trading stats:', error);
        return;
      }

      console.log('useTradingStats: RPC successful, reloading stats');
      // Reload stats after update
      await loadStats();
    } catch (error) {
      console.error('useTradingStats: Exception updating trading stats:', error);
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