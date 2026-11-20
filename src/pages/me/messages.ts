import { defineMessages } from '@/shared/i18n/define-messages'

export const meMessages = defineMessages({
  ko: {
    me: {
      title: '내 정보',
      email: '이메일',
      language: '언어',
      situation: '나의 상황',
      purpose: '체류 목적',
      entryDate: '입국일',
      stayExpiry: '체류 만료일',
      residences: '거주 정보',
      edit: '{{label}} 바꾸기',
      save: '저장',
      clearDate: '날짜 지우기',
      editNotice:
        '바꾸면 나에게 맞는 할 일이 다시 계산돼요. 완료 기록은 그대로 남아요.',
    },
  },
  en: {
    me: {
      title: 'My info',
      email: 'Email',
      language: 'Language',
      situation: 'My situation',
      purpose: 'Purpose of stay',
      entryDate: 'Arrival date',
      stayExpiry: 'Stay expiry date',
      residences: 'Living details',
      edit: 'Change {{label}}',
      save: 'Save',
      clearDate: 'Clear date',
      editNotice:
        'Your to-dos will be recalculated. Items you completed stay completed.',
    },
  },
  zh: {
    me: {
      title: '我的信息',
      email: '电子邮箱',
      language: '语言',
      situation: '我的情况',
      purpose: '滞留目的',
      entryDate: '入境日期',
      stayExpiry: '滞留到期日',
      residences: '居住信息',
      edit: '修改{{label}}',
      save: '保存',
      clearDate: '清除日期',
      editNotice: '修改后会重新计算适合您的待办事项。已完成的记录会保留。',
    },
  },
  vi: {
    me: {
      title: 'Thông tin của tôi',
      email: 'Email',
      language: 'Ngôn ngữ',
      situation: 'Tình trạng của tôi',
      purpose: 'Mục đích lưu trú',
      entryDate: 'Ngày nhập cảnh',
      stayExpiry: 'Ngày hết hạn lưu trú',
      residences: 'Thông tin cư trú',
      edit: 'Đổi {{label}}',
      save: 'Lưu',
      clearDate: 'Xóa ngày',
      editNotice:
        'Việc cần làm sẽ được tính lại. Các mục đã hoàn thành vẫn được giữ.',
    },
  },
})
