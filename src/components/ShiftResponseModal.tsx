import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Plus, X } from 'lucide-react';
import { useLanguage } from '../App';

export const ShiftResponseModal = ({ post, onClose, onSubmit }) => {
  const { t } = useLanguage();
  const [selectedDates, setSelectedDates] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // 期間内の日付を生成
  const generateDateRange = () => {
    const dates = [];
    const start = new Date(post.startDate);
    const end = new Date(post.endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const dates = generateDateRange();

  const handleDateToggle = (dateStr) => {
    setSelectedDates(prev => {
      const newDates = { ...prev };
      if (newDates[dateStr]) {
        delete newDates[dateStr];
      } else {
        newDates[dateStr] = [{ from: post.openingTime, to: post.closingTime }];
      }
      return newDates;
    });
  };

  const addTimeSlot = (dateStr) => {
    setSelectedDates(prev => ({
      ...prev,
      [dateStr]: [...(prev[dateStr] || []), { from: post.openingTime, to: post.closingTime }]
    }));
  };

  const removeTimeSlot = (dateStr, index) => {
    setSelectedDates(prev => {
      const newSlots = [...prev[dateStr]];
      newSlots.splice(index, 1);
      if (newSlots.length === 0) {
        const newDates = { ...prev };
        delete newDates[dateStr];
        return newDates;
      }
      return { ...prev, [dateStr]: newSlots };
    });
  };

  const updateTimeSlot = (dateStr, index, field, value) => {
    setSelectedDates(prev => ({
      ...prev,
      [dateStr]: prev[dateStr].map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const shiftPreferences = Object.entries(selectedDates).map(([date, timeSlots]) => ({
        date,
        timeSlots
      }));
      
      await onSubmit({ shiftPreferences });
      onClose();
    } catch (error) {
      console.error('Error submitting shift response:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{t.shiftPreferences}</CardTitle>
          <div className="text-sm text-gray-600">
            <p>{post.title}</p>
            <p>{t.from} {new Date(post.startDate).toLocaleDateString()} {t.to} {new Date(post.endDate).toLocaleDateString()}</p>
            <p>{t.deadline}: {new Date(post.deadline).toLocaleDateString()}</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="mb-4">{t.selectDates}</h3>
              <div className="space-y-3">
                {dates.map(date => {
                  const dateStr = date.toISOString().split('T')[0];
                  const isSelected = selectedDates[dateStr];
                  
                  return (
                    <div key={dateStr} className="border rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          checked={!!isSelected}
                          onCheckedChange={() => handleDateToggle(dateStr)}
                        />
                        <label className="font-medium">
                          {date.toLocaleDateString()}
                        </label>
                      </div>
                      
                      {isSelected && (
                        <div className="ml-6 space-y-2">
                          {selectedDates[dateStr].map((timeSlot, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={timeSlot.from}
                                onChange={(e) => updateTimeSlot(dateStr, index, 'from', e.target.value)}
                                className="w-32"
                              />
                              <span>-</span>
                              <Input
                                type="time"
                                value={timeSlot.to}
                                onChange={(e) => updateTimeSlot(dateStr, index, 'to', e.target.value)}
                                className="w-32"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => removeTimeSlot(dateStr, index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => addTimeSlot(dateStr)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            {t.addTimeSlot}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? t.loading : t.submitShift}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                {t.cancel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};