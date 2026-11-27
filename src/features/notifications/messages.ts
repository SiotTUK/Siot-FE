import { defineMessages } from '@/shared/i18n/define-messages'

export const notificationMessages = defineMessages({
  ko: {
    notifications: {
      title: '알림',
      empty: '아직 받은 알림이 없어요.',
      unread: '안 읽은 알림 {{count}}개',
      unreadMark: '안 읽음',
      tip: '마감이 다가오면 해로가 알림 목록과 이메일로 알려 줄게요',
      emptyTitle: '아직 알림이 없어요',
      emptyDescription: '마감이 다가오거나 행사가 바뀌면 해로가 알려 줄게요',
      settingsLink: '설정',
      readFailed:
        '알림을 읽음으로 바꾸지 못해 이동하지 않았어요. 다시 눌러 주세요.',
      today: '오늘',
      yesterday: '어제',
      groups: {
        deadline: '생활 마감',
        event: '행사',
        notice: '안내 변경',
        other: '알림',
      },
      settings: {
        title: '알림 설정',
        deadline: '생활 마감 (세금·체류 연장)',
        notice: '안내 내용 변경',
        partial: '일부 알림만 켜져 있어요. 켜면 모두 받아요.',
        note: '기한·변경 알림은 알림 목록에 보여요. 이메일 인증을 했다면 가입한 이메일로도 보내요.',
      },
    },
  },
  en: {
    notifications: {
      title: 'Notifications',
      empty: 'No notifications yet.',
      unread: 'Unread: {{count}}',
      unreadMark: 'Unread',
      tip: 'When a deadline gets close, Haero tells you here and by email',
      emptyTitle: 'No notifications yet',
      emptyDescription:
        'Haero will tell you when a deadline is near or an event changes',
      settingsLink: 'Settings',
      readFailed:
        'Could not mark this notification as read, so it did not open. Tap it again.',
      today: 'Today',
      yesterday: 'Yesterday',
      groups: {
        deadline: 'Deadline',
        event: 'Event',
        notice: 'Guide update',
        other: 'Notice',
      },
      settings: {
        title: 'Notification settings',
        deadline: 'Deadlines (taxes, stay extension)',
        notice: 'Guide changes',
        partial: 'Only some of these are on. Turn on to get them all.',
        note: 'Deadline and change notifications appear in this list. If your e-mail is verified, they are also sent to it.',
      },
    },
  },
  zh: {
    notifications: {
      title: '通知',
      empty: '还没有收到通知。',
      unread: '未读通知 {{count}}条',
      unreadMark: '未读',
      tip: '截止日期临近时，Haero 会通过通知列表和邮件告诉你',
      emptyTitle: '还没有通知',
      emptyDescription: '截止日期临近或活动有变化时，Haero 会告诉你',
      settingsLink: '设置',
      readFailed: '未能将通知标为已读，因此没有打开。请再点一次。',
      today: '今天',
      yesterday: '昨天',
      groups: {
        deadline: '生活截止',
        event: '活动',
        notice: '指南变更',
        other: '通知',
      },
      settings: {
        title: '通知设置',
        deadline: '生活截止（税金·延长居留）',
        notice: '指南内容变更',
        partial: '只开启了部分通知。打开后将全部接收。',
        note: '截止和变更通知会显示在通知列表中。如已验证邮箱，也会发送到注册邮箱。',
      },
    },
  },
  vi: {
    notifications: {
      title: 'Thông báo',
      empty: 'Chưa có thông báo nào.',
      unread: 'Chưa đọc: {{count}}',
      unreadMark: 'Chưa đọc',
      tip: 'Khi gần đến hạn, Haero sẽ báo trong danh sách thông báo và qua email',
      emptyTitle: 'Chưa có thông báo',
      emptyDescription: 'Haero sẽ báo khi gần đến hạn hoặc sự kiện thay đổi',
      settingsLink: 'Cài đặt',
      readFailed:
        'Không thể đánh dấu đã đọc nên chưa mở thông báo. Vui lòng nhấn lại.',
      today: 'Hôm nay',
      yesterday: 'Hôm qua',
      groups: {
        deadline: 'Hạn chót',
        event: 'Sự kiện',
        notice: 'Cập nhật hướng dẫn',
        other: 'Thông báo',
      },
      settings: {
        title: 'Cài đặt thông báo',
        deadline: 'Hạn chót (thuế, gia hạn lưu trú)',
        notice: 'Thay đổi nội dung hướng dẫn',
        partial: 'Chỉ một số thông báo đang bật. Bật để nhận tất cả.',
        note: 'Thông báo về hạn chót và thay đổi hiển thị trong danh sách này. Nếu đã xác minh email, chúng cũng được gửi đến email đã đăng ký.',
      },
    },
  },
})
