import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { useLanguage } from '../App';
import { ShiftAssignmentModal } from './ShiftAssignmentModal';
import { PublishedShiftsModal } from './PublishedShiftsModal';
import { Settings, Eye } from 'lucide-react';

export const SurveyResultsModal = ({ post, onClose, isAdmin = false, onMessage, onPostsUpdate }) => {
  const { t } = useLanguage();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignment, setShowAssignment] = useState(false);
  const [showPublishedShifts, setShowPublishedShifts] = useState(false);
  const [hasPublishedShifts, setHasPublishedShifts] = useState(false);

  useEffect(() => {
    loadResponses();
    if (isAdmin) {
      checkPublishedShifts();
    }
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
      }
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPublishedShifts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/posts/${post.id}/published-shifts`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const result = await response.json();
      if (response.ok) {
        setHasPublishedShifts(result.shifts && result.shifts.length > 0);
      }
    } catch (error) {
      console.error('Error checking published shifts:', error);
    }
  };

  const handleAssignmentComplete = (message) => {
    if (onMessage) onMessage(message);
    setHasPublishedShifts(true);
    checkPublishedShifts();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{t.surveyResults}</CardTitle>
          <div className="text-sm text-gray-600">
            <p>{post.title}</p>
            <p>{t.responses}: {responses.length}</p>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">{t.loading}</p>
          ) : responses.length === 0 ? (
            <p className="text-gray-600 text-center py-4">{t.noResponses}</p>
          ) : (
            <div className="space-y-6">
              {responses.map((response) => (
                <div key={response.userId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3>{response.userName}</h3>
                      <p className="text-sm text-gray-600">{response.userEmail}</p>
                    </div>
                    <Badge variant="outline">
                      {t.submitted}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {response.shiftPreferences.map((preference, index) => (
                      <div key={index} className="bg-gray-50 rounded p-3">
                        <h4 className="mb-2">
                          {new Date(preference.date).toLocaleDateString()}
                        </h4>
                        <div className="space-y-1">
                          {preference.timeSlots.map((slot, slotIndex) => (
                            <div key={slotIndex} className="text-sm">
                              {slot.from} - {slot.to}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 space-y-3">
            {isAdmin && responses.length > 0 && (
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowAssignment(true)}
                  className="flex-1"
                  variant={hasPublishedShifts ? "outline" : "default"}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  シフト採用管理
                </Button>
                {hasPublishedShifts && (
                  <Button 
                    onClick={() => setShowPublishedShifts(true)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    採用されたシフト
                  </Button>
                )}
              </div>
            )}
            <Button onClick={onClose} className="w-full" variant="outline">
              {t.cancel}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {showAssignment && (
        <ShiftAssignmentModal
          post={post}
          onClose={() => setShowAssignment(false)}
          onAssignmentComplete={handleAssignmentComplete}
          onPostsUpdate={onPostsUpdate}
        />
      )}
      
      {showPublishedShifts && (
        <PublishedShiftsModal
          post={post}
          onClose={() => setShowPublishedShifts(false)}
        />
      )}
    </div>
  );
};