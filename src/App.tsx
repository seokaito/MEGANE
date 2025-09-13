import React, { useState, useEffect, createContext, useContext } from 'react';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Separator } from "./components/ui/separator";
import { Globe, Users, Plus, LogIn, UserPlus, Copy, Check, LogOut, ArrowLeft, Trash2, Calendar, Clock, MessageSquare, Eye, X, CheckCircle, User } from 'lucide-react';
import crossManagementLogo from 'figma:asset/5eb7fcf3dd8e11d147a272ca2baf561835904fec.png';
import { supabase } from './utils/supabase/client';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { CreatePostModal } from './components/CreatePostModal';
import { ShiftResponseModal } from './components/ShiftResponseModal';
import { SurveyResultsModal } from './components/SurveyResultsModal';
import { ShiftResultPost } from './components/ShiftResultPost';
import { MyPage } from './components/MyPage';
import { ShiftSubstituteRequestModal } from './components/ShiftSubstituteRequestModal';
import { ShiftSubstituteDetailModal } from './components/ShiftSubstituteDetailModal';
import { ShiftSubstituteResultModal } from './components/ShiftSubstituteResultModal';

// 多言語対応
const translations = {
  en: {
    selectLanguage: "Select Language",
    welcome: "Welcome",
    login: "Sign In",
    register: "Sign Up",
    email: "Email",
    password: "Password",
    name: "Name",
    confirmPassword: "Confirm Password",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
    dashboard: "Dashboard",
    createGroup: "Create Group",
    joinGroup: "Join Group",
    groupName: "Group Name",
    description: "Description",
    inviteCode: "Invite Code",
    enterInviteCode: "Enter Invite Code",
    myGroups: "My Groups",
    admin: "Admin",
    member: "Member",
    copied: "Copied!",
    copy: "Copy",
    logout: "Logout",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    groupCreated: "Group created successfully!",
    joinedGroup: "Joined group successfully!",
    invalidCode: "Invalid invite code",
    passwordsNotMatch: "Passwords do not match",
    fillAllFields: "Please fill all fields",
    emailInvalid: "Please enter a valid email",
    passwordTooShort: "Password must be at least 6 characters",
    groupDetails: "Group Details",
    members: "Members",
    backToDashboard: "Back to Dashboard",
    memberCount: "members",
    settings: "Settings",
    deleteGroup: "Delete Group",
    deleteGroupConfirm: "Are you sure you want to delete this group? This action cannot be undone.",
    delete: "Delete",
    cancel: "Cancel",
    groupDeleted: "Group deleted successfully",
    deletePost: "Delete Post",
    deletePostConfirm: "Are you sure you want to delete this post? This action cannot be undone.",
    postDeleted: "Post deleted successfully",
    substituteRequest: "Shift Substitute Request",
    createSubstituteRequest: "Request Substitute",
    shiftDate: "Shift Date",
    shiftTime: "Shift Time",
    startTime: "Start Time",
    endTime: "End Time",
    reason: "Reason",
    reasonPlaceholder: "Please describe why you need a substitute (e.g., emergency, illness, etc.)",
    submitRequest: "Submit Request",
    submitting: "Submitting...",
    selectShiftDate: "Select the date of the shift you need to substitute",
    invalidTimeRange: "End time must be after start time",
    postedBy: "Posted by",
    postedOn: "Posted on",
    you: "You",
    close: "Close",
    note: "Note",
    substituteNote: "This request will be shared with other members. Please notify the admin when a substitute is arranged.",
    substituteShift: "Take This Shift",
    substituteConfirm: "Are you sure you want to take this shift? This will replace you on this schedule.",
    substituteSuccess: "Successfully took the shift! The schedule has been updated.",
    substituteError: "Failed to take the shift. Please try again.",
    substituteProcessing: "Processing...",
    shiftUpdated: "Shift schedule updated",
    shiftScheduleUpdated: "Actual shift schedule has been automatically updated",
    noShiftOnDate: "No shift scheduled on this date.",
    noMatchingShiftTime: "No shift found for the specified time range.",
    viewUpdatedSchedule: "View Updated Schedule",
    posts: "Posts",
    createPost: "Create Post",
    shiftSurvey: "Shift Survey",
    surveyPeriod: "Survey Period",
    startDate: "Start Date",
    endDate: "End Date",
    deadline: "Deadline",
    openingTime: "Opening Time",
    closingTime: "Closing Time",
    createSurvey: "Create Survey",
    submitShift: "Submit Shift",
    shiftPreferences: "Shift Preferences",
    selectDates: "Select Available Dates",
    timeRange: "Time Range",
    addTimeSlot: "Add Time Slot",
    removeTimeSlot: "Remove",
    noPostsYet: "No posts yet",
    surveyResults: "Survey Results",
    viewResults: "View Results",
    respondToSurvey: "Respond to Survey",
    responses: "Responses",
    noResponses: "No responses yet",
    submitted: "Submitted",
    notSubmitted: "Not submitted",
    from: "From",
    to: "To",
    shiftAssignment: "Shift Assignment",
    assignShifts: "Assign Shifts",
    preview: "Preview",
    publishedShifts: "Published Shifts",
    assignedShifts: "Assigned Shifts",
    availableTime: "Available Time",
    assigned: "Assigned",
    assignShift: "Assign Shift",
    removeAssignment: "Remove Assignment",
    generatePreview: "Generate Preview",
    confirmPublish: "Confirm & Publish",
    publishing: "Publishing...",
    shiftPublished: "Shifts published successfully!",
    totalShifts: "Total Shifts",
    noAssignedShifts: "No assigned shifts",
    backToAssignment: "Back to Assignment",
    publishShifts: "Publish Shifts",
    myPage: "My Page",
    shiftResult: "Shift Result",
    shiftSubstituteCompleted: "Substitute Completed",
    period: "Period",
    shiftsCount: "shifts",
    membersParticipated: "members participated",
    viewResults: "View Results",
    viewDetails: "View Details",
    deletePost: "Delete Post",
    deletePostTitle: "Delete Post",
    confirmDeletePost: "Are you sure you want to delete the following post?",
    cannotUndoAction: "This action cannot be undone.",
    deleteConfirm: "Delete",
    surveyPeriodLabel: "Survey Period",
    shiftAssigned: "Shift Assigned",
    adopted: "Adopted",
    poster: "Poster",
    userInfo: "User Information",
    nameLabel: "Name",
    emailLabel: "Email Address",
    notSet: "Not Set",
    statistics: "Statistics",
    joinedGroups: "Joined Groups",
    managedGroups: "Managed Groups",
    totalShifts: "Total Shifts",
    thisMonthShifts: "This Month's Shifts",
    loading: "Loading...",
    adoptionResults: "Adoption Results",
    postDate: "Posted Date",
    noAdoptedShifts: "No adopted shifts",
    participatingMembers: "Participating Members",
    workDays: "Work Days",
    totalWorkHours: "Total Work Hours",
    dateView: "Date View",
    memberView: "Member View",
    people: "people",
    daysWorked: "days worked",
    hours: "hours",
    substituteCompleted: "Substitute completed",
    substituteProcessedSuccessfully: "The following shift substitute has been processed successfully. The shift schedule has been updated.",
    beforeSubstitute: "Before",
    afterSubstitute: "After",
    substituteCompletedNote: "This substitute is completed. The new assigned person is reflected in the shift schedule.",
    hourlyWage: "Hourly Wage",
    setHourlyWage: "Set Hourly Wage (Estimate)",
    monthlyEarnings: "Monthly Earnings",
    totalEarnings: "Total Earnings",
    currency: "$",
    noWageSet: "Hourly wage not set",
    wageSetting: "Wage Setting (Estimate)",
    saveWage: "Save",
    wageUpdated: "Hourly wage updated successfully",
    currentMonth: "Current Month",
    lastMonth: "Last Month",
    hours: "hours",
    removeMember: "Remove Member",
    confirmRemoveMember: "Are you sure you want to remove this member from the group?",
    cannotUndoRemove: "This action cannot be undone.",
    remove: "Remove",
    memberRemoved: "Member removed successfully"
  },
  zh: {
    selectLanguage: "选择语言",
    welcome: "欢迎",
    login: "登录",
    register: "注册",
    email: "邮箱",
    password: "密码",
    name: "姓名",
    confirmPassword: "确认密码",
    alreadyHaveAccount: "已有账户？",
    dontHaveAccount: "没有账户？",
    dashboard: "仪表板",
    createGroup: "创建群组",
    joinGroup: "加入群组",
    groupName: "群组名称",
    description: "描述",
    inviteCode: "邀请码",
    enterInviteCode: "输入邀请码",
    myGroups: "我的群组",
    admin: "管理员",
    member: "成员",
    copied: "已复制！",
    copy: "复制",
    logout: "退出登录",
    loading: "加载中...",
    error: "错误",
    success: "成功",
    groupCreated: "群组创建成功！",
    joinedGroup: "加入群组成功！",
    invalidCode: "无效的邀请码",
    passwordsNotMatch: "密码不匹配",
    fillAllFields: "请填写所有字段",
    emailInvalid: "请输入有效的邮箱地址",
    passwordTooShort: "密码必须至少6个字符",
    groupDetails: "群组详情",
    members: "成员",
    backToDashboard: "返回仪表板",
    memberCount: "名成员",
    settings: "设置",
    deleteGroup: "删除群组",
    deleteGroupConfirm: "确定要删除此群组吗？此操作无法撤销。",
    delete: "删除",
    cancel: "取消",
    groupDeleted: "群组删除成功",
    deletePost: "删除投稿",
    deletePostConfirm: "确定要删除此投稿吗？此操作无法撤销。",
    postDeleted: "投稿删除成功",
    substituteRequest: "班次代替申请",
    createSubstituteRequest: "申请代替",
    shiftDate: "班次日期",
    shiftTime: "班次时间",
    startTime: "开始时间",
    endTime: "结束时间",
    reason: "理由",
    reasonPlaceholder: "请描述需要代替的原因（例如：紧急情况、生病等）",
    submitRequest: "提交申请",
    submitting: "提交中...",
    selectShiftDate: "选择需要代替的班次日期",
    invalidTimeRange: "结束时间必须晚于开始时间",
    postedBy: "发布者",
    postedOn: "发布于",
    you: "您",
    close: "关闭",
    note: "注意",
    substituteNote: "此申请将与其他成员共享。安排好代替后请通知管理员。",
    substituteShift: "接替班次",
    substituteConfirm: "确定要接替这个班次吗？这将替换您当前的排班。",
    substituteSuccess: "成功接替班次！排班表已更新。",
    substituteError: "接替班次失败。请重试。",
    substituteProcessing: "处理中...",
    shiftUpdated: "班次表已更新",
    shiftScheduleUpdated: "实际班次表已自动更新",
    noShiftOnDate: "此日期没有排班。",
    noMatchingShiftTime: "找不到指定时间段的班次。",
    viewUpdatedSchedule: "查看更新后的排班",
    posts: "投稿",
    createPost: "创建投稿",
    shiftSurvey: "班次调查",
    surveyPeriod: "调查期间",
    startDate: "开始日期",
    endDate: "结束日期",
    deadline: "截止日期",
    openingTime: "开店时间",
    closingTime: "关店时间",
    createSurvey: "创建调查",
    submitShift: "提交班次",
    shiftPreferences: "班次偏好",
    selectDates: "选择可用日期",
    timeRange: "时间范围",
    addTimeSlot: "添加时间段",
    removeTimeSlot: "删除",
    noPostsYet: "暂无投稿",
    surveyResults: "调查结果",
    viewResults: "查看结果",
    respondToSurvey: "回复调查",
    responses: "回复",
    noResponses: "暂无回复",
    submitted: "已提交",
    notSubmitted: "未提交",
    from: "从",
    to: "到",
    shiftAssignment: "班次分配",
    assignShifts: "分配班次",
    preview: "预览",
    publishedShifts: "已发布班次",
    assignedShifts: "分配的班次",
    availableTime: "可用时间",
    assigned: "已分配",
    assignShift: "分配班次",
    removeAssignment: "取消分配",
    generatePreview: "生成预览",
    confirmPublish: "确认并发布",
    publishing: "发布中...",
    shiftPublished: "班次发布成功！",
    totalShifts: "总班次数",
    noAssignedShifts: "暂无分配的班次",
    backToAssignment: "返回分配",
    publishShifts: "发布班次",
    myPage: "我的页面",
    shiftResult: "班次结果",
    shiftSubstituteCompleted: "代替完成",
    period: "期间",
    shiftsCount: "个班次",
    membersParticipated: "名成员参加",
    viewResults: "查看结果",
    viewDetails: "查看详情",
    deletePost: "删除投稿",
    deletePostTitle: "删除投稿",
    confirmDeletePost: "确定要删除以下投稿吗？",
    cannotUndoAction: "此操作无法撤销。",
    deleteConfirm: "删除",
    surveyPeriodLabel: "调查期间",
    shiftAssigned: "班次已分配",
    adopted: "已采用",
    poster: "发布者",
    userInfo: "用户信息",
    nameLabel: "姓名",
    emailLabel: "邮箱地址",
    notSet: "未设置",
    statistics: "统计信息",
    joinedGroups: "参加群组",
    managedGroups: "管理群组",
    totalShifts: "总班次数",
    thisMonthShifts: "本月班次",
    loading: "加载中...",
    adoptionResults: "采用结果",
    postDate: "发布日期",
    noAdoptedShifts: "无采用的班次",
    participatingMembers: "参与成员",
    workDays: "工作天数",
    totalWorkHours: "总工作时间",
    dateView: "按日期查看",
    memberView: "按成员查看",
    people: "人",
    daysWorked: "天工作",
    hours: "小时",
    substituteCompleted: "代替完成",
    substituteProcessedSuccessfully: "以下班次的代替已成功处理。班次表已更新。",
    beforeSubstitute: "代替前",
    afterSubstitute: "代替后",
    substituteCompletedNote: "此代替已完成。班次表已反映新的负责人。",
    hourlyWage: "时薪",
    setHourlyWage: "设置时薪（参考）",
    monthlyEarnings: "月收入",
    totalEarnings: "总收入",
    currency: "￥",
    noWageSet: "未设置时薪",
    wageSetting: "时薪设置（参考）",
    saveWage: "保存",
    wageUpdated: "时薪更新成功",
    currentMonth: "本月",
    lastMonth: "上月",
    hours: "小时",
    removeMember: "删除成员",
    confirmRemoveMember: "确定要将此成员从群组中删除吗？",
    cannotUndoRemove: "此操作无法撤销。",
    remove: "删除",
    memberRemoved: "成员删除成功"
  },
  ja: {
    selectLanguage: "言語を選択",
    welcome: "ようこそ",
    login: "ログイン",
    register: "新規登録",
    email: "メールアドレス",
    password: "パスワード",
    name: "名前",
    confirmPassword: "パスワード確認",
    alreadyHaveAccount: "アカウントをお持ちですか？",
    dontHaveAccount: "アカウントをお持ちでないですか？",
    dashboard: "ダッシュボード",
    createGroup: "グループ作成",
    joinGroup: "グループ参加",
    groupName: "グループ名",
    description: "説明",
    inviteCode: "招待コード",
    enterInviteCode: "招待コードを入力",
    myGroups: "マイグループ",
    admin: "管理者",
    member: "メンバー",
    copied: "コピーしました！",
    copy: "コピー",
    logout: "ログアウト",
    loading: "読み込み中...",
    error: "エラー",
    success: "成功",
    groupCreated: "グループを作成しました！",
    joinedGroup: "グループに参加しました！",
    invalidCode: "無効な招待コードです",
    passwordsNotMatch: "パスワードが一致しません",
    fillAllFields: "すべての項目を入力してください",
    emailInvalid: "有効なメールアドレスを入力してください",
    passwordTooShort: "パスワードは6文字以上で入力してください",
    groupDetails: "グループ詳細",
    members: "メンバー",
    backToDashboard: "ダッシュボードに戻る",
    memberCount: "人のメンバー",
    settings: "設定",
    deleteGroup: "グループ削除",
    deleteGroupConfirm: "このグループを削除してもよろしいですか？この操作は元に戻せません。",
    delete: "削除",
    cancel: "キャンセル",
    groupDeleted: "グループを削除しました",
    deletePost: "投稿削除",
    deletePostConfirm: "この投稿を削除してもよろしいですか？この操作は元に戻せません。",
    postDeleted: "投稿を削除しました",
    substituteRequest: "交代申請",
    createSubstituteRequest: "交代申請",
    shiftDate: "シフト日",
    shiftTime: "シフト時間",
    startTime: "開始時間",
    endTime: "終了時間",
    reason: "理由",
    reasonPlaceholder: "交代が必要な理由を記入してください（例：急用、体調不良など）",
    submitRequest: "申請を提出",
    submitting: "送信中...",
    selectShiftDate: "交代が必要なシフトの日付を選択してください",
    invalidTimeRange: "終了時間は開始時間より後に設定してください",
    postedBy: "投稿者",
    postedOn: "投稿日",
    you: "あなた",
    close: "閉じる",
    note: "注意",
    substituteNote: "この申請は他のメンバーに共有されます。交代が決まったら管理者にお知らせください。",
    substituteShift: "交代する",
    substituteConfirm: "このシフトを交代してもよろしいですか？あなたのスケジュールに追加されます。",
    substituteSuccess: "交代が完了しました！シフト表が更新されました。",
    substituteError: "交代に失敗しました。もう一度お試しください。",
    substituteProcessing: "処理中...",
    shiftUpdated: "シフト表が更新されました",
    shiftScheduleUpdated: "実際のシフト表も自動更新されました",
    noShiftOnDate: "この日にはシフトが入っていません。",
    noMatchingShiftTime: "指定された時間帯のシフトが見つかりません。",
    viewUpdatedSchedule: "更新されたシフト表を見る",
    posts: "投稿",
    createPost: "投稿作成",
    shiftSurvey: "シフト希望調査",
    surveyPeriod: "調査期間",
    startDate: "開始日",
    endDate: "終了日",
    deadline: "締切日",
    openingTime: "開店時間",
    closingTime: "閉店時間",
    createSurvey: "調査作成",
    submitShift: "シフト提出",
    shiftPreferences: "シフト希望",
    selectDates: "勤務可能日を選択",
    timeRange: "時間帯",
    addTimeSlot: "時間帯追加",
    removeTimeSlot: "削除",
    noPostsYet: "まだ投稿がありません",
    surveyResults: "調査結果",
    viewResults: "結果を見る",
    respondToSurvey: "調査に回答",
    responses: "回答",
    noResponses: "まだ回答がありません",
    submitted: "提出済み",
    notSubmitted: "未提出",
    from: "から",
    to: "まで",
    shiftAssignment: "シフト採用管理",
    assignShifts: "シフト採用",
    preview: "プレビュー",
    publishedShifts: "採用されたシフト",
    assignedShifts: "採用シフト",
    availableTime: "希望時間",
    assigned: "採用",
    assignShift: "シフト採用",
    removeAssignment: "採用取消",
    generatePreview: "プレビュー生成",
    confirmPublish: "確認・投稿",
    publishing: "投稿中...",
    shiftPublished: "シフトを採用・投稿しました！",
    totalShifts: "総シフト数",
    noAssignedShifts: "採用されたシフトがありません",
    backToAssignment: "採用に戻る",
    publishShifts: "シフトを投稿",
    myPage: "マイページ",
    shiftResult: "採用結果",
    shiftSubstituteCompleted: "交代完了",
    period: "期間",
    shiftsCount: "件のシフト",
    membersParticipated: "名が参加",
    viewResults: "結果を見る",
    viewDetails: "詳細を見る",
    deletePost: "削除",
    deletePostTitle: "投稿を削除",
    confirmDeletePost: "以下の投稿を削除してもよろしいですか？",
    cannotUndoAction: "この操作は元に戻せません。",
    deleteConfirm: "削除する",
    surveyPeriodLabel: "調査期間",
    shiftAssigned: "シフト採用済み",
    adopted: "採用済み",
    poster: "投稿者",
    userInfo: "ユーザー情報",
    nameLabel: "名前",
    emailLabel: "メールアドレス",
    notSet: "未設定",
    statistics: "統計情報",
    joinedGroups: "参加グループ",
    managedGroups: "管理グループ",
    totalShifts: "総シフト数",
    thisMonthShifts: "今月のシフト",
    loading: "読み込み中...",
    adoptionResults: "採用結果",
    postDate: "投稿日",
    noAdoptedShifts: "採用されたシフトがありません",
    participatingMembers: "参加メンバー",
    workDays: "勤務日数",
    totalWorkHours: "総勤務時間",
    dateView: "日付別表示",
    memberView: "メンバー別表示",
    people: "人",
    daysWorked: "日勤務",
    hours: "時間",
    substituteCompleted: "交代が完了しました",
    substituteProcessedSuccessfully: "以下のシフトの交代が正常に処理されました。シフト表が更新されています。",
    beforeSubstitute: "交代前",
    afterSubstitute: "交代後",
    substituteCompletedNote: "この交代は完了しています。シフト表には新しい担当者が反映されています。",
    hourlyWage: "時給",
    setHourlyWage: "時給設定（目安）",
    monthlyEarnings: "月収",
    totalEarnings: "総収入",
    currency: "￥",
    noWageSet: "時給未設定",
    wageSetting: "時給設定（目安）",
    saveWage: "保存",
    wageUpdated: "時給を更新しました",
    currentMonth: "今月",
    lastMonth: "先月",
    hours: "時間",
    removeMember: "メンバー削除",
    confirmRemoveMember: "このメンバーをグループから削除してもよろしいですか？",
    cannotUndoRemove: "この操作は元に戻せません。",
    remove: "削除する",
    memberRemoved: "メンバーを削除しました"
  }
};

// 言語コンテキスト
const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Note: Supabase client is now imported from utils/supabase/client

// 言語選択画面
const LanguageSelector = ({ onLanguageSelect }) => {
  const languages = [
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img 
            src={crossManagementLogo} 
            alt="Cross Management" 
            className="mx-auto w-24 h-24 mb-4"
          />
          <CardTitle className="text-2xl">Select Language</CardTitle>
          <CardDescription>Choose your preferred language</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant="outline"
              className="w-full justify-start text-left p-4 h-auto"
              onClick={() => onLanguageSelect(lang.code)}
            >
              <span className="text-2xl mr-3">{lang.flag}</span>
              <span className="text-lg">{lang.name}</span>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

// 認証画面
const AuthScreen = () => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError(t.fillAllFields);
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError(t.emailInvalid);
      return false;
    }

    if (formData.password.length < 6) {
      setError(t.passwordTooShort);
      return false;
    }

    if (!isLogin) {
      if (!formData.name || !formData.confirmPassword) {
        setError(t.fillAllFields);
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError(t.passwordsNotMatch);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) throw error;
      } else {
        // 新規登録はサーバー経由で行う
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name
          })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Registration failed');

        // 新規登録後、自動的にログイン
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="mx-auto w-12 h-12 text-blue-600 mb-4" />
          <CardTitle className="text-2xl">{t.welcome}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "register"} onValueChange={(value) => setIsLogin(value === "login")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t.login}</TabsTrigger>
              <TabsTrigger value="register">{t.register}</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isLogin && (
                <div>
                  <label className="block mb-2">{t.name}</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t.name}
                  />
                </div>
              )}

              <div>
                <label className="block mb-2">{t.email}</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t.email}
                />
              </div>

              <div>
                <label className="block mb-2">{t.password}</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t.password}
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block mb-2">{t.confirmPassword}</label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder={t.confirmPassword}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.loading : (isLogin ? t.login : t.register)}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// グループ詳細画面
const GroupDetails = ({ group, user, onBack, onGroupDeleted }) => {
  const { t } = useLanguage();
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);
  const [deletingPost, setDeletingPost] = useState(null);
  const [message, setMessage] = useState('');
  const [showSubstituteRequest, setShowSubstituteRequest] = useState(false);
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);

  useEffect(() => {
    loadMembers();
    loadPosts();
  }, [group.id]);

  const loadMembers = async () => {
    try {
      console.log(`Loading members for group: ${group.id}`);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/groups/${group.id}/members`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const result = await response.json();
      console.log('Members API response:', result);
      if (response.ok) {
        setMembers(result.members || []);
        console.log(`Set ${result.members?.length || 0} members`);
      } else {
        console.error('Error response from members API:', result);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/groups/${group.id}/posts`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const result = await response.json();
      if (response.ok) {
        console.log('Loaded posts:', result.posts); // デバッグ用
        console.log('Post IDs:', result.posts?.map(p => ({ id: p.id, title: p.title })));
        setPosts(result.posts || []);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const copyInviteCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const deleteGroup = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/groups/${group.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      const result = await response.json();
      if (response.ok) {
        onGroupDeleted(t.groupDeleted);
        onBack();
      } else {
        console.error('Error deleting group:', result);
        alert(result.error || 'Error deleting group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Error deleting group');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const createPost = async (postData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/groups/${group.id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();
      if (response.ok) {
        loadPosts();
        setMessage(t.success || '投稿を作成しました');
        setTimeout(() => setMessage(''), 3000);
      } else {
        console.error('Error creating post:', result);
        alert(result.error || 'Error creating post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post');
    }
  };

  // 投稿タイプを判定するヘルパー関数
  const getPostType = (post) => {
    // 明示的にtypeが設定されている場合はそれを使用
    if (post.type) {
      return post.type;
    }
    // タイトルに「採用結果」が含まれている場合はshift_result
    if (post.title && post.title.includes('採用結果')) {
      return 'shift_result';
    }
    // originalPostIdがある場合もshift_result
    if (post.originalPostId) {
      return 'shift_result';
    }
    // publishedAtがあってstatusがpublishedで、typeが未設定の場合は調査投稿だが採用済み
    if (post.status === 'published' && post.publishedAt) {
      return 'shift_survey_published';
    }
    // デフォルトはshift_survey
    return 'shift_survey';
  };

  const submitResponse = async (responseData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/posts/${selectedPost.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(responseData)
      });

      const result = await response.json();
      if (response.ok) {
        alert(t.success);
      } else {
        console.error('Error submitting response:', result);
        alert(result.error || 'Error submitting response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Error submitting response');
    }
  };

  const deletePost = async () => {
    if (!deletingPost) return;
    
    try {
      console.log('Deleting post:', deletingPost.id);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No valid session for post deletion');
        alert('認証エラーが発生しました。ページを更新してください。');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/posts/${deletingPost.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      console.log('Delete post response:', result);
      
      if (response.ok) {
        setMessage(t.postDeleted || '投稿を削除しました');
        // 3秒後にメッセージをクリア
        setTimeout(() => setMessage(''), 3000);
        loadPosts(); // 投稿リストを再読み込み
      } else {
        console.error('Error deleting post:', result);
        alert(result.error || 'Error deleting post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('投稿の削除中にエラーが発生しました');
    } finally {
      setShowDeletePostConfirm(false);
      setDeletingPost(null);
    }
  };

  const removeMember = async () => {
    if (!removingMember) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('認証エラーが発生しました。ページを更新してください。');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/groups/${group.id}/members/${removingMember.userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage(t.memberRemoved);
        setTimeout(() => setMessage(''), 3000);
        loadMembers(); // メンバーリストを再読み込み
      } else {
        console.error('Error removing member:', result);
        alert(result.error || 'メンバーの削除に失敗しました');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('メンバーの削除中にエラーが発生しました');
    } finally {
      setShowRemoveMemberConfirm(false);
      setRemovingMember(null);
    }
  };

  const handleSubstitute = async (substitutePost) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('認証エラーが発生しました。ページを更新してください。');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/posts/${substitutePost.id}/substitute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage(t.substituteSuccess || '交代が完了しました！シフト表が更新されました。');
        setTimeout(() => setMessage(''), 5000);
        loadPosts(); // 投稿リストを再読み込み
      } else {
        console.error('Error substituting shift:', result);
        alert(result.error || t.substituteError || '交代に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      console.error('Error substituting shift:', error);
      alert(t.substituteError || '交代に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl">{group.name}</h1>
              <p className="text-gray-600">{group.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={group.isAdmin ? "default" : "secondary"}>
              {group.isAdmin ? t.admin : t.member}
            </Badge>
            {group.isAdmin && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts">{t.posts}</TabsTrigger>
              <TabsTrigger value="members">{t.members}</TabsTrigger>
            </TabsList>

            <TabsContent value="posts">
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {group.isAdmin && (
                        <Button 
                          onClick={() => setShowCreatePost(true)}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {t.createPost}
                        </Button>
                      )}
                      <Button 
                        onClick={() => setShowSubstituteRequest(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {t.createSubstituteRequest}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t.posts}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {postsLoading ? (
                      <p className="text-center py-4">{t.loading}</p>
                    ) : posts.length === 0 ? (
                      <p className="text-gray-600 text-center py-4">{t.noPostsYet}</p>
                    ) : (
                      <div className="space-y-4">
                        {posts.map((post) => (
                          <div key={post.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3>{post.title}</h3>
                                  {getPostType(post) === 'shift_result' && (
                                    <Badge className="bg-green-100 text-green-800 border-green-300">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      {t.shiftResult}
                                    </Badge>
                                  )}
                                  {(getPostType(post) === 'shift_survey' || getPostType(post) === 'shift_survey_published') && (
                                    <Badge variant="outline">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {t.shiftSurvey}
                                      {getPostType(post) === 'shift_survey_published' && ` (${t.adopted})`}
                                    </Badge>
                                  )}
                                  {getPostType(post) === 'shift_substitute_request' && (
                                    <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {t.substituteRequest}
                                    </Badge>
                                  )}
                                  {getPostType(post) === 'shift_substitute_result' && (
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      {t.shiftSubstituteCompleted}
                                    </Badge>
                                  )}
                                </div>
                                {getPostType(post) === 'shift_result' ? (
                                  <>
                                    <p className="text-sm text-gray-600">
                                      {t.period}: {new Date(post.startDate).toLocaleDateString()} - {new Date(post.endDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {post.totalShifts}{t.shiftsCount}・{post.uniqueMembers}{t.membersParticipated}
                                    </p>
                                  </>
                                ) : getPostType(post) === 'shift_substitute_request' ? (
                                  <>
                                    <p className="text-sm text-gray-600">
                                      {t.shiftDate}: {post.date ? (() => {
                                        try {
                                          const date = new Date(post.date);
                                          return isNaN(date.getTime()) ? post.date : date.toLocaleDateString('ja-JP');
                                        } catch {
                                          return post.date;
                                        }
                                      })() : 'Invalid Date'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {t.shiftTime}: {post.startTime} - {post.endTime}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {t.poster}: {post.authorName || post.authorEmail}
                                    </p>
                                  </>
                                ) : getPostType(post) === 'shift_substitute_result' ? (
                                  <>
                                    <p className="text-sm text-gray-600">
                                      {t.shiftDate}: {post.date ? (() => {
                                        try {
                                          const date = new Date(post.date);
                                          return isNaN(date.getTime()) ? post.date : date.toLocaleDateString('ja-JP');
                                        } catch {
                                          return post.date;
                                        }
                                      })() : 'Invalid Date'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {t.shiftTime}: {post.startTime} - {post.endTime}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {post.originalRequesterName} → {post.substituteName}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-sm text-gray-600">
                                      {t.surveyPeriod}: {new Date(post.startDate).toLocaleDateString()} - {new Date(post.endDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {t.deadline}: {new Date(post.deadline).toLocaleDateString()}
                                    </p>
                                    {post.status === 'published' && (
                                      <p className="text-sm text-green-600">
                                        {t.shiftAssigned}
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {getPostType(post) === 'shift_result' ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => setSelectedPost({...post, mode: 'shift_result'})}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      {t.viewResults}
                                    </Button>
                                    {group.isAdmin && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          console.log('Setting post for deletion:', post);
                                          setDeletingPost(post);
                                          setShowDeletePostConfirm(true);
                                        }}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        {t.deletePost}
                                      </Button>
                                    )}
                                  </>
                                ) : getPostType(post) === 'shift_substitute_request' ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => setSelectedPost({...post, mode: 'substitute_detail'})}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      {t.viewDetails}
                                    </Button>
                                    {(post.createdBy === user?.id || group.isAdmin) && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setDeletingPost(post);
                                          setShowDeletePostConfirm(true);
                                        }}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        {t.deletePost}
                                      </Button>
                                    )}
                                  </>
                                ) : getPostType(post) === 'shift_substitute_result' ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => setSelectedPost({...post, mode: 'substitute_result'})}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      {t.viewDetails}
                                    </Button>
                                    {((post.originalRequesterId === user?.id || post.substituteId === user?.id) || group.isAdmin) && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setDeletingPost(post);
                                          setShowDeletePostConfirm(true);
                                        }}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        {t.deletePost}
                                      </Button>
                                    )}
                                  </>
                                ) : getPostType(post) === 'shift_survey_published' ? (
                                  // 採用済みの調査投稿の場合、全員が結果を見れる
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => setSelectedPost({...post, mode: 'results'})}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      {t.viewResults}
                                    </Button>
                                    {group.isAdmin && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setSelectedPost({...post, mode: 'respond'})}
                                        >
                                          <MessageSquare className="w-4 h-4 mr-1" />
                                          {t.respondToSurvey}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setDeletingPost(post);
                                            setShowDeletePostConfirm(true);
                                          }}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4 mr-1" />
                                          {t.deletePost}
                                        </Button>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  // 通常のシフト調査投稿
                                  <>
                                    {group.isAdmin && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setSelectedPost({...post, mode: 'results'})}
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          {t.viewResults}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setDeletingPost(post);
                                            setShowDeletePostConfirm(true);
                                          }}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4 mr-1" />
                                          {t.deletePost}
                                        </Button>
                                      </>
                                    )}
                                    <Button
                                      size="sm"
                                      onClick={() => setSelectedPost({...post, mode: 'respond'})}
                                    >
                                      <MessageSquare className="w-4 h-4 mr-1" />
                                      {t.respondToSurvey}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="members">
              <div className="grid gap-6 md:grid-cols-2">
                {/* グループ情報 */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.groupDetails}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="mb-2">{t.groupName}</h3>
                      <p className="text-gray-600">{group.name}</p>
                    </div>
                    {group.description && (
                      <div>
                        <h3 className="mb-2">{t.description}</h3>
                        <p className="text-gray-600">{group.description}</p>
                      </div>
                    )}
                    <div>
                      <h3 className="mb-2">{t.members}</h3>
                      <p className="text-gray-600">{members.length} {t.memberCount}</p>
                    </div>
                    {group.isAdmin && group.inviteCode && (
                      <div>
                        <h3 className="mb-2">{t.inviteCode}</h3>
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-3 py-2 rounded flex-1">{group.inviteCode}</code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyInviteCode(group.inviteCode)}
                          >
                            {copiedCode === group.inviteCode ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                {t.copied}
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1" />
                                {t.copy}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* メンバー一覧 */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.members}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-center py-4">{t.loading}</p>
                    ) : members.length === 0 ? (
                      <p className="text-gray-600 text-center py-4">No members found</p>
                    ) : (
                      <div className="space-y-3">
                        {members.map((member) => (
                          <div key={member.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p>{member.name || member.email}</p>
                              <p className="text-sm text-gray-600">{member.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={member.role === 'admin' ? "default" : "secondary"}>
                                {member.role === 'admin' ? t.admin : t.member}
                              </Badge>
                              {group.isAdmin && member.userId !== user?.id && member.role !== 'admin' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRemovingMember(member);
                                    setShowRemoveMemberConfirm(true);
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* メンバー削除確認ダイアログ */}
        {showRemoveMemberConfirm && removingMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-destructive">{t.removeMember}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="mb-2">{t.confirmRemoveMember}</p>
                  <div className="p-3 bg-gray-50 rounded border">
                    <p className="font-medium">{removingMember.name || removingMember.email}</p>
                    <p className="text-sm text-gray-600">{removingMember.email}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">{t.cannotUndoRemove}</p>
                <div className="flex gap-2">
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={removeMember}
                  >
                    {t.remove}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowRemoveMemberConfirm(false);
                      setRemovingMember(null);
                    }}
                  >
                    {t.cancel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* グループ削除確認ダイアログ */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-destructive">{t.deleteGroup}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6">{t.deleteGroupConfirm}</p>
                <div className="flex gap-2">
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={deleteGroup}
                    disabled={deleting}
                  >
                    {deleting ? t.loading : t.delete}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                  >
                    {t.cancel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 投稿削除確認ダイアログ */}
        {showDeletePostConfirm && deletingPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-destructive">{t.deletePostTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="mb-2">{t.confirmDeletePost}</p>
                  <div className="p-3 bg-gray-50 rounded border">
                    <p className="font-medium">
                      {getPostType(deletingPost) === 'shift_substitute_request' 
                        ? t.substituteRequest 
                        : getPostType(deletingPost) === 'shift_substitute_result'
                        ? '交代完了' 
                        : deletingPost.title}
                    </p>
                    {getPostType(deletingPost) === 'shift_result' ? (
                      <p className="text-sm text-gray-600">
                        {t.period}: {new Date(deletingPost.startDate).toLocaleDateString()} - {new Date(deletingPost.endDate).toLocaleDateString()}
                      </p>
                    ) : getPostType(deletingPost) === 'shift_substitute_request' ? (
                      <>
                        <p className="text-sm text-gray-600">
                          {t.shiftDate}: {deletingPost.date ? (() => {
                            try {
                              const date = new Date(deletingPost.date);
                              return isNaN(date.getTime()) ? deletingPost.date : date.toLocaleDateString('ja-JP');
                            } catch {
                              return deletingPost.date;
                            }
                          })() : 'Invalid Date'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t.shiftTime}: {deletingPost.startTime} - {deletingPost.endTime}
                        </p>
                      </>
                    ) : getPostType(deletingPost) === 'shift_substitute_result' ? (
                      <>
                        <p className="text-sm text-gray-600">
                          {t.shiftDate}: {deletingPost.date ? (() => {
                            try {
                              const date = new Date(deletingPost.date);
                              return isNaN(date.getTime()) ? deletingPost.date : date.toLocaleDateString('ja-JP');
                            } catch {
                              return deletingPost.date;
                            }
                          })() : 'Invalid Date'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t.shiftTime}: {deletingPost.startTime} - {deletingPost.endTime}
                        </p>
                        <p className="text-sm text-gray-600">
                          {deletingPost.originalRequesterName} → {deletingPost.substituteName}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600">
                        {t.surveyPeriodLabel}: {new Date(deletingPost.startDate).toLocaleDateString()} - {new Date(deletingPost.endDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">{t.cannotUndoAction}</p>
                <div className="flex gap-2">
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={deletePost}
                  >
                    {t.deleteConfirm}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowDeletePostConfirm(false);
                      setDeletingPost(null);
                    }}
                  >
                    {t.cancel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 投稿作成モーダル */}
        {showCreatePost && (
          <CreatePostModal
            onClose={() => setShowCreatePost(false)}
            onSubmit={createPost}
          />
        )}

        {/* 交代申請作成モーダル */}
        {showSubstituteRequest && (
          <ShiftSubstituteRequestModal
            onClose={() => setShowSubstituteRequest(false)}
            onSubmit={createPost}
            groupId={group.id}
          />
        )}

        {/* シフト希望入力モーダル */}
        {selectedPost && selectedPost.mode === 'respond' && (
          <ShiftResponseModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onSubmit={submitResponse}
          />
        )}

        {/* 調査結果表示モーダル */}
        {selectedPost && selectedPost.mode === 'results' && (
          <SurveyResultsModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            isAdmin={group.isAdmin}
            onMessage={(message) => {
              // メッセージを親コンポーネントに伝達
              if (typeof onGroupDeleted === 'function' && message) {
                onGroupDeleted(message);
              }
            }}
            onPostsUpdate={loadPosts}
          />
        )}

        {/* シフト結果投稿表示モーダル */}
        {selectedPost && selectedPost.mode === 'shift_result' && (
          <ShiftResultPost
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
          />
        )}

        {/* 交代申請詳細モーダル */}
        {selectedPost && selectedPost.mode === 'substitute_detail' && (
          <ShiftSubstituteDetailModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            currentUserId={user?.id}
            isAdmin={group.isAdmin}
            onDelete={(post) => {
              setDeletingPost(post);
              setShowDeletePostConfirm(true);
              setSelectedPost(null);
            }}
            onSubstitute={handleSubstitute}
          />
        )}

        {/* 交代結果詳細モーダル */}
        {selectedPost && selectedPost.mode === 'substitute_result' && (
          <ShiftSubstituteResultModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            currentUserId={user?.id}
            isAdmin={group.isAdmin}
            onDelete={(post) => {
              setDeletingPost(post);
              setShowDeletePostConfirm(true);
              setSelectedPost(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// ダッシュボード画面
const Dashboard = ({ user, onLogout }) => {
  const { t } = useLanguage();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [activeTab, setActiveTab] = useState('mypage');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      console.log('Loading groups...');
      
      // セッション確認（リトライ付き）
      let session = null;
      let retries = 3;
      
      while (retries > 0 && !session) {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error while loading groups:', error);
        }
        session = currentSession;
        
        if (!session && retries > 1) {
          console.log(`No session found, retrying... (${retries - 1} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        retries--;
      }
      
      if (!session) {
        console.error('No valid session found after retries');
        // セッションがない場合は空の配列を設定
        setGroups([]);
        return;
      }
      
      console.log('Loading groups for user:', session.user?.id);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/groups`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const result = await response.json();
      console.log('Groups API response:', result);
      
      if (response.ok) {
        setGroups(result.groups || []);
        console.log(`Successfully loaded ${result.groups?.length || 0} groups`);
      } else {
        console.error('Error response from groups API:', result);
        // APIエラーの場合でも空配列を設定してUIが表示されるようにする
        setGroups([]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      // エラーの場合でも空配列を設定
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.error('No valid session for group creation:', error);
        setMessage('Authentication error. Please refresh the page.');
        return;
      }
      
      console.log('Creating group with session:', session.user?.id);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/groups/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(groupForm)
      });

      const result = await response.json();
      console.log('Create group response:', result);
      
      if (response.ok) {
        setMessage(t.groupCreated);
        setGroupForm({ name: '', description: '' });
        setShowCreateGroup(false);
        loadGroups();
      } else {
        console.error('Group creation failed:', result);
        setMessage(result.error || 'Error creating group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setMessage('Error creating group');
    }
  };

  const joinGroup = async (e) => {
    e.preventDefault();
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.error('No valid session for group join:', error);
        setMessage('Authentication error. Please refresh the page.');
        return;
      }
      
      console.log('Joining group with session:', session.user?.id, 'Code:', joinCode);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d05b9024/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ inviteCode: joinCode })
      });

      const result = await response.json();
      console.log('Join group response:', result);
      
      if (response.ok) {
        setMessage(t.joinedGroup);
        setJoinCode('');
        setShowJoinGroup(false);
        loadGroups();
      } else {
        console.error('Group join failed:', result);
        setMessage(result.error || t.invalidCode);
      }
    } catch (error) {
      console.error('Error joining group:', error);
      setMessage('Error joining group');
    }
  };

  const copyInviteCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const openGroupDetails = (group) => {
    setSelectedGroup(group);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl">{t.loading}</div>
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <GroupDetails 
        group={selectedGroup} 
        user={user} 
        onBack={() => setSelectedGroup(null)}
        onGroupDeleted={(message) => {
          setMessage(message);
          setSelectedGroup(null);
          loadGroups();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl mb-2">{t.dashboard}</h1>
            <p className="text-gray-600">👋 {user?.user_metadata?.name || user?.email}</p>
          </div>
          <Button onClick={onLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            {t.logout}
          </Button>
        </div>

        {message && (
          <Alert className="mb-6">
            <AlertDescription>
              {message}
              {message.includes('Authentication error') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-4"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t.myGroups}
            </TabsTrigger>
            <TabsTrigger value="mypage" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t.myPage}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="groups">
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCreateGroup(true)}>
                <CardContent className="flex items-center p-6">
                  <Plus className="w-8 h-8 text-blue-600 mr-4" />
                  <div>
                    <h3 className="text-lg">{t.createGroup}</h3>
                    <p className="text-gray-600">Create a new group as admin</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowJoinGroup(true)}>
                <CardContent className="flex items-center p-6">
                  <UserPlus className="w-8 h-8 text-green-600 mr-4" />
                  <div>
                    <h3 className="text-lg">{t.joinGroup}</h3>
                    <p className="text-gray-600">Join an existing group</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t.myGroups}</CardTitle>
              </CardHeader>
              <CardContent>
                {groups.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No groups yet. Create or join one!</p>
                ) : (
                  <div className="space-y-4">
                    {groups.map((group) => (
                      <div 
                        key={group.id} 
                        className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => openGroupDetails(group)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg">{group.name}</h3>
                            {group.description && <p className="text-gray-600">{group.description}</p>}
                          </div>
                          <Badge variant={group.isAdmin ? "default" : "secondary"}>
                            {group.isAdmin ? t.admin : t.member}
                          </Badge>
                        </div>
                        {group.isAdmin && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                            <span className="text-sm text-gray-600">{t.inviteCode}:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{group.inviteCode}</code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyInviteCode(group.inviteCode);
                              }}
                            >
                              {copiedCode === group.inviteCode ? (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  {t.copied}
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-1" />
                                  {t.copy}
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mypage">
            <MyPage user={user} t={t} />
          </TabsContent>
        </Tabs>

        {/* グループ作成モーダル */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{t.createGroup}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createGroup} className="space-y-4">
                  <div>
                    <label className="block mb-2">{t.groupName}</label>
                    <Input
                      value={groupForm.name}
                      onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                      placeholder={t.groupName}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2">{t.description}</label>
                    <Input
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                      placeholder={t.description}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">{t.createGroup}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateGroup(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* グループ参加モーダル */}
        {showJoinGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{t.joinGroup}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={joinGroup} className="space-y-4">
                  <div>
                    <label className="block mb-2">{t.enterInviteCode}</label>
                    <Input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder={t.inviteCode}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">{t.joinGroup}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowJoinGroup(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [language, setLanguage] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        
        // セッション確認（リトライ機能付き）
        const getSessionWithRetry = async (): Promise<any> => {
          for (let i = 0; i < maxRetries; i++) {
            try {
              console.log(`Attempting to get session (attempt ${i + 1}/${maxRetries})`);
              const { data: { session }, error } = await supabase.auth.getSession();
              
              if (error) {
                console.error('Session error:', error);
                throw error;
              }
              
              console.log('Session retrieved:', session ? 'Found user session' : 'No session found');
              return session;
            } catch (error) {
              console.error(`Session attempt ${i + 1} failed:`, error);
              if (i === maxRetries - 1) throw error;
              
              // 短い遅延後にリトライ
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        };

        const session = await getSessionWithRetry();
        setUser(session?.user ?? null);
        setAuthInitialized(true);
        
        console.log('Authentication initialized:', session?.user ? 'User authenticated' : 'No user');
        
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
        // エラーが発生してもアプリは継続動作させる
        setUser(null);
        setAuthInitialized(true);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session ? 'User session exists' : 'No session');
      setUser(session?.user ?? null);
      
      // 初回の認証確認が完了していない場合は完了とマークする
      if (!authInitialized) {
        setAuthInitialized(true);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [authInitialized]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading || !authInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!language) {
    return <LanguageSelector onLanguageSelect={setLanguage} />;
  }

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      <div className="min-h-screen">
        {user ? (
          <Dashboard user={user} onLogout={handleLogout} />
        ) : (
          <AuthScreen />
        )}
      </div>
    </LanguageContext.Provider>
  );
}