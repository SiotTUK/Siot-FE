import { defineMessages } from '@/shared/i18n/define-messages'

export const notificationMessages = defineMessages({
  ko: {
    notifications: {
      title: '알림',
      empty: '아직 받은 알림이 없어요.',
      unread: '안 읽은 알림 {{count}}개',
      unreadMark: '안 읽음',
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
        note: 'Thông báo về hạn chót và thay đổi hiển thị trong danh sách này. Nếu đã xác minh email, chúng cũng được gửi đến email đã đăng ký.',
      },
    },
  },
})
