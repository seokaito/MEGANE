import React from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { X, Calendar, Clock, FileText, User, CheckCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../App';

export const ShiftSubstituteResultModal = ({ post, onClose, currentUserId, isAdmin, onDelete }) => {
  const { t } = useLanguage();

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return dateString;
      }
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    } catch (error) {
      console.error('Date formatting error:', error, dateString);
      return dateString || 'Invalid Date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Invalid Time';
    
    try {
      if (timeString.includes(':')) {
        const date = new Date(`2000-01-01T${timeString}`);
        if (isNaN(date.getTime())) {
          console.warn('Invalid time string:', timeString);
          return timeString;
        }
        return date.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        return timeString;
      }
    } catch (error) {
      console.error('Time formatting error:', error, timeString);
      return timeString || 'Invalid Time';
    }
  };

  const isInvolved = post.originalRequesterId === currentUserId || post.substituteId === currentUserId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <CardTitle className="text-green-700">{t.shiftUpdated}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {t.postedOn}: {new Date(post.createdAt).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 交代完了通知 */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-green-800">{t.substituteCompleted}</h3>
            </div>
            <p className="text-sm text-green-700">
              {t.substituteProcessedSuccessfully}
            </p>
            {post.shiftUpdated && (
              <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded">
                <p className="text-xs text-green-800 font-medium">
                  ✓ {t.shiftScheduleUpdated}
                </p>
              </div>
            )}
          </div>

          {/* シフト詳細 */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 日付 */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium">{t.shiftDate}</h3>
                </div>
                <p className="text-lg">{formatDate(post.date)}</p>
              </div>

              {/* 時間 */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <h3 className="font-medium">{t.shiftTime}</h3>
                </div>
                <p className="text-lg">
                  {formatTime(post.startTime)} - {formatTime(post.endTime)}
                </p>
              </div>
            </div>

            {/* 交代詳細 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 交代前（申請者） */}
              <div className="p-4 border rounded-lg bg-red-50">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-red-600" />
                  <h3 className="font-medium text-red-700">{t.beforeSubstitute}</h3>
                </div>
                <p className="font-medium">{post.originalRequesterName}</p>
                {post.originalRequesterId === currentUserId && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {t.you}
                  </Badge>
                )}
              </div>

              {/* 交代後（代替者） */}
              <div className="p-4 border rounded-lg bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-green-600" />
                  <h3 className="font-medium text-green-700">{t.afterSubstitute}</h3>
                </div>
                <p className="font-medium">{post.substituteName}</p>
                {post.substituteId === currentUserId && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {t.you}
                  </Badge>
                )}
              </div>
            </div>

            {/* 交代理由 */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium">{t.reason}</h3>
              </div>
              <div className="bg-gray-50 p-3 rounded whitespace-pre-wrap">
                {post.reason}
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2 pt-4 border-t">
            {(isInvolved || isAdmin) && onDelete && (
              <Button
                variant="outline"
                onClick={() => onDelete(post)}
                className="text-destructive hover:text-destructive"
              >
                {t.delete}
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t.close}
            </Button>
          </div>

          {/* 注意事項 */}
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">{t.note}:</p>
            <p>
              {t.substituteCompletedNote}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};