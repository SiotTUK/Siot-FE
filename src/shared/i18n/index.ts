import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const languages = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  vi: 'Tiếng Việt',
} as const
const languageKey = 'siot:language'

function savedLanguage(): string {
  try {
    const saved = localStorage.getItem(languageKey)
    return saved && saved in languages ? saved : 'ko'
  } catch {
    return 'ko'
  }
}

void i18n.use(initReactI18next).init({
  lng: savedLanguage(),
  fallbackLng: 'ko',
  supportedLngs: Object.keys(languages),
  interpolation: { escapeValue: false },
  resources: {
    ko: {
      translation: {
        brand: '웰컴시흥',
        language: '언어',
        eyebrow: '시흥에서 시작하는 새로운 일상',
        title: '시흥 생활, 함께 시작해요',
        description:
          '정착에 필요한 준비부터 일상의 궁금증까지, 선택한 언어로 확인하세요.',
        checklist: '정착 체크리스트',
        checklistDescription: '등록과 신고에 필요한 준비를 확인해요.',
        calendar: '생활 달력',
        calendarDescription: '이번 달 할 일과 중요한 기한을 살펴봐요.',
        guide: '생활 안내',
        guideDescription: '생활수칙과 지역 행사 정보를 알아봐요.',
        notFound: '페이지를 찾을 수 없어요',
        home: '홈으로 돌아가기',
      },
    },
    en: {
      translation: {
        brand: 'Welcome Siheung',
        language: 'Language',
        eyebrow: 'A new everyday life in Siheung',
        title: 'Start your life in Siheung',
        description:
          'Find help with settling in and everyday questions in your language.',
        checklist: 'Settling-in checklist',
        checklistDescription: 'Get ready for registration and reporting.',
        calendar: 'Life calendar',
        calendarDescription:
          'Check this month’s tasks and important deadlines.',
        guide: 'Living guide',
        guideDescription: 'Explore local guidance and community events.',
        notFound: 'Page not found',
        home: 'Back to home',
      },
    },
    zh: {
      translation: {
        brand: '欢迎来到始兴',
        language: '语言',
        eyebrow: '在始兴开启新的日常生活',
        title: '一起开始始兴生活',
        description: '用您选择的语言，了解安居准备和日常生活所需的信息。',
        checklist: '安居清单',
        checklistDescription: '了解登记和申报所需的准备事项。',
        calendar: '生活日历',
        calendarDescription: '查看本月待办事项和重要期限。',
        guide: '生活指南',
        guideDescription: '了解生活须知和本地活动信息。',
        notFound: '找不到该页面',
        home: '返回首页',
      },
    },
    vi: {
      translation: {
        brand: 'Chào mừng đến Siheung',
        language: 'Ngôn ngữ',
        eyebrow: 'Bắt đầu cuộc sống mới tại Siheung',
        title: 'Cùng bắt đầu cuộc sống tại Siheung',
        description:
          'Tìm thông tin chuẩn bị định cư và giải đáp thắc mắc hằng ngày bằng ngôn ngữ của bạn.',
        checklist: 'Danh sách việc cần làm',
        checklistDescription: 'Chuẩn bị cho các thủ tục đăng ký và khai báo.',
        calendar: 'Lịch sinh hoạt',
        calendarDescription:
          'Xem việc cần làm trong tháng và các thời hạn quan trọng.',
        guide: 'Hướng dẫn sinh hoạt',
        guideDescription:
          'Tìm hiểu quy tắc sinh hoạt và các sự kiện địa phương.',
        notFound: 'Không tìm thấy trang',
        home: 'Về trang chủ',
      },
    },
  },
})

function syncLanguage(language: string) {
  document.documentElement.lang = language
  try {
    localStorage.setItem(languageKey, language)
  } catch {
    /* Storage can be unavailable. */
  }
}

syncLanguage(i18n.resolvedLanguage ?? 'ko')
i18n.on('languageChanged', syncLanguage)

export default i18n
