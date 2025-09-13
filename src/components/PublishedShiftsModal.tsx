import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { useLanguage } from '../App';
import { Calendar, Clock, Users, X, CheckCircle, User } from 'lucide-react';

export const PublishedShiftsModal = ({ post, onClose }) => {
  const { t } = useLanguage();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublishedShifts();
  }, [post.id]);

  const loadPublishedShifts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/posts/${post.id}/published-shifts`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const result = await response.json();
      if (response.ok) {
        setShifts(result.shifts || []);
      }
    } catch (error) {
      console.error('Error loading published shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    return time.substring(0, 5); // HH:MM format
  };

  const groupShiftsByDate = (shiftsData) => {
    const grouped = {};
    shiftsData.forEach(shift => {
      if (!grouped[shift.date]) {
        grouped[shift.date] = [];
      }
      grouped[shift.date].push(shift);
    });
    
    // Sort by start time within each date
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    
    return grouped;
  };

  const groupedShifts = groupShiftsByDate(shifts);
  const sortedDates = Object.keys(groupedShifts).sort();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                採用されたシフト
              </CardTitle>
              <div className="text-sm text-gray-600 mt-2">
                <p>{post.title}</p>
                <p>総シフト数: {shifts.length}件</p>
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
              <p className="text-gray-600">まだシフトが採用されていません</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <Card key={date} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(date).toLocaleDateString('ja-JP', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Users className="w-3 h-3 mr-1" />
                        {groupedShifts[date].length}人
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {groupedShifts[date].map((shift) => (
                        <Card key={`${shift.userId}-${shift.startTime}`} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
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
              
              <div className="text-center pt-4 border-t">
                <div className="text-sm text-gray-600 mb-4">
                  期間: {new Date(post.startDate).toLocaleDateString()} - {new Date(post.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};