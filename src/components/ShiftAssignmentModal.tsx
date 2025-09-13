import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { useLanguage } from '../App';
import { Calendar, Clock, Users, Eye, Check, X } from 'lucide-react';

export const ShiftAssignmentModal = ({ post, onClose, onAssignmentComplete, onPostsUpdate }) => {
  const { t } = useLanguage();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assign');
  const [assignments, setAssignments] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadResponses();
  }, [post.id]);

  const loadResponses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/posts/${post.id}/responses`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const result = await response.json();
      if (response.ok) {
        setResponses(result.responses || []);
        initializeAssignments(result.responses || []);
      }
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeAssignments = (responsesData) => {
    const initialAssignments = {};
    responsesData.forEach(response => {
      response.shiftPreferences.forEach(preference => {
        const dateKey = preference.date;
        if (!initialAssignments[dateKey]) {
          initialAssignments[dateKey] = {};
        }
        initialAssignments[dateKey][response.userId] = {
          userName: response.userName,
          userEmail: response.userEmail,
          availableSlots: preference.timeSlots,
          assignedSlot: null
        };
      });
    });
    setAssignments(initialAssignments);
  };

  const assignTimeSlot = (date, userId, slot) => {
    setAssignments(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [userId]: {
          ...prev[date][userId],
          assignedSlot: slot
        }
      }
    }));
  };

  const updateCustomTime = (date, userId, field, value) => {
    setAssignments(prev => {
      const currentAssignment = prev[date][userId].assignedSlot;
      const updatedSlot = currentAssignment ? 
        { ...currentAssignment, [field]: value } : 
        { from: '09:00', to: '17:00', [field]: value };
      
      return {
        ...prev,
        [date]: {
          ...prev[date],
          [userId]: {
            ...prev[date][userId],
            assignedSlot: updatedSlot
          }
        }
      };
    });
  };

  const removeAssignment = (date, userId) => {
    setAssignments(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [userId]: {
          ...prev[date][userId],
          assignedSlot: null
        }
      }
    }));
  };

  const generatePreview = () => {
    const preview = [];
    const dates = Object.keys(assignments).sort();
    
    dates.forEach(date => {
      const dayAssignments = assignments[date];
      const assignedMembers = Object.entries(dayAssignments)
        .filter(([_, data]) => data.assignedSlot)
        .map(([userId, data]) => ({
          userId,
          userName: data.userName,
          userEmail: data.userEmail,
          timeSlot: data.assignedSlot
        }));

      if (assignedMembers.length > 0) {
        preview.push({
          date,
          members: assignedMembers.sort((a, b) => a.timeSlot.from.localeCompare(b.timeSlot.from))
        });
      }
    });
    
    setPreviewData(preview);
    setActiveTab('preview');
  };

  const publishShiftAssignments = async () => {
    setPublishing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 採用されたシフトデータを整理
      const shiftData = {
        postId: post.id,
        assignments: previewData.map(day => ({
          date: day.date,
          shifts: day.members.map(member => ({
            userId: member.userId,
            userName: member.userName,
            userEmail: member.userEmail,
            startTime: member.timeSlot.from,
            endTime: member.timeSlot.to
          }))
        }))
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/posts/${post.id}/publish-shifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(shiftData)
      });

      const result = await response.json();
      if (response.ok) {
        onAssignmentComplete('シフトを採用・投稿しました！');
        if (onPostsUpdate) {
          onPostsUpdate(); // 投稿一覧を更新
        }
        onClose();
      } else {
        console.error('Error publishing shifts:', result);
        alert(result.error || 'Error publishing shifts');
      }
    } catch (error) {
      console.error('Error publishing shifts:', error);
      alert('Error publishing shifts');
    } finally {
      setPublishing(false);
    }
  };

  const formatTime = (time) => {
    return time.substring(0, 5); // HH:MM format
  };

  // 時間が有効な範囲内かチェック
  const isTimeInRange = (time, availableSlots) => {
    const timeValue = time.replace(':', '');
    return availableSlots.some(slot => {
      const fromValue = slot.from.replace(':', '');
      const toValue = slot.to.replace(':', '');
      return timeValue >= fromValue && timeValue <= toValue;
    });
  };

  // 利用可能な時間範囲を取得
  const getTimeRange = (availableSlots) => {
    if (!availableSlots || availableSlots.length === 0) return { min: '00:00', max: '23:59' };
    
    const minTime = availableSlots.reduce((min, slot) => 
      slot.from < min ? slot.from : min, availableSlots[0].from);
    const maxTime = availableSlots.reduce((max, slot) => 
      slot.to > max ? slot.to : max, availableSlots[0].to);
    
    return { min: minTime, max: maxTime };
  };

  const sortedDates = Object.keys(assignments).sort();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                シフト採用管理
              </CardTitle>
              <div className="text-sm text-gray-600 mt-2">
                <p>{post.title}</p>
                <p>回答数: {responses.length}人</p>
              </div>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assign">シフト採用</TabsTrigger>
              <TabsTrigger value="preview" disabled={previewData.length === 0}>
                プレビュー ({previewData.length}日)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assign">
              {loading ? (
                <p className="text-center py-8">{t.loading}</p>
              ) : responses.length === 0 ? (
                <p className="text-gray-600 text-center py-8">{t.noResponses}</p>
              ) : (
                <div className="space-y-6">
                  {sortedDates.map((date) => (
                    <Card key={date} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Calendar className="w-4 h-4" />
                          {new Date(date).toLocaleDateString('ja-JP', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {Object.entries(assignments[date]).map(([userId, userData]) => (
                            <Card key={userId} className="border">
                              <CardContent className="p-4">
                                <div className="mb-3">
                                  <h4 className="font-medium">{userData.userName}</h4>
                                  <p className="text-sm text-gray-600">{userData.userEmail}</p>
                                </div>
                                
                                <div className="space-y-3">
                                  <div className="text-sm font-medium text-gray-700">希望時間:</div>
                                  <div className="space-y-1">
                                    {userData.availableSlots.map((slot, index) => (
                                      <div key={index} className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant={userData.assignedSlot && 
                                            userData.assignedSlot.from === slot.from && 
                                            userData.assignedSlot.to === slot.to ? "default" : "outline"}
                                          onClick={() => {
                                            if (userData.assignedSlot && 
                                                userData.assignedSlot.from === slot.from && 
                                                userData.assignedSlot.to === slot.to) {
                                              removeAssignment(date, userId);
                                            } else {
                                              assignTimeSlot(date, userId, slot);
                                            }
                                          }}
                                          className="flex-1 justify-start text-xs"
                                        >
                                          <Clock className="w-3 h-3 mr-1" />
                                          {formatTime(slot.from)} - {formatTime(slot.to)}
                                          {userData.assignedSlot && 
                                           userData.assignedSlot.from === slot.from && 
                                           userData.assignedSlot.to === slot.to && (
                                            <Check className="w-3 h-3 ml-1" />
                                          )}
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  <Separator />
                                  
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-gray-700">カスタム時間設定:</div>
                                    <div className="text-xs text-gray-500 mb-2">
                                      希望時間範囲: {getTimeRange(userData.availableSlots).min} - {getTimeRange(userData.availableSlots).max}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-xs text-gray-600">開始時間</label>
                                        <Input
                                          type="time"
                                          value={userData.assignedSlot?.from || ''}
                                          onChange={(e) => updateCustomTime(date, userId, 'from', e.target.value)}
                                          min={getTimeRange(userData.availableSlots).min}
                                          max={getTimeRange(userData.availableSlots).max}
                                          className="text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-600">終了時間</label>
                                        <Input
                                          type="time"
                                          value={userData.assignedSlot?.to || ''}
                                          onChange={(e) => updateCustomTime(date, userId, 'to', e.target.value)}
                                          min={getTimeRange(userData.availableSlots).min}
                                          max={getTimeRange(userData.availableSlots).max}
                                          className="text-sm"
                                        />
                                      </div>
                                    </div>
                                    
                                    {userData.assignedSlot && (
                                      <div className="flex gap-2 mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => removeAssignment(date, userId)}
                                          className="flex-1 text-xs"
                                        >
                                          <X className="w-3 h-3 mr-1" />
                                          クリア
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {userData.assignedSlot && (
                                    <Badge className={`w-full justify-center mt-2 text-xs ${
                                      isTimeInRange(userData.assignedSlot.from, userData.availableSlots) &&
                                      isTimeInRange(userData.assignedSlot.to, userData.availableSlots)
                                        ? 'bg-green-100 text-green-800 border-green-300'
                                        : 'bg-red-100 text-red-800 border-red-300'
                                    }`}>
                                      {isTimeInRange(userData.assignedSlot.from, userData.availableSlots) &&
                                       isTimeInRange(userData.assignedSlot.to, userData.availableSlots) ? (
                                        <>✓ 採用: {formatTime(userData.assignedSlot.from)} - {formatTime(userData.assignedSlot.to)}</>
                                      ) : (
                                        <>⚠ 範囲外: {formatTime(userData.assignedSlot.from)} - {formatTime(userData.assignedSlot.to)}</>
                                      )}
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={generatePreview}
                      className="flex-1"
                      disabled={Object.values(assignments).every(dateData => 
                        Object.values(dateData).every(userData => !userData.assignedSlot)
                      )}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      プレビューを生成
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">採用シフト確認</h3>
                  <div className="text-sm text-gray-600">
                    {previewData.reduce((total, day) => total + day.members.length, 0)}人のシフトを採用
                  </div>
                </div>
                
                {previewData.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-600">採用されたシフトがありません</p>
                      <Button 
                        onClick={() => setActiveTab('assign')} 
                        variant="outline" 
                        className="mt-4"
                      >
                        シフト採用に戻る
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="space-y-4">
                      {previewData.map((day) => (
                        <Card key={day.date} className="border-l-4 border-l-green-500">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(day.date).toLocaleDateString('ja-JP', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  weekday: 'short'
                                })}
                              </div>
                              <Badge variant="secondary">
                                {day.members.length}人
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {day.members.map((member) => (
                                <div key={member.userId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                  <div>
                                    <p className="font-medium">{member.userName}</p>
                                    <p className="text-sm text-gray-600">{member.userEmail}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-green-600" />
                                    <span className="font-medium text-green-700">
                                      {formatTime(member.timeSlot.from)} - {formatTime(member.timeSlot.to)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => setActiveTab('assign')} 
                        variant="outline" 
                        className="flex-1"
                      >
                        編集に戻る
                      </Button>
                      <Button 
                        onClick={publishShiftAssignments}
                        className="flex-1"
                        disabled={publishing}
                      >
                        {publishing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            投稿中...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            シフトを採用・投稿する
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};