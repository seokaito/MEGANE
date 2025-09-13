import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useLanguage } from '../App';

export const CreatePostModal = ({ onClose, onSubmit }) => {
  const { t } = useLanguage();
  const [postForm, setPostForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    deadline: '',
    openingTime: '09:00',
    closingTime: '22:00'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(postForm);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{t.createPost}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">{t.shiftSurvey}</label>
              <Input
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                placeholder={t.shiftSurvey}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-2">{t.startDate}</label>
                <Input
                  type="date"
                  value={postForm.startDate}
                  onChange={(e) => setPostForm({ ...postForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block mb-2">{t.endDate}</label>
                <Input
                  type="date"
                  value={postForm.endDate}
                  onChange={(e) => setPostForm({ ...postForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-2">{t.deadline}</label>
              <Input
                type="date"
                value={postForm.deadline}
                onChange={(e) => setPostForm({ ...postForm, deadline: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-2">{t.openingTime}</label>
                <Input
                  type="time"
                  value={postForm.openingTime}
                  onChange={(e) => setPostForm({ ...postForm, openingTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block mb-2">{t.closingTime}</label>
                <Input
                  type="time"
                  value={postForm.closingTime}
                  onChange={(e) => setPostForm({ ...postForm, closingTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? t.loading : t.createSurvey}
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