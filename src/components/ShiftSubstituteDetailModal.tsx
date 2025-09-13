import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { X, Calendar, Clock, FileText, User, RefreshCw } from 'lucide-react';
import { useLanguage } from '../App';

export const ShiftSubstituteDetailModal = ({ post, onClose, currentUserId, isAdmin, onDelete, onSubstitute }) => {
  const { t } = useLanguage();

  // デバッグ用ログ
  console.log('ShiftSubstituteDetailModal post:', post);
  console.log('currentUserId:', currentUserId);
  console.log('post.createdBy:', post.createdBy);
  console.log('onSubstitute exists:', !!onSubstitute);

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return dateString; // 元の文字列を返す
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
      // 時間フォーマットを確認
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
        // 既に表示形式の場合はそのまま返す
        return timeString;
      }
    } catch (error) {
      console.error('Time formatting error:', error, timeString);
      return timeString || 'Invalid Time';
    }
  };

  const isOwner = post.createdBy === currentUserId;
  console.log('isOwner:', isOwner);
  const [showSubstituteConfirm, setShowSubstituteConfirm] = useState(false);
  const [substituting, setSubstituting] = useState(false);

  const handleSubstitute = async () => {
    setSubstituting(true);
    try {
      if (onSubstitute) {
        await onSubstitute(post);
      }
      onClose();
    } catch (error) {
      console.error('Error substituting shift:', error);
    } finally {
      setSubstituting(false);
      setShowSubstituteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-orange-600" />
            <div>
              <CardTitle>{t.substituteRequest || '交代申請'}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {t.postedOn || '投稿日'}: {new Date(post.createdAt).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 投稿者情報 */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">{t.postedBy || '投稿者'}:</span>
            <span>{post.authorName || post.authorEmail}</span>
            {isOwner && (
              <Badge variant="outline" className="ml-2">
                {t.you || 'あなた'}
              </Badge>
            )}
          </div>

          {/* シフト詳細 */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 日付 */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium">{t.shiftDate || 'シフト日'}</h3>
                </div>
                <p className="text-lg">{formatDate(post.date)}</p>
              </div>

              {/* 時間 */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <h3 className="font-medium">{t.shiftTime || 'シフト時間'}</h3>
                </div>
                <p className="text-lg">
                  {formatTime(post.startTime)} - {formatTime(post.endTime)}
                </p>
              </div>
            </div>

            {/* 理由 */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium">{t.reason || '理由'}</h3>
              </div>
              <div className="bg-gray-50 p-3 rounded whitespace-pre-wrap">
                {post.reason}
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2 pt-4 border-t">
            {!isOwner && onSubstitute && (
              <Button
                onClick={() => setShowSubstituteConfirm(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t.substituteShift || '交代する'}
              </Button>
            )}
            {(isOwner || isAdmin) && onDelete && (
              <Button
                variant="outline"
                onClick={() => onDelete(post)}
                className="text-destructive hover:text-destructive"
              >
                {t.delete || '削除'}
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className={!isOwner && onSubstitute ? '' : 'flex-1'}>
              {t.close || '閉じる'}
            </Button>
          </div>

          {/* 注意事項 */}
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">{t.note || '注意'}:</p>
            <p>
              {t.substituteNote || 'この申請は他のメンバーに共有されます。交代が決まったら管理者にお知らせください。'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 交代確認ダイアログ */}
      {showSubstituteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-green-600">
                <RefreshCw className="w-5 h-5 inline mr-2" />
                {t.substituteShift || '交代する'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>{t.substituteConfirm || 'このシフトを交代してもよろしいですか？あなたのスケジュールに追加されます。'}</p>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800 font-medium">
                    {t.shiftDate || 'シフト日'}: {formatDate(post.date)}
                  </p>
                  <p className="text-sm text-green-800">
                    {t.shiftTime || 'シフト時間'}: {formatTime(post.startTime)} - {formatTime(post.endTime)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubstitute}
                    disabled={substituting}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {substituting ? (t.substituteProcessing || '処理中...') : (t.substituteShift || '交代する')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSubstituteConfirm(false)}
                    disabled={substituting}
                    className="flex-1"
                  >
                    {t.cancel || 'キャンセル'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};