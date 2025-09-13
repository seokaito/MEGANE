import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { useLanguage } from '../App';
import { Calendar, Clock, Users, X, CheckCircle, TrendingUp, User } from 'lucide-react';

export const ShiftResultPost = ({ post, onClose }) => {
  const { t } = useLanguage();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('calendar');

  useEffect(() => {
    loadShiftResults();
  }, [post.id]);

  const loadShiftResults = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/posts/${post.originalPostId || post.id}/published-shifts`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const result = await response.json();
      if (response.ok) {
        setShifts(result.shifts || []);
      }
    } catch (error) {
      console.error('Error loading shift results:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    return time.substring(0, 5);
  };

  const groupShiftsByDate = (shiftsData) => {
    const grouped = {};
    shiftsData.forEach(shift => {
      if (!grouped[shift.date]) {
        grouped[shift.date] = [];
      }
      grouped[shift.date].push(shift);
    });
    
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    
    return grouped;
  };

  const getShiftStats = () => {
    const totalShifts = shifts.length;
    const uniqueMembers = new Set(shifts.map(s => s.userId)).size;
    const dates = new Set(shifts.map(s => s.date)).size;
    const totalHours = shifts.reduce((total, shift) => {
      const start = new Date(`2000-01-01 ${shift.startTime}`);
      const end = new Date(`2000-01-01 ${shift.endTime}`);
      return total + (end - start) / (1000 * 60 * 60);
    }, 0);

    return { totalShifts, uniqueMembers, dates, totalHours };
  };

  const groupedShifts = groupShiftsByDate(shifts);
  const sortedDates = Object.keys(groupedShifts).sort();
  const stats = getShiftStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
                {post.title} - {t.adoptionResults}
              </CardTitle>
              <div className="text-sm text-gray-600 mt-2">
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t.period}: {new Date(post.startDate).toLocaleDateString()} - {new Date(post.endDate).toLocaleDateString()}
                </p>
                <p className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4" />
                  {t.postDate}: {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <p className="text-center py-8">{t.loading}</p>
          ) : shifts.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t.noAdoptedShifts}</p>
            </div>
          ) : (
            <>
              {/* 統計情報 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="border border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">{stats.totalShifts}</div>
                    <div className="text-sm text-green-600">{t.totalShifts}</div>
                  </CardContent>
                </Card>
                <Card className="border border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">{stats.uniqueMembers}</div>
                    <div className="text-sm text-blue-600">{t.participatingMembers}</div>
                  </CardContent>
                </Card>
                <Card className="border border-purple-200 bg-purple-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-700">{stats.dates}</div>
                    <div className="text-sm text-purple-600">{t.workDays}</div>
                  </CardContent>
                </Card>
                <Card className="border border-orange-200 bg-orange-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-700">{Math.round(stats.totalHours)}</div>
                    <div className="text-sm text-orange-600">{t.totalWorkHours}</div>
                  </CardContent>
                </Card>
              </div>

              <Tabs value={activeView} onValueChange={setActiveView}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="calendar">{t.dateView}</TabsTrigger>
                  <TabsTrigger value="members">{t.memberView}</TabsTrigger>
                </TabsList>

                <TabsContent value="calendar">
                  <div className="space-y-4">
                    {sortedDates.map((date) => (
                      <Card key={date} className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-green-600" />
                              <span className="text-lg">
                                {new Date(date).toLocaleDateString('ja-JP', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  weekday: 'short'
                                })}
                              </span>
                            </div>
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              <Users className="w-3 h-3 mr-1" />
                              {groupedShifts[date].length}{t.people}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {groupedShifts[date].map((shift, index) => (
                              <Card key={`${shift.userId}-${shift.startTime}-${index}`} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                      <User className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-green-800">{shift.userName}</p>
                                      <p className="text-xs text-green-600">{shift.userEmail}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-green-200">
                                    <Clock className="w-4 h-4 text-green-600" />
                                    <span className="font-medium text-green-700">
                                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="members">
                  <div className="space-y-4">
                    {Array.from(new Set(shifts.map(s => s.userId))).map(userId => {
                      const memberShifts = shifts.filter(s => s.userId === userId);
                      const memberInfo = memberShifts[0];
                      const memberHours = memberShifts.reduce((total, shift) => {
                        const start = new Date(`2000-01-01 ${shift.startTime}`);
                        const end = new Date(`2000-01-01 ${shift.endTime}`);
                        return total + (end - start) / (1000 * 60 * 60);
                      }, 0);

                      return (
                        <Card key={userId} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <span className="text-lg">{memberInfo.userName}</span>
                                  <p className="text-sm text-gray-600 mt-1">{memberInfo.userEmail}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-blue-100 text-blue-800 border-blue-300 mb-1">
                                  {memberShifts.length}{t.daysWorked}
                                </Badge>
                                <p className="text-sm text-gray-600">{Math.round(memberHours)}{t.hours}</p>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                              {memberShifts.sort((a, b) => a.date.localeCompare(b.date)).map((shift, index) => (
                                <div key={`${shift.date}-${shift.startTime}-${index}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium">
                                      {new Date(shift.date).toLocaleDateString('ja-JP', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        weekday: 'short'
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-blue-700">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(shift.startTime)}-{formatTime(shift.endTime)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};