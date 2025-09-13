import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { User, Mail, Calendar, Users, Clock, DollarSign, Settings, Save } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface MyPageProps {
  user: any;
  t: any;
}

interface AccountStats {
  totalGroups: number;
  adminGroups: number;
  totalShifts: number;
  thisMonthShifts: number;
}

interface EarningsData {
  month: string;
  totalEarnings: number;
  totalHours: number;
  groupEarnings: Array<{
    groupId: string;
    groupName: string;
    hours: number;
    hourlyWage: number;
    earnings: number;
  }>;
}

interface GroupWithWage {
  id: string;
  name: string;
  hourlyWage: number;
  isAdmin: boolean;
}

export const MyPage: React.FC<MyPageProps> = ({ user, t }) => {
  const [accountStats, setAccountStats] = useState<AccountStats>({
    totalGroups: 0,
    adminGroups: 0,
    totalShifts: 0,
    thisMonthShifts: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentMonthEarnings, setCurrentMonthEarnings] = useState<EarningsData | null>(null);
  const [lastMonthEarnings, setLastMonthEarnings] = useState<EarningsData | null>(null);
  const [groups, setGroups] = useState<GroupWithWage[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [updatingWage, setUpdatingWage] = useState<string | null>(null);
  const [wageInputs, setWageInputs] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadAccountStats();
    loadEarningsData();
    loadGroups();
  }, []);

  const loadAccountStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // グループ統計を取得
      const groupsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/groups`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      let totalGroups = 0;
      let adminGroups = 0;
      
      if (groupsResponse.ok) {
        const groupsResult = await groupsResponse.json();
        const groups = groupsResult.groups || [];
        totalGroups = groups.length;
        adminGroups = groups.filter((group: any) => group.isAdmin).length;
      }

      // シフト統計を取得
      const shiftsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/my-shifts`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      let totalShifts = 0;
      let thisMonthShifts = 0;

      if (shiftsResponse.ok) {
        const shiftsResult = await shiftsResponse.json();
        const shifts = shiftsResult.shifts || [];
        totalShifts = shifts.length;

        // 今月のシフト数を計算
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        thisMonthShifts = shifts.filter((shift: any) => {
          const shiftDate = new Date(shift.date);
          return shiftDate.getMonth() === currentMonth && shiftDate.getFullYear() === currentYear;
        }).length;
      }

      setAccountStats({
        totalGroups,
        adminGroups,
        totalShifts,
        thisMonthShifts
      });

    } catch (error) {
      console.error('Error loading account stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEarningsData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 今月の給料データを取得
      const currentMonthResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/user/earnings`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (currentMonthResponse.ok) {
        const currentData = await currentMonthResponse.json();
        setCurrentMonthEarnings(currentData);
      }

      // 先月の給料データを取得
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().slice(0, 7);

      const lastMonthResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/user/earnings?month=${lastMonthStr}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (lastMonthResponse.ok) {
        const lastData = await lastMonthResponse.json();
        setLastMonthEarnings(lastData);
      }

    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setEarningsLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/groups`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const groupsWithWage = result.groups?.map((group: any) => ({
          id: group.id,
          name: group.name,
          hourlyWage: group.hourlyWage || 0,
          isAdmin: group.isAdmin
        })) || [];
        
        setGroups(groupsWithWage);
        
        // 時給入力フィールドの初期値を設定
        const initialWageInputs = {};
        groupsWithWage.forEach((group: GroupWithWage) => {
          initialWageInputs[group.id] = group.hourlyWage.toString();
        });
        setWageInputs(initialWageInputs);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const updateHourlyWage = async (groupId: string, hourlyWage: number) => {
    try {
      console.log('Updating hourly wage for group:', groupId, 'to:', hourlyWage);
      setUpdatingWage(groupId);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        alert('認証エラーが発生しました。ページを更新してください。');
        return;
      }

      console.log('Sending PUT request to update hourly wage...');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/groups/${groupId}/hourly-wage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ hourlyWage })
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response body:', result);

      if (response.ok) {
        console.log('Hourly wage updated successfully');
        // グループリストを更新
        setGroups(prev => prev.map(group => 
          group.id === groupId ? { ...group, hourlyWage } : group
        ));
        
        // 給料データを再読み込み
        await loadEarningsData();
        
        alert(t.wageUpdated);
      } else {
        console.error('Error updating hourly wage:', result);
        alert(result.error || 'Error updating wage');
      }
    } catch (error) {
      console.error('Error updating hourly wage:', error);
      alert('Error updating wage');
    } finally {
      setUpdatingWage(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ユーザー情報カード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl">{t.userInfo}</h2>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">{t.nameLabel}</p>
                <p>{user?.user_metadata?.name || t.notSet}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">{t.emailLabel}</p>
                <p>{user?.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* タブ切り替え */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t.statistics}
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            {t.monthlyEarnings}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            {t.wageSetting}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* 統計情報カード */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t.statistics}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600">{t.joinedGroups}</span>
                  </div>
                  <p className="text-2xl text-blue-700">{accountStats.totalGroups}</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">{t.managedGroups}</span>
                  </div>
                  <p className="text-2xl text-green-700">{accountStats.adminGroups}</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-600">{t.totalShifts}</span>
                  </div>
                  <p className="text-2xl text-purple-700">{accountStats.totalShifts}</p>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-orange-600">{t.thisMonthShifts}</span>
                  </div>
                  <p className="text-2xl text-orange-700">{accountStats.thisMonthShifts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings">
          {/* 給料情報カード */}
          <div className="space-y-6">
            {/* データ更新ボタン */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Refreshing earnings data...');
                  setEarningsLoading(true);
                  loadEarningsData();
                }}
                disabled={earningsLoading}
              >
                <Clock className="w-4 h-4 mr-2" />
                {earningsLoading ? '更新中...' : 'データ更新'}
              </Button>
            </div>
            {earningsLoading ? (
              <Card>
                <CardContent className="text-center py-8">
                  {t.loading}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* 月別給料サマリー */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      {t.monthlyEarnings}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">{t.currentMonth}</span>
                        </div>
                        <p className="text-2xl text-green-700">
                          {t.currency}{currentMonthEarnings?.totalEarnings?.toLocaleString() || '0'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {currentMonthEarnings?.totalHours?.toFixed(1) || '0'} {t.hours}
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-600">{t.lastMonth}</span>
                        </div>
                        <p className="text-2xl text-blue-700">
                          {t.currency}{lastMonthEarnings?.totalEarnings?.toLocaleString() || '0'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {lastMonthEarnings?.totalHours?.toFixed(1) || '0'} {t.hours}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* グループ別給料詳細 */}
                {currentMonthEarnings?.groupEarnings && currentMonthEarnings.groupEarnings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.currentMonth} - グループ別詳細</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {currentMonthEarnings.groupEarnings.map((group) => (
                          <div key={group.groupId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{group.groupName}</p>
                              <p className="text-sm text-gray-600">
                                {group.hours.toFixed(1)} {t.hours} × {t.currency}{group.hourlyWage}
                              </p>
                              {group.shiftsCount && (
                                <p className="text-xs text-blue-600">
                                  {group.shiftsCount} 件のシフト
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {t.currency}{group.earnings.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* デバッグ情報 */}
                {currentMonthEarnings?.debugInfo && (
                  <Card className="border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-blue-700 text-sm">デバッグ情報</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs space-y-1 text-gray-600">
                        <p>対象月: {currentMonthEarnings.debugInfo.targetMonth}</p>
                        <p>チェックしたグループ数: {currentMonthEarnings.debugInfo.groupsChecked}</p>
                        <p>チェックした投稿数: {currentMonthEarnings.debugInfo.postsChecked}</p>
                        <p>見つかったシフト数: {currentMonthEarnings.debugInfo.shiftsFound}</p>
                        <p>対象月のシフト数: {currentMonthEarnings.debugInfo.shiftsInMonth}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          {/* 時給設定カード */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {t.setHourlyWage}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {groups.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">グループに参加していません</p>
                ) : (
                  groups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={group.isAdmin ? "default" : "secondary"}>
                            {group.isAdmin ? t.admin : t.member}
                          </Badge>
                          {group.hourlyWage > 0 ? (
                            <span className="text-sm text-green-600">
                              {t.currency}{group.hourlyWage}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">
                              {t.noWageSet}
                            </span>
                          )}
                        </div>
                      </div>
                      {group.isAdmin && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="w-24"
                            value={wageInputs[group.id] || ''}
                            onChange={(e) => setWageInputs(prev => ({
                              ...prev,
                              [group.id]: e.target.value
                            }))}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const wageValue = parseFloat(wageInputs[group.id]);
                              if (isNaN(wageValue) || wageValue < 0) {
                                alert('有効な時給を入力してください');
                                return;
                              }
                              updateHourlyWage(group.id, wageValue);
                            }}
                            disabled={updatingWage === group.id}
                          >
                            {updatingWage === group.id ? (
                              <Clock className="w-4 h-4" />
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-1" />
                                {t.saveWage}
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};