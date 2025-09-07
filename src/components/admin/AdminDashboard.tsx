import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserCheck, CreditCard, TrendingUp, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  display_name?: string;
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  total_trades: number;
}

interface DashboardStats {
  totalUsers: number;
  subscribedUsers: number;
  totalRevenue: number;
  newUsersToday: number;
}

export const AdminDashboard = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    subscribedUsers: 0,
    totalRevenue: 0,
    newUsersToday: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with subscriber data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          display_name,
          created_at,
          subscribers (
            email,
            subscribed,
            subscription_tier,
            subscription_end
          ),
          user_statistics (
            total_trades
          )
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Transform the data
      const transformedUsers: UserData[] = profilesData?.map(profile => {
        const subscriber = Array.isArray(profile.subscribers) ? profile.subscribers[0] : profile.subscribers;
        const userStats = Array.isArray(profile.user_statistics) ? profile.user_statistics[0] : profile.user_statistics;
        
        return {
          id: profile.user_id,
          email: subscriber?.email || 'No email',
          created_at: profile.created_at,
          display_name: profile.display_name || undefined,
          subscribed: subscriber?.subscribed || false,
          subscription_tier: subscriber?.subscription_tier || undefined,
          subscription_end: subscriber?.subscription_end || undefined,
          total_trades: userStats?.total_trades || 0
        };
      }) || [];

      setUsers(transformedUsers);

      // Calculate stats
      const totalUsers = transformedUsers.length;
      const subscribedUsers = transformedUsers.filter(user => user.subscribed).length;
      const today = new Date().toISOString().split('T')[0];
      const newUsersToday = transformedUsers.filter(user => 
        user.created_at.startsWith(today)
      ).length;

      // Calculate revenue (rough estimate based on subscription tiers)
      const tierPrices = {
        '24_hour_pass': 7,
        '48_hour_pass': 12,
        'weekly_plan': 30,
        'monthly_plan': 85
      };
      
      const totalRevenue = transformedUsers
        .filter(user => user.subscribed && user.subscription_tier)
        .reduce((sum, user) => {
          const price = tierPrices[user.subscription_tier as keyof typeof tierPrices] || 0;
          return sum + price;
        }, 0);

      setStats({
        totalUsers,
        subscribedUsers,
        totalRevenue,
        newUsersToday
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubscriptionBadge = (user: UserData) => {
    if (!user.subscribed) {
      return <Badge variant="secondary">Free</Badge>;
    }
    
    const tier = user.subscription_tier;
    const color = tier === 'monthly_plan' ? 'default' : 
                 tier === 'weekly_plan' ? 'secondary' : 'outline';
    
    return <Badge variant={color}>{tier?.replace('_', ' ') || 'Subscribed'}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and subscriptions</p>
        </div>
        <Button onClick={fetchUserData} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribed Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscribedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.subscribedUsers / stats.totalUsers) * 100).toFixed(1)}% conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">
              Current subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsersToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Tabs */}
      <Tabs defaultValue="all-users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-users">All Users</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="free-users">Free Users</TabsTrigger>
        </TabsList>

        <TabsContent value="all-users">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Complete list of all registered users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Trades</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.display_name || '-'}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{getSubscriptionBadge(user)}</TableCell>
                      <TableCell>{user.total_trades}</TableCell>
                      <TableCell>
                        {user.subscription_end ? formatDate(user.subscription_end) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers">
          <Card>
            <CardHeader>
              <CardTitle>Active Subscribers</CardTitle>
              <CardDescription>
                Users with active paid subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Trades</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.filter(user => user.subscribed).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{getSubscriptionBadge(user)}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        {user.subscription_end ? formatDate(user.subscription_end) : '-'}
                      </TableCell>
                      <TableCell>{user.total_trades}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="free-users">
          <Card>
            <CardHeader>
              <CardTitle>Free Users</CardTitle>
              <CardDescription>
                Users without active subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Trades</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.filter(user => !user.subscribed).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.display_name || '-'}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{user.total_trades}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};