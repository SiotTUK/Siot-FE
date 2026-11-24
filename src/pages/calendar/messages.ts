import { defineMessages } from '@/shared/i18n/define-messages'

export const calendarMessages = defineMessages({
  ko: {
    calendar: {
      all: '전체 일정',
      previousMonth: '이전 달',
      nextMonth: '다음 달',
      dateWithSchedules: '{{date}}, 일정 {{count}}개',
      filter: '일정 날짜',
      emptyMonth: '이 달에는 예정된 일정이 없어요.',
      emptyDay: '이 날짜에는 일정이 없어요.',
      error: '일정을 불러오지 못했어요.',
      personal: '내 일정',
      highlighted: '확인 필요',
      period: '{{start}} ~ {{end}}',
    },
  },
  en: {
    calendar: {
      all: 'All schedules',
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
      dateWithSchedules: '{{date}}, schedules: {{count}}',
      filter: 'Schedule date',
      emptyMonth: 'There are no schedules for this month.',
      emptyDay: 'There are no schedules on this date.',
      error: 'Could not load the schedules.',
      personal: 'My schedule',
      highlighted: 'Needs attention',
      period: '{{start}} to {{end}}',
    },
  },
  zh: {
    calendar: {
      all: '全部日程',
      previousMonth: '上个月',
      nextMonth: '下个月',
      dateWithSchedules: '{{date}}，{{count}}项日程',
      filter: '日程日期',
      emptyMonth: '本月暂无日程。',
      emptyDay: '当天暂无日程。',
      error: '无法加载日程。',
      personal: '我的日程',
      highlighted: '请留意',
      period: '{{start}}至{{end}}',
    },
  },
  vi: {
    calendar: {
      all: 'Tất cả lịch',
      previousMonth: 'Tháng trước',
      nextMonth: 'Tháng sau',
      dateWithSchedules: '{{date}}, {{count}} lịch',
      filter: 'Ngày trong lịch',
      emptyMonth: 'Tháng này không có lịch.',
      emptyDay: 'Ngày này không có lịch.',
      error: 'Không tải được lịch.',
      personal: 'Lịch của tôi',
      highlighted: 'Cần lưu ý',
      period: '{{start}} đến {{end}}',
    },
  },
})
