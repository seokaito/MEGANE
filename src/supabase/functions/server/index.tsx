import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS設定
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger(console.log));

// Supabaseクライアント（管理者権限）
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ユーザー新規登録
app.post('/make-server-d05b9024/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // 自動的にメール確認済みとする（メールサーバーが設定されていないため）
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// グループ一覧取得
app.get('/make-server-d05b9024/groups', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    let userId = null;

    if (accessToken && accessToken !== Deno.env.get('SUPABASE_ANON_KEY')) {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return c.json({ groups: [] });
    }

    // ユーザーが所属するグループを取得
    const userGroups = await kv.getByPrefix(`user_groups:${userId}:`);
    const groups = [];

    for (const groupData of userGroups) {
      try {
        const groupInfo = JSON.parse(groupData);
        const groupId = groupInfo.groupId;
        
        // グループの詳細情報を取得
        const groupDetails = await kv.get(`group:${groupId}`);
        if (groupDetails) {
          const group = JSON.parse(groupDetails);
          groups.push({
            id: groupId,
            name: group.name,
            description: group.description,
            inviteCode: group.inviteCode,
            hourlyWage: group.hourlyWage || 0,
            isAdmin: groupInfo.role === 'admin'
          });
        }
      } catch (parseError) {
        console.log('Error parsing group data:', parseError);
      }
    }

    return c.json({ groups });
  } catch (error) {
    console.log('Error fetching groups:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// グループ作成
app.post('/make-server-d05b9024/groups/create', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, description } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Group name is required' }, 400);
    }

    // 6桁のランダムな招待コードを生成
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const groupId = crypto.randomUUID();

    // グループ情報を保存
    const groupData = {
      id: groupId,
      name,
      description: description || '',
      inviteCode,
      hourlyWage: 0,
      createdBy: user.id,
      createdAt: new Date().toISOString()
    };

    await kv.set(`group:${groupId}`, JSON.stringify(groupData));
    await kv.set(`invite:${inviteCode}`, groupId);

    // 作成者を管理者として追加
    const memberData = {
      groupId,
      role: 'admin',
      joinedAt: new Date().toISOString()
    };

    await kv.set(`user_groups:${user.id}:${groupId}`, JSON.stringify(memberData));
    // 新しいデータ構造も保存（メンバー検索の最適化のため）
    await kv.set(`group_members:${groupId}:${user.id}`, JSON.stringify({
      userId: user.id,
      role: 'admin',
      joinedAt: new Date().toISOString()
    }));

    return c.json({ 
      group: {
        id: groupId,
        name,
        description,
        inviteCode,
        hourlyWage: 0,
        isAdmin: true
      }
    });
  } catch (error) {
    console.log('Error creating group:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// グループ参加
app.post('/make-server-d05b9024/groups/join', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { inviteCode } = await c.req.json();

    if (!inviteCode) {
      return c.json({ error: 'Invite code is required' }, 400);
    }

    // 招待コードからグループIDを取得
    const groupId = await kv.get(`invite:${inviteCode.toUpperCase()}`);
    if (!groupId) {
      return c.json({ error: 'Invalid invite code' }, 400);
    }

    // 既に参加済みかチェック
    const existingMember = await kv.get(`user_groups:${user.id}:${groupId}`);
    if (existingMember) {
      return c.json({ error: 'Already a member of this group' }, 400);
    }

    // グループ情報を取得
    const groupData = await kv.get(`group:${groupId}`);
    if (!groupData) {
      return c.json({ error: 'Group not found' }, 404);
    }

    const group = JSON.parse(groupData);

    // メンバーとして追加
    const memberData = {
      groupId,
      role: 'member',
      joinedAt: new Date().toISOString()
    };

    await kv.set(`user_groups:${user.id}:${groupId}`, JSON.stringify(memberData));
    // 新しいデータ構造も保存（メンバー検索の最適化のため）
    await kv.set(`group_members:${groupId}:${user.id}`, JSON.stringify({
      userId: user.id,
      role: 'member',
      joinedAt: new Date().toISOString()
    }));

    return c.json({ 
      group: {
        id: groupId,
        name: group.name,
        description: group.description,
        hourlyWage: group.hourlyWage || 0,
        isAdmin: false
      }
    });
  } catch (error) {
    console.log('Error joining group:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// グループ削除
app.delete('/make-server-d05b9024/groups/:groupId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');

    // グループ情報を取得
    const groupData = await kv.get(`group:${groupId}`);
    if (!groupData) {
      return c.json({ error: 'Group not found' }, 404);
    }

    const group = JSON.parse(groupData);

    // ユーザーがこのグループの作成者（管理者）かチェック
    if (group.createdBy !== user.id) {
      return c.json({ error: 'Only the group creator can delete this group' }, 403);
    }

    console.log(`Deleting group: ${groupId}`);

    // 1. グループのメンバー一覧を取得して全員のデータを削除
    const allMembersOld = await kv.getByPrefixWithKeys(`user_groups:`);
    const membersToDelete = [];
    const groupMembersToDelete = [];

    for (const memberData of allMembersOld) {
      try {
        const memberInfo = JSON.parse(memberData.value);
        if (memberInfo.groupId === groupId) {
          const userId = memberData.key.split(':')[1];
          membersToDelete.push(`user_groups:${userId}:${groupId}`);
          groupMembersToDelete.push(`group_members:${groupId}:${userId}`);
        }
      } catch (parseError) {
        console.log('Error parsing member data during deletion:', parseError);
      }
    }

    // 2. 新しいデータ構造のメンバーデータも削除
    const newMembersData = await kv.getByPrefixWithKeys(`group_members:${groupId}:`);
    for (const memberData of newMembersData) {
      groupMembersToDelete.push(memberData.key);
    }

    // 3. すべてのデータを削除
    const keysToDelete = [
      `group:${groupId}`,
      `invite:${group.inviteCode}`,
      ...membersToDelete,
      ...groupMembersToDelete
    ];

    console.log(`Deleting ${keysToDelete.length} keys for group ${groupId}`);
    
    if (keysToDelete.length > 0) {
      await kv.mdel(keysToDelete);
    }

    console.log(`Successfully deleted group: ${groupId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting group:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// グループからメンバーを削除
app.delete('/make-server-d05b9024/groups/:groupId/members/:userId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    const targetUserId = c.req.param('userId');

    // 管理者権限チェック
    const membershipCheck = await kv.get(`user_groups:${user.id}:${groupId}`);
    if (!membershipCheck) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    const membership = JSON.parse(membershipCheck);
    if (membership.role !== 'admin') {
      return c.json({ error: 'Only admins can remove members' }, 403);
    }

    // 自分自身は削除できない
    if (user.id === targetUserId) {
      return c.json({ error: 'Cannot remove yourself from the group' }, 400);
    }

    // 対象ユーザーがグループのメンバーかチェック
    const targetMembershipCheck = await kv.get(`user_groups:${targetUserId}:${groupId}`);
    if (!targetMembershipCheck) {
      return c.json({ error: 'User is not a member of this group' }, 404);
    }

    console.log(`Removing user ${targetUserId} from group ${groupId}`);

    // ユーザーのグループメンバーシップデータを削除
    const keysToDelete = [
      `user_groups:${targetUserId}:${groupId}`,
      `group_members:${groupId}:${targetUserId}`
    ];

    await kv.mdel(keysToDelete);
    console.log(`Successfully removed user ${targetUserId} from group ${groupId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error removing group member:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// グループメンバー一覧取得
app.get('/make-server-d05b9024/groups/:groupId/members', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');

    // ユーザーがこのグループのメンバーかチェック
    const membershipCheck = await kv.get(`user_groups:${user.id}:${groupId}`);
    if (!membershipCheck) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    // グループのメンバー一覧を取得
    console.log(`Fetching members for group: ${groupId}`);
    const groupMembersData = await kv.getByPrefix(`group_members:${groupId}:`);
    console.log(`Found ${groupMembersData.length} members in new structure`);
    const members = [];

    // 古いデータ構造との互換性のため、両方をチェック
    if (groupMembersData.length === 0) {
      console.log('Falling back to old data structure');
      // フォールバック: 古いデータ構造から検索
      const allUserGroups = await kv.getByPrefixWithKeys(`user_groups:`);
      console.log(`Found ${allUserGroups.length} user group records`);
      
      for (const userData of allUserGroups) {
        try {
          const memberInfo = JSON.parse(userData.value);
          console.log(`Checking member info:`, memberInfo);
          if (memberInfo.groupId === groupId) {
            const userId = userData.key.split(':')[1];
            console.log(`Found member for group ${groupId}: ${userId}`);
            const { data: userDetails, error: userError } = await supabase.auth.admin.getUserById(userId);
            
            if (userDetails && userDetails.user) {
              members.push({
                userId: userId,
                email: userDetails.user.email,
                name: userDetails.user.user_metadata?.name,
                role: memberInfo.role,
                joinedAt: memberInfo.joinedAt
              });
            } else if (userError) {
              console.log(`Error getting user details for ${userId}:`, userError);
            }
          }
        } catch (parseError) {
          console.log('Error parsing user group data:', parseError);
        }
      }
    } else {
      console.log('Using new data structure');
      // 新しいデータ構造から取得
      for (const memberData of groupMembersData) {
        try {
          const memberInfo = JSON.parse(memberData);
          console.log(`Processing member info:`, memberInfo);
          const { data: userDetails, error: userError } = await supabase.auth.admin.getUserById(memberInfo.userId);
          
          if (userDetails && userDetails.user) {
            members.push({
              userId: memberInfo.userId,
              email: userDetails.user.email,
              name: userDetails.user.user_metadata?.name,
              role: memberInfo.role,
              joinedAt: memberInfo.joinedAt
            });
          } else if (userError) {
            console.log(`Error getting user details for ${memberInfo.userId}:`, userError);
          }
        } catch (parseError) {
          console.log('Error parsing group member data:', parseError);
        }
      }
    }
    
    console.log(`Final members count: ${members.length}`);
    members.forEach(member => console.log(`Member: ${member.name || member.email} (${member.role})`));

    // 管理者を先頭に、その後は参加日順でソート
    members.sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      return new Date(a.joinedAt) - new Date(b.joinedAt);
    });

    return c.json({ members });
  } catch (error) {
    console.log('Error fetching group members:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// シフト調査投稿作成
app.post('/make-server-d05b9024/groups/:groupId/posts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    
    const requestData = await c.req.json();
    
    // ユーザーがこのグループのメンバーかチェック
    const membershipCheck = await kv.get(`user_groups:${user.id}:${groupId}`);
    if (!membershipCheck) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }
    
    const membership = JSON.parse(membershipCheck);
    
    // 交代申請は全メンバーが作成可能、その他の投稿は管理者のみ
    if (requestData.type !== 'shift_substitute_request' && membership.role !== 'admin') {
      return c.json({ error: 'Only admins can create posts' }, 403);
    }
    const { type } = requestData;

    let postData;
    const postId = crypto.randomUUID();

    if (type === 'shift_substitute_request') {
      // 交代申請投稿
      const { date, startTime, endTime, reason } = requestData;
      console.log('Creating substitute request with data:', { date, startTime, endTime, reason });

      if (!date || !startTime || !endTime || !reason) {
        return c.json({ error: 'All fields are required' }, 400);
      }

      // ユーザー情報を取得
      const { data: userDetails } = await supabase.auth.admin.getUserById(user.id);
      console.log('User details for substitute request:', userDetails?.user?.user_metadata);
      
      postData = {
        id: postId,
        groupId,
        type: 'shift_substitute_request',
        date,
        startTime,
        endTime,
        reason,
        authorName: userDetails?.user?.user_metadata?.name,
        authorEmail: userDetails?.user?.email,
        createdBy: user.id,
        createdAt: new Date().toISOString()
      };
    } else {
      // 通常のシフト調査投稿
      const { title, startDate, endDate, deadline, openingTime, closingTime } = requestData;

      if (!title || !startDate || !endDate || !deadline || !openingTime || !closingTime) {
        return c.json({ error: 'All fields are required' }, 400);
      }

      postData = {
        id: postId,
        groupId,
        title,
        type: 'shift_survey',
        startDate,
        endDate,
        deadline,
        openingTime,
        closingTime,
        createdBy: user.id,
        createdAt: new Date().toISOString()
      };
    }

    console.log('Saving post data:', postData);
    await kv.set(`post:${postId}`, JSON.stringify(postData));
    await kv.set(`group_posts:${groupId}:${postId}`, JSON.stringify(postData));
    console.log('Post saved successfully with ID:', postId);

    return c.json({ post: postData });
  } catch (error) {
    console.log('Error creating post:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// グループの投稿一覧取得
app.get('/make-server-d05b9024/groups/:groupId/posts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    
    // ユーザーがこのグループのメンバーかチェック
    const membershipCheck = await kv.get(`user_groups:${user.id}:${groupId}`);
    if (!membershipCheck) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    const postsData = await kv.getByPrefix(`group_posts:${groupId}:`);
    console.log(`Found ${postsData.length} posts for group ${groupId}`);
    
    const posts = postsData.map(postJson => {
      const post = JSON.parse(postJson);
      console.log('Post data:', { id: post.id, type: post.type, date: post.date, createdBy: post.createdBy });
      return post;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return c.json({ posts });
  } catch (error) {
    console.log('Error fetching posts:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// シフト希望提出
app.post('/make-server-d05b9024/posts/:postId/responses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const postId = c.req.param('postId');
    const { shiftPreferences } = await c.req.json();

    if (!shiftPreferences || !Array.isArray(shiftPreferences)) {
      return c.json({ error: 'Invalid shift preferences' }, 400);
    }

    // 投稿の詳細を取得してグループメンバーかチェック
    const postData = await kv.get(`post:${postId}`);
    if (!postData) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const post = JSON.parse(postData);
    const membershipCheck = await kv.get(`user_groups:${user.id}:${post.groupId}`);
    if (!membershipCheck) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    const responseData = {
      postId,
      userId: user.id,
      shiftPreferences,
      submittedAt: new Date().toISOString()
    };

    await kv.set(`response:${postId}:${user.id}`, JSON.stringify(responseData));

    return c.json({ response: responseData });
  } catch (error) {
    console.log('Error submitting response:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 調査結果取得
app.get('/make-server-d05b9024/posts/:postId/responses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const postId = c.req.param('postId');

    // 投稿の詳細を取得
    const postData = await kv.get(`post:${postId}`);
    if (!postData) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const post = JSON.parse(postData);
    
    // ユーザーがこのグループの管理者かチェック
    const membershipCheck = await kv.get(`user_groups:${user.id}:${post.groupId}`);
    if (!membershipCheck) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    const membership = JSON.parse(membershipCheck);
    if (membership.role !== 'admin') {
      return c.json({ error: 'Only admins can view responses' }, 403);
    }

    // レスポンス一覧を取得
    const responsesData = await kv.getByPrefix(`response:${postId}:`);
    const responses = [];

    for (const responseJson of responsesData) {
      const response = JSON.parse(responseJson);
      const { data: userDetails } = await supabase.auth.admin.getUserById(response.userId);
      
      if (userDetails && userDetails.user) {
        responses.push({
          ...response,
          userName: userDetails.user.user_metadata?.name || userDetails.user.email,
          userEmail: userDetails.user.email
        });
      }
    }

    return c.json({ responses });
  } catch (error) {
    console.log('Error fetching responses:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// シフト採用・投稿
app.post('/make-server-d05b9024/posts/:postId/publish-shifts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const postId = c.req.param('postId');
    const { assignments } = await c.req.json();

    if (!assignments || !Array.isArray(assignments)) {
      return c.json({ error: 'Invalid assignments data' }, 400);
    }

    // 投稿の詳細を取得
    const postData = await kv.get(`post:${postId}`);
    if (!postData) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const post = JSON.parse(postData);
    
    // ユーザーがこのグループの管理者かチェック
    const membershipCheck = await kv.get(`user_groups:${user.id}:${post.groupId}`);
    if (!membershipCheck) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    const membership = JSON.parse(membershipCheck);
    if (membership.role !== 'admin') {
      return c.json({ error: 'Only admins can publish shifts' }, 403);
    }

    // 既存の採用シフトを削除（更新のため）
    const existingShifts = await kv.getByPrefixWithKeys(`published_shifts:${postId}:`);
    if (existingShifts.length > 0) {
      const keysToDelete = existingShifts.map(item => item.key);
      await kv.mdel(keysToDelete);
    }

    // 新しい採用シフトを保存
    const publishedShifts = [];
    console.log(`Publishing ${assignments.length} day assignments for post ${postId}`);
    
    for (const dayAssignment of assignments) {
      console.log(`Processing day ${dayAssignment.date} with ${dayAssignment.shifts.length} shifts`);
      
      for (const shift of dayAssignment.shifts) {
        const shiftId = crypto.randomUUID();
        const shiftData = {
          id: shiftId,
          postId,
          groupId: post.groupId,
          date: dayAssignment.date,
          userId: shift.userId,
          userName: shift.userName,
          userEmail: shift.userEmail,
          startTime: shift.startTime,
          endTime: shift.endTime,
          publishedBy: user.id,
          publishedAt: new Date().toISOString()
        };

        console.log(`Saving shift: ${shift.userId} on ${dayAssignment.date} ${shift.startTime}-${shift.endTime}`);
        await kv.set(`published_shifts:${postId}:${shiftId}`, JSON.stringify(shiftData));
        publishedShifts.push(shiftData);
      }
    }
    
    console.log(`Successfully published ${publishedShifts.length} shifts`);

    // 投稿の状態を「採用済み」に更新
    const updatedPost = {
      ...post,
      status: 'published',
      publishedAt: new Date().toISOString(),
      publishedBy: user.id
    };

    await kv.set(`post:${postId}`, JSON.stringify(updatedPost));
    await kv.set(`group_posts:${post.groupId}:${postId}`, JSON.stringify(updatedPost));

    // シフト結果投稿を作成
    const resultPostId = crypto.randomUUID();
    const resultPostData = {
      id: resultPostId,
      groupId: post.groupId,
      title: `${post.title} - 採用結果`,
      type: 'shift_result',
      originalPostId: postId,
      startDate: post.startDate,
      endDate: post.endDate,
      totalShifts: publishedShifts.length,
      uniqueMembers: new Set(publishedShifts.map(s => s.userId)).size,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    };

    await kv.set(`post:${resultPostId}`, JSON.stringify(resultPostData));
    await kv.set(`group_posts:${post.groupId}:${resultPostId}`, JSON.stringify(resultPostData));

    console.log(`Shift publishing completed successfully:`, {
      originalPostId: postId,
      resultPostId: resultPostId,
      shiftsPublished: publishedShifts.length,
      assignments: assignments.length
    });

    return c.json({ 
      success: true, 
      shiftsCount: publishedShifts.length,
      resultPostId: resultPostId,
      message: 'Shifts published successfully',
      publishedShifts: publishedShifts.map(s => ({
        id: s.id,
        date: s.date,
        userId: s.userId,
        userName: s.userName,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    });
  } catch (error) {
    console.log('Error publishing shifts:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 採用されたシフト取得
app.get('/make-server-d05b9024/posts/:postId/published-shifts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const postId = c.req.param('postId');

    // 投稿の詳細を取得
    const postData = await kv.get(`post:${postId}`);
    if (!postData) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const post = JSON.parse(postData);
    
    // ユーザーがこのグループのメンバーかチェック
    const membershipCheck = await kv.get(`user_groups:${user.id}:${post.groupId}`);
    if (!membershipCheck) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    // 採用されたシフト一覧を取得
    const shiftsData = await kv.getByPrefix(`published_shifts:${postId}:`);
    const shifts = shiftsData.map(shiftJson => JSON.parse(shiftJson))
      .sort((a, b) => {
        // 日付順、その後時間順でソート
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
        return a.startTime.localeCompare(b.startTime);
      });

    return c.json({ shifts });
  } catch (error) {
    console.log('Error fetching published shifts:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// アカウント統計情報取得（My Page用）
app.get('/make-server-d05b9024/account/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`Loading account stats for user: ${user.id}`);

    // ユーザーが所属するすべてのグループを取得
    const userGroups = await kv.getByPrefix(`user_groups:${user.id}:`);
    let totalGroups = 0;
    let adminGroups = 0;
    let totalShifts = 0;
    let thisMonthShifts = 0;

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(currentMonth.getMonth() + 1);

    for (const groupData of userGroups) {
      try {
        const groupInfo = JSON.parse(groupData);
        totalGroups++;
        
        if (groupInfo.role === 'admin') {
          adminGroups++;
        }

        const groupId = groupInfo.groupId;
        
        // このグループの全投稿を取得
        const postsData = await kv.getByPrefix(`group_posts:${groupId}:`);
        
        for (const postJson of postsData) {
          const post = JSON.parse(postJson);
          
          // この投稿の採用されたシフトを取得
          const shiftsData = await kv.getByPrefix(`published_shifts:${post.id}:`);
          
          for (const shiftJson of shiftsData) {
            const shift = JSON.parse(shiftJson);
            
            // 自分のシフトのみカウント
            if (shift.userId === user.id) {
              totalShifts++;
              
              // 今月のシフトかチェック
              const shiftDate = new Date(shift.date);
              if (shiftDate >= currentMonth && shiftDate < nextMonth) {
                thisMonthShifts++;
              }
            }
          }
        }
      } catch (parseError) {
        console.log('Error parsing group data for stats:', parseError);
      }
    }

    const stats = {
      totalGroups,
      adminGroups,
      totalShifts,
      thisMonthShifts
    };

    console.log(`Account stats for user ${user.id}:`, stats);
    return c.json({ stats });
  } catch (error) {
    console.log('Error fetching account stats:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ユーザーのシフト一覧取得（My Page用）
app.get('/make-server-d05b9024/account/shifts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`Loading shifts for user: ${user.id}`);

    // ユーザーが所属するすべてのグループを取得
    const userGroups = await kv.getByPrefix(`user_groups:${user.id}:`);
    const myShifts = [];

    for (const groupData of userGroups) {
      try {
        const groupInfo = JSON.parse(groupData);
        const groupId = groupInfo.groupId;
        
        // グループの詳細情報を取得
        const groupDetails = await kv.get(`group:${groupId}`);
        if (!groupDetails) continue;
        
        const group = JSON.parse(groupDetails);
        console.log(`Checking shifts for group: ${group.name} (${groupId})`);

        // このグループの全投稿を取得
        const postsData = await kv.getByPrefix(`group_posts:${groupId}:`);
        
        for (const postJson of postsData) {
          const post = JSON.parse(postJson);
          
          // この投稿の採用されたシフトを取得
          const shiftsData = await kv.getByPrefix(`published_shifts:${post.id}:`);
          
          for (const shiftJson of shiftsData) {
            const shift = JSON.parse(shiftJson);
            
            // 自分のシフトのみ抽出
            if (shift.userId === user.id) {
              myShifts.push({
                id: shift.id,
                date: shift.date,
                startTime: shift.startTime,
                endTime: shift.endTime,
                groupId: groupId,
                groupName: group.name,
                postTitle: post.title,
                postId: post.id
              });
            }
          }
        }
      } catch (parseError) {
        console.log('Error parsing group data for shifts:', parseError);
      }
    }

    console.log(`Found ${myShifts.length} shifts for user ${user.id}`);

    // 日付順でソート
    myShifts.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return a.startTime.localeCompare(b.startTime);
    });

    return c.json({ shifts: myShifts });
  } catch (error) {
    console.log('Error fetching user shifts:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ユーザーの全シフト取得（My Page用 - 互換性のため残す）
app.get('/make-server-d05b9024/my-shifts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`Loading shifts for user: ${user.id}`);

    // ユーザーが所属するすべてのグループを取得
    const userGroups = await kv.getByPrefix(`user_groups:${user.id}:`);
    const myShifts = [];

    for (const groupData of userGroups) {
      try {
        const groupInfo = JSON.parse(groupData);
        const groupId = groupInfo.groupId;
        
        // グループの詳細情報を取得
        const groupDetails = await kv.get(`group:${groupId}`);
        if (!groupDetails) continue;
        
        const group = JSON.parse(groupDetails);
        console.log(`Checking shifts for group: ${group.name} (${groupId})`);

        // このグループの全投稿を取得
        const postsData = await kv.getByPrefix(`group_posts:${groupId}:`);
        
        for (const postJson of postsData) {
          const post = JSON.parse(postJson);
          
          // この投稿の採用されたシフトを取得
          const shiftsData = await kv.getByPrefix(`published_shifts:${post.id}:`);
          
          for (const shiftJson of shiftsData) {
            const shift = JSON.parse(shiftJson);
            
            // 自分のシフトのみ抽出
            if (shift.userId === user.id) {
              myShifts.push({
                id: shift.id,
                date: shift.date,
                startTime: shift.startTime,
                endTime: shift.endTime,
                groupId: groupId,
                groupName: group.name,
                postTitle: post.title,
                postId: post.id
              });
            }
          }
        }
      } catch (parseError) {
        console.log('Error parsing group data for shifts:', parseError);
      }
    }

    console.log(`Found ${myShifts.length} shifts for user ${user.id}`);

    // 日付順でソート
    myShifts.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return a.startTime.localeCompare(b.startTime);
    });

    return c.json({ shifts: myShifts });
  } catch (error) {
    console.log('Error fetching user shifts:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ユーザーのシフト一覧取得（特定グループ用）
app.get('/make-server-d05b9024/user/shifts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.query('groupId');
    console.log(`Loading shifts for user: ${user.id}, group: ${groupId || 'all'}`);

    // ユーザーが所属するすべてのグループを取得
    const userGroups = await kv.getByPrefix(`user_groups:${user.id}:`);
    const myShifts = [];

    for (const groupData of userGroups) {
      try {
        const groupInfo = JSON.parse(groupData);
        const currentGroupId = groupInfo.groupId;
        
        // 特定のグループが指定されている場合はそのグループのみ処理
        if (groupId && currentGroupId !== groupId) {
          continue;
        }
        
        // グループの詳細情報を取得
        const groupDetails = await kv.get(`group:${currentGroupId}`);
        if (!groupDetails) continue;
        
        const group = JSON.parse(groupDetails);
        console.log(`Checking shifts for group: ${group.name} (${currentGroupId})`);

        // このグループの全投稿を取得
        const postsData = await kv.getByPrefix(`group_posts:${currentGroupId}:`);
        
        for (const postJson of postsData) {
          const post = JSON.parse(postJson);
          
          // この投稿の採用されたシフトを取得
          const shiftsData = await kv.getByPrefix(`published_shifts:${post.id}:`);
          
          for (const shiftJson of shiftsData) {
            const shift = JSON.parse(shiftJson);
            
            // 自分のシフトのみ抽出
            if (shift.userId === user.id) {
              myShifts.push({
                id: shift.id,
                date: shift.date,
                startTime: shift.startTime,
                endTime: shift.endTime,
                groupId: currentGroupId,
                groupName: group.name,
                postTitle: post.title,
                postId: post.id
              });
            }
          }
        }
      } catch (parseError) {
        console.log('Error parsing group data for shifts:', parseError);
      }
    }

    console.log(`Found ${myShifts.length} shifts for user ${user.id}`);

    // 日付順でソート
    myShifts.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return a.startTime.localeCompare(b.startTime);
    });

    return c.json({ shifts: myShifts });
  } catch (error) {
    console.log('Error fetching user shifts:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 投稿削除
app.delete('/make-server-d05b9024/posts/:postId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const postId = c.req.param('postId');
    console.log(`Attempting to delete post: ${postId} by user: ${user.id}`);

    // 投稿の詳細を取得
    const postData = await kv.get(`post:${postId}`);
    console.log(`Post data found: ${!!postData}`);
    if (!postData) {
      console.log(`Post not found with key: post:${postId}`);
      return c.json({ error: 'Post not found' }, 404);
    }

    const post = JSON.parse(postData);
    
    // ユーザーがこのグループの管理者かチェック
    const membershipCheck = await kv.get(`user_groups:${user.id}:${post.groupId}`);
    if (!membershipCheck) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    const membership = JSON.parse(membershipCheck);
    
    // 投稿者本人または管理者のみ削除可能
    const canDelete = membership.role === 'admin' || post.createdBy === user.id;
    if (!canDelete) {
      return c.json({ error: 'Only admins or post creators can delete posts' }, 403);
    }

    console.log(`Deleting post: ${postId}`);

    // 削除するキーのリストを準備
    const keysToDelete = [
      `post:${postId}`,
      `group_posts:${post.groupId}:${postId}`
    ];

    // この投稿に関連するレスポンスを削除
    const responsesData = await kv.getByPrefixWithKeys(`response:${postId}:`);
    for (const responseData of responsesData) {
      keysToDelete.push(responseData.key);
    }

    // この投稿に関連する採用シフトを削除
    const shiftsData = await kv.getByPrefixWithKeys(`published_shifts:${postId}:`);
    for (const shiftData of shiftsData) {
      keysToDelete.push(shiftData.key);
    }

    // もしこの投稿がシフト調査投稿で、結果投稿が存在する場合は結果投稿も削除
    if (post.type === 'shift_survey' || !post.type) {
      // 関連する結果投稿を検索
      const allGroupPosts = await kv.getByPrefixWithKeys(`group_posts:${post.groupId}:`);
      for (const groupPostData of allGroupPosts) {
        try {
          const groupPost = JSON.parse(groupPostData.value);
          if (groupPost.type === 'shift_result' && groupPost.originalPostId === postId) {
            // 結果投稿も削除
            keysToDelete.push(`post:${groupPost.id}`);
            keysToDelete.push(groupPostData.key);
            console.log(`Also deleting related result post: ${groupPost.id}`);
          }
        } catch (parseError) {
          console.log('Error parsing group post during deletion:', parseError);
        }
      }
    }

    // 一括削除実行
    console.log(`Deleting ${keysToDelete.length} keys for post ${postId}:`, keysToDelete);
    
    if (keysToDelete.length > 0) {
      try {
        await kv.mdel(keysToDelete);
        console.log(`Successfully deleted ${keysToDelete.length} keys`);
      } catch (deleteError) {
        console.error('Error during key deletion:', deleteError);
        return c.json({ error: 'Failed to delete post data' }, 500);
      }
    }

    console.log(`Successfully deleted post: ${postId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting post:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 交代申請に対する交代処理
app.post('/make-server-d05b9024/posts/:postId/substitute', async (c) => {
  const postId = c.req.param('postId');
  
  try {
    console.log('Processing substitute request for post:', postId);
    
    // 認証チェック
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 交代者のユーザー情報を取得
    const { data: substituteUserDetails } = await supabase.auth.admin.getUserById(user.id);

    // 交代申請投稿を取得
    const postData = await kv.get(`post:${postId}`);
    if (!postData) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const post = JSON.parse(postData);
    
    // 交代申請投稿でない場合はエラー
    if (post.type !== 'shift_substitute_request') {
      return c.json({ error: 'This is not a substitute request' }, 400);
    }

    // 自分の投稿に交代申請はできない
    if (post.createdBy === user.id) {
      return c.json({ error: 'Cannot substitute your own shift' }, 400);
    }

    // グループメンバーシップをチェック
    const membershipData = await kv.get(`user_groups:${user.id}:${post.groupId}`);
    if (!membershipData) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    // 実際のシフト表で該当するシフトを検索して更新
    let updatedShift = null;
    const allGroupPosts = await kv.getByPrefix(`group_posts:${post.groupId}:`);
    
    for (const groupPostJson of allGroupPosts) {
      const groupPost = JSON.parse(groupPostJson);
      
      // 採用されたシフトがある投稿を検索
      if (groupPost.status === 'published') {
        const shiftsData = await kv.getByPrefixWithKeys(`published_shifts:${groupPost.id}:`);
        
        for (const shiftData of shiftsData) {
          const shift = JSON.parse(shiftData.value);
          
          // 交代申請の対象シフトを見つける（日付、時間、元の担当者が一致）
          if (shift.date === post.date && 
              shift.startTime === post.startTime && 
              shift.endTime === post.endTime && 
              shift.userId === post.createdBy) {
            
            console.log('Found matching shift to update:', shift);
            
            // シフトの担当者を交代者に変更
            const updatedShiftData = {
              ...shift,
              userId: user.id,
              userName: substituteUserDetails?.user?.user_metadata?.name || substituteUserDetails?.user?.email,
              userEmail: substituteUserDetails?.user?.email,
              substitutedFrom: shift.userId,
              substitutedFromName: shift.userName,
              substitutedAt: new Date().toISOString()
            };
            
            // 更新されたシフトを保存
            await kv.set(shiftData.key, JSON.stringify(updatedShiftData));
            updatedShift = updatedShiftData;
            console.log('Updated shift data:', updatedShiftData);
            break;
          }
        }
        
        if (updatedShift) break;
      }
    }

    // 交代結果投稿を作成
    const resultPostId = crypto.randomUUID();
    const resultPost = {
      id: resultPostId,
      groupId: post.groupId,
      type: 'shift_substitute_result',
      title: `交代完了: ${new Date(post.date).toLocaleDateString('ja-JP')}`,
      originalPostId: postId,
      originalRequesterName: post.authorName || post.authorEmail,
      originalRequesterId: post.createdBy,
      substituteName: substituteUserDetails?.user?.user_metadata?.name || substituteUserDetails?.user?.email,
      substituteId: user.id,
      date: post.date,
      startTime: post.startTime,
      endTime: post.endTime,
      reason: post.reason,
      shiftUpdated: !!updatedShift,
      createdBy: user.id,
      createdAt: new Date().toISOString()
    };

    // 結果投稿を保存
    await kv.set(`post:${resultPostId}`, JSON.stringify(resultPost));
    await kv.set(`group_posts:${post.groupId}:${resultPostId}`, JSON.stringify(resultPost));

    // 元の交代申請投稿を削除
    await kv.del(`post:${postId}`);
    await kv.del(`group_posts:${post.groupId}:${postId}`);

    console.log('Substitute process completed successfully');
    return c.json({ 
      success: true, 
      resultPost,
      message: 'Substitute completed successfully' 
    });
  } catch (error) {
    console.error('Error in substitute endpoint:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// グループの時給設定を更新
app.put('/make-server-d05b9024/groups/:groupId/hourly-wage', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    const { hourlyWage } = await c.req.json();

    // グループの存在確認
    const groupData = await kv.get(`group:${groupId}`);
    if (!groupData) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // 管理者権限確認
    const membershipData = await kv.get(`user_groups:${user.id}:${groupId}`);
    if (!membershipData) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    const membership = JSON.parse(membershipData);
    if (membership.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    // グループデータを更新
    const group = JSON.parse(groupData);
    group.hourlyWage = parseFloat(hourlyWage);
    
    await kv.set(`group:${groupId}`, JSON.stringify(group));

    return c.json({ success: true, hourlyWage: group.hourlyWage });
  } catch (error) {
    console.error('Error updating hourly wage:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ユーザーの月間給料統計を取得
app.get('/make-server-d05b9024/user/earnings', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const month = c.req.query('month'); // YYYY-MM format
    let targetMonth;
    
    if (month) {
      targetMonth = new Date(month + '-01');
    } else {
      // デフォルトは今月
      targetMonth = new Date();
      targetMonth.setDate(1);
    }
    
    targetMonth.setHours(0, 0, 0, 0);
    const nextMonth = new Date(targetMonth);
    nextMonth.setMonth(targetMonth.getMonth() + 1);

    console.log(`Calculating earnings for user ${user.id} for month ${targetMonth.toISOString()}`);

    // ユーザーの所属グループを取得
    const userGroupsData = await kv.getByPrefix(`user_groups:${user.id}:`);
    console.log(`Found ${userGroupsData.length} groups for user ${user.id}`);
    
    let totalEarnings = 0;
    let totalHours = 0;
    const groupEarnings = [];
    const debugInfo = {
      targetMonth: targetMonth.toISOString().slice(0, 7),
      groupsChecked: 0,
      postsChecked: 0,
      shiftsFound: 0,
      shiftsInMonth: 0
    };

    for (const groupData of userGroupsData) {
      try {
        const groupInfo = JSON.parse(groupData);
        const groupId = groupInfo.groupId;
        debugInfo.groupsChecked++;
        
        console.log(`Processing group ${groupId}`);
        
        // グループ情報と時給を取得
        const groupDetailsData = await kv.get(`group:${groupId}`);
        if (!groupDetailsData) {
          console.log(`Group details not found for ${groupId}`);
          continue;
        }
        
        const groupDetails = JSON.parse(groupDetailsData);
        const hourlyWage = groupDetails.hourlyWage || 0;
        console.log(`Group ${groupDetails.name} hourly wage: ${hourlyWage}`);
        
        let groupHours = 0;
        let groupShiftsCount = 0;
        
        // このグループの全投稿を取得
        const postsData = await kv.getByPrefix(`group_posts:${groupId}:`);
        console.log(`Found ${postsData.length} posts for group ${groupId}`);
        debugInfo.postsChecked += postsData.length;
        
        for (const postJson of postsData) {
          const post = JSON.parse(postJson);
          console.log(`Checking post ${post.id} (${post.title})`);
          
          // この投稿の採用されたシフトを取得
          const shiftsData = await kv.getByPrefix(`published_shifts:${post.id}:`);
          console.log(`Found ${shiftsData.length} shifts for post ${post.id}`);
          debugInfo.shiftsFound += shiftsData.length;
          
          for (const shiftJson of shiftsData) {
            const shift = JSON.parse(shiftJson);
            console.log(`Checking shift: ${shift.date} ${shift.startTime}-${shift.endTime} (user: ${shift.userId})`);
            
            // 自分のシフトで指定月のもののみカウント
            if (shift.userId === user.id) {
              const shiftDate = new Date(shift.date);
              console.log(`Found user shift on ${shift.date}, checking if in target month...`);
              
              if (shiftDate >= targetMonth && shiftDate < nextMonth) {
                debugInfo.shiftsInMonth++;
                groupShiftsCount++;
                console.log(`Shift is in target month! ${shift.startTime} - ${shift.endTime}`);
                
                // 開始時間と終了時間から勤務時間を計算
                const startTime = new Date(`2000-01-01T${shift.startTime}:00`);
                const endTime = new Date(`2000-01-01T${shift.endTime}:00`);
                
                // 日付をまたぐ場合の処理
                if (endTime < startTime) {
                  endTime.setDate(endTime.getDate() + 1);
                }
                
                const hours = (endTime - startTime) / (1000 * 60 * 60);
                console.log(`Calculated hours: ${hours}`);
                groupHours += hours;
              } else {
                console.log(`Shift date ${shiftDate.toISOString()} is outside target month`);
              }
            }
          }
        }
        
        const groupEarning = groupHours * hourlyWage;
        totalHours += groupHours;
        totalEarnings += groupEarning;
        
        console.log(`Group ${groupDetails.name} summary: ${groupHours} hours, ${groupShiftsCount} shifts, ${groupEarning} earnings`);
        
        if (groupHours > 0 || hourlyWage > 0) {
          groupEarnings.push({
            groupId,
            groupName: groupDetails.name,
            hours: groupHours,
            hourlyWage,
            earnings: groupEarning,
            shiftsCount: groupShiftsCount
          });
        }
        
      } catch (parseError) {
        console.log('Error parsing group data for earnings:', parseError);
      }
    }

    console.log(`Earnings calculation complete:`, {
      totalHours,
      totalEarnings,
      groupCount: groupEarnings.length,
      debugInfo
    });

    return c.json({
      month: targetMonth.toISOString().slice(0, 7), // YYYY-MM
      totalEarnings,
      totalHours,
      groupEarnings,
      debugInfo
    });
  } catch (error) {
    console.error('Error calculating earnings:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

Deno.serve(app.fetch);