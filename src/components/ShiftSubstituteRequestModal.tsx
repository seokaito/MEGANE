import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { X, Calendar, Clock, FileText, AlertTriangle, ChevronDown } from 'lucide-react';
import { useLanguage } from '../App';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

export const ShiftSubstituteRequestModal = ({ onClose, onSubmit, groupId }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [userShifts, setUserShifts] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [availableDates, setAvailableDates] = useState([]);

  useEffect(() => {
    loadUserShifts();
  }, [groupId]);

  const loadUserShifts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // ユーザーの全シフトを取得
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/user/shifts?groupId=${groupId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const shifts = result.shifts || [];
        setUserShifts(shifts);
        
        // 今日以降の日付のシフトのみを抽出
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureShifts = shifts.filter(shift => {
          const shiftDate = new Date(shift.date);
          shiftDate.setHours(0, 0, 0, 0);
          return shiftDate >= today;
        });
        
        // 日付でユニークにして、ソートする
        const uniqueDates = [...new Set(futureShifts.map(shift => shift.date))];
        uniqueDates.sort();
        setAvailableDates(uniqueDates);
      } else {
        console.error('Failed to load user shifts');
      }
    } catch (error) {
      console.error('Error loading user shifts:', error);
    } finally {
      setLoadingShifts(false);
    }
  };

  const validateShiftExists = (date, startTime, endTime) => {
    setValidationError('');
    
    if (!date || !startTime || !endTime) {
      return true; // 入力が完了していない場合はバリデーションしない
    }

    // 該当する日付のシフトを検索
    const matchingShifts = userShifts.filter(shift => {
      const shiftDate = new Date(shift.date).toISOString().split('T')[0];
      return shiftDate === date;
    });

    if (matchingShifts.length === 0) {
      setValidationError(t.noShiftOnDate || `${new Date(date).toLocaleDateString('ja-JP')}にはシフトが入っていません。`);
      return false;
    }

    // 指定した時間帯とマッチするシフトがあるかチェック
    const exactMatch = matchingShifts.find(shift => {
      return shift.startTime === startTime && shift.endTime === endTime;
    });

    if (!exactMatch) {
      setValidationError(t.noMatchingShiftTime || `${new Date(date).toLocaleDateString('ja-JP')} ${startTime}-${endTime}の時間帯にはシフトが入っていません。`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.reason.trim()) {
      alert(t.fillAllFields || 'すべての項目を入力してください');
      return;
    }

    // 終了時間が開始時間より後かチェック
    if (formData.startTime >= formData.endTime) {
      alert(t.invalidTimeRange || '終了時間は開始時間より後に設定してください');
      return;
    }

    // 実際にシフトが入っているかチェック
    if (!validateShiftExists(formData.date, formData.startTime, formData.endTime)) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        type: 'shift_substitute_request',
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        reason: formData.reason.trim()
      });
      onClose();
    } catch (error) {
      console.error('Error submitting substitute request:', error);
      alert(t.error || 'エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t.substituteRequest || '交代申請'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 日付選択 */}
            <div>
              <label className="block mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t.shiftDate || 'シフト日'}
              </label>
              {loadingShifts ? (
                <div className="p-3 bg-gray-100 rounded border text-center">
                  シフト情報を読み込み中...
                </div>
              ) : availableDates.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-center">
                  <p className="text-yellow-800">
                    今日以降に交代可能なシフトがありません
                  </p>
                </div>
              ) : (
                <Select
                  value={formData.date}
                  onValueChange={(value) => {
                    setFormData({ ...formData, date: value });
                    setValidationError(''); // 日付変更時にエラーをクリア
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="交代するシフトの日付を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-sm text-gray-600 mt-1">
                {availableDates.length > 0 
                  ? `${availableDates.length}件のシフトが交代可能です`
                  : t.selectShiftDate || '交代が必要なシフトの日付を選択してください'
                }
              </p>
            </div>

            {/* 時間選択 */}
            {formData.date && (
              <div>
                <label className="block mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  シフト時間
                </label>
                {(() => {
                  const dayShifts = userShifts.filter(shift => {
                    const shiftDate = new Date(shift.date).toISOString().split('T')[0];
                    return shiftDate === formData.date;
                  });
                  
                  if (dayShifts.length === 0) {
                    return (
                      <div className="p-3 bg-gray-100 rounded border text-center text-gray-600">
                        この日にシフトはありません
                      </div>
                    );
                  }
                  
                  return (
                    <Select
                      value={formData.startTime && formData.endTime ? `${formData.startTime}-${formData.endTime}` : ''}
                      onValueChange={(value) => {
                        const [startTime, endTime] = value.split('-');
                        setFormData({ 
                          ...formData, 
                          startTime: startTime,
                          endTime: endTime
                        });
                        setValidationError('');
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="交代するシフトの時間を選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {dayShifts.map((shift, index) => (
                          <SelectItem key={index} value={`${shift.startTime}-${shift.endTime}`}>
                            {shift.startTime} - {shift.endTime}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
                <p className="text-sm text-gray-600 mt-1">
                  選択した日のシフトから時間を選んでください
                </p>
              </div>
            )}

            {/* バリデーションエラー表示 */}
            {validationError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* 利用可能なシフト一覧（参考として表示） */}
            {!loadingShifts && userShifts.length > 0 && formData.date && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  {new Date(formData.date).toLocaleDateString('ja-JP')}のあなたのシフト：
                </h4>
                <div className="space-y-1">
                  {userShifts
                    .filter(shift => {
                      const shiftDate = new Date(shift.date).toISOString().split('T')[0];
                      return shiftDate === formData.date;
                    })
                    .map((shift, index) => (
                      <div key={index} className="text-sm text-blue-700">
                        {shift.startTime} - {shift.endTime} ({shift.groupName})
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 理由 */}
            <div>
              <label className="block mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t.reason || '理由'}
              </label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder={t.reasonPlaceholder || '交代が必要な理由を記入してください（例：急用、体調不良など）'}
                rows={4}
                required
              />
            </div>

            {/* 提出ボタン */}
            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={submitting || availableDates.length === 0}
              >
                {submitting ? (t.submitting || '送信中...') : (t.submitRequest || '申請を提出')}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                {t.cancel || 'キャンセル'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};