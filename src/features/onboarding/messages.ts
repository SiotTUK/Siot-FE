import { defineMessages } from '@/shared/i18n/define-messages'

export const onboardingMessages = defineMessages({
  ko: {
    onboarding: {
      step: '{{current}} / {{total}}',
      autoNext: '누르면 바로 다음 화면으로 넘어가요',
      userType: {
        title: '지금 나의 상황은?',
        description: '고른 상황에 맞춰 먼저 보여 줄 정보가 달라져요',
        NEW: {
          title: '한국에 처음 입국했어요',
          description: '입국한 지 얼마 안 됐어요 · 외국인등록 등 처음 할 일',
        },
        LIVING: {
          title: '원래 한국에 살고 있어요',
          description: '이미 등록을 마쳤어요 · 체류 관리와 생활 정보',
        },
      },
      entryDate: {
        title: '한국에 입국한 날을 알려 주세요',
        description:
          '처음 입국했다면 외국인등록 마감일과 D-day를 계산해 드려요',
        label: '입국 날짜',
        note: '날짜를 모르면 건너뛰어도 돼요. "OO일 이내"처럼 기간만 보여 드려요.',
      },
      purpose: {
        title: '주된 체류 목적은?',
        description: '외국인등록증의 체류자격 기준으로 하나만',
        STUDY: {
          title: '공부하러 왔어요',
          description: 'D-2 · D-3 · D-4',
        },
        WORK: {
          title: '일하러 왔어요',
          description: 'E 계열 · H-2 · D-7~D-10',
        },
        FAMILY: {
          title: '가족과 살아요',
          description: 'F-6 · F-1 · F-3 · F-2',
        },
        OTHER: {
          title: '기타 · 잘 모르겠어요',
          description: 'F-4 · F-5 · H-1 등',
        },
      },
      residence: {
        title: '거주 정보를 모두 골라 주세요',
        description: '여러 개 고를 수 있어요 · 안 골라도 돼요',
        KIDS: '자녀가 있어요',
        CAR: '자차가 있어요 (차 · 오토바이)',
        HOUSE: '자가예요 (집 · 토지)',
        KOREAN: '한국어를 공부하고 싶어요',
        F4: '재외동포(F-4)예요',
      },
      stayExpiry: {
        title: '체류 만료일을 알려 주세요',
        description: '연장 신청 시기와 D-day를 알려 드려요 · 모르면 건너뛰어요',
        label: '체류 만료일',
        note: '외국인등록증 뒷면이나 하이코리아에서 확인할 수 있어요.',
        submit: '내 맞춤 화면 보기',
      },
      summary: {
        entryDate: '입국일 {{date}}',
        stayExpiry: '체류 만료 {{date}}',
        noResidence: '거주 정보 없음',
        residenceShort: {
          KIDS: '자녀',
          CAR: '자차',
          HOUSE: '자가',
          KOREAN: '한국어 공부',
          F4: '재외동포(F-4)',
        },
      },
      notEntered: '입력 안 함',
    },
  },
  en: {
    onboarding: {
      step: '{{current}} / {{total}}',
      autoNext: 'Tap to go to the next screen',
      userType: {
        title: 'What is your situation?',
        description: 'We will show you the most relevant information first',
        NEW: {
          title: 'I just arrived in Korea',
          description: 'Recently arrived · First steps like alien registration',
        },
        LIVING: {
          title: 'I already live in Korea',
          description: 'Already registered · Managing your stay and daily life',
        },
      },
      entryDate: {
        title: 'When did you arrive in Korea?',
        description:
          'If you just arrived, we will calculate your registration deadline and D-day',
        label: 'Arrival date',
        note: 'You can skip this if you do not know. We will show periods like "within OO days" instead.',
      },
      purpose: {
        title: 'What is the main purpose of your stay?',
        description: 'Choose one, based on the status on your residence card',
        STUDY: {
          title: 'I came to study',
          description: 'D-2 · D-3 · D-4',
        },
        WORK: {
          title: 'I came to work',
          description: 'E series · H-2 · D-7–D-10',
        },
        FAMILY: {
          title: 'I live with my family',
          description: 'F-6 · F-1 · F-3 · F-2',
        },
        OTHER: {
          title: 'Other · Not sure',
          description: 'F-4 · F-5 · H-1, etc.',
        },
      },
      residence: {
        title: 'Choose everything that applies',
        description: 'You can choose several, or none',
        KIDS: 'I have children',
        CAR: 'I own a vehicle (car · motorcycle)',
        HOUSE: 'I own property (house · land)',
        KOREAN: 'I want to study Korean',
        F4: 'I am an overseas Korean (F-4)',
      },
      stayExpiry: {
        title: 'When does your stay expire?',
        description:
          'We will remind you when to apply for an extension · Skip if you do not know',
        label: 'Stay expiry date',
        note: 'You can find it on the back of your residence card or on HiKorea.',
        submit: 'See my personalized screen',
      },
      summary: {
        entryDate: 'Arrived {{date}}',
        stayExpiry: 'Stay expires {{date}}',
        noResidence: 'No living details',
        residenceShort: {
          KIDS: 'Children',
          CAR: 'Own vehicle',
          HOUSE: 'Own property',
          KOREAN: 'Studying Korean',
          F4: 'Overseas Korean (F-4)',
        },
      },
      notEntered: 'Not entered',
    },
  },
  zh: {
    onboarding: {
      step: '{{current}} / {{total}}',
      autoNext: '点击后直接进入下一页',
      userType: {
        title: '您现在的情况是？',
        description: '我们会根据您的情况优先显示相关信息',
        NEW: {
          title: '我刚来韩国',
          description: '入境不久 · 外国人登录等首先要办的事',
        },
        LIVING: {
          title: '我已经在韩国生活',
          description: '已完成登录 · 滞留管理和生活信息',
        },
      },
      entryDate: {
        title: '请告诉我们您的入境日期',
        description: '如果是首次入境，我们会为您计算外国人登录截止日期和D-day',
        label: '入境日期',
        note: '不知道日期也可以跳过。我们会以“OO天内”的形式显示期限。',
      },
      purpose: {
        title: '您的主要滞留目的是？',
        description: '请按外国人登录证上的滞留资格选择一项',
        STUDY: {
          title: '来学习',
          description: 'D-2 · D-3 · D-4',
        },
        WORK: {
          title: '来工作',
          description: 'E类 · H-2 · D-7~D-10',
        },
        FAMILY: {
          title: '和家人一起生活',
          description: 'F-6 · F-1 · F-3 · F-2',
        },
        OTHER: {
          title: '其他 · 不太清楚',
          description: 'F-4 · F-5 · H-1 等',
        },
      },
      residence: {
        title: '请选择所有符合的居住情况',
        description: '可以多选 · 也可以不选',
        KIDS: '有子女',
        CAR: '有自己的车（汽车 · 摩托车）',
        HOUSE: '有自己的房产（房屋 · 土地）',
        KOREAN: '想学习韩语',
        F4: '是在外同胞（F-4）',
      },
      stayExpiry: {
        title: '请告诉我们您的滞留到期日',
        description: '我们会提醒您申请延期的时间和D-day · 不知道可以跳过',
        label: '滞留到期日',
        note: '可以在外国人登录证背面或HiKorea网站上确认。',
        submit: '查看我的专属页面',
      },
      summary: {
        entryDate: '入境日 {{date}}',
        stayExpiry: '滞留到期 {{date}}',
        noResidence: '无居住信息',
        residenceShort: {
          KIDS: '子女',
          CAR: '自有车辆',
          HOUSE: '自有房产',
          KOREAN: '学习韩语',
          F4: '在外同胞（F-4）',
        },
      },
      notEntered: '未填写',
    },
  },
  vi: {
    onboarding: {
      step: '{{current}} / {{total}}',
      autoNext: 'Chạm để chuyển ngay sang màn hình tiếp theo',
      userType: {
        title: 'Tình trạng hiện tại của bạn?',
        description:
          'Thông tin hiển thị trước sẽ khác tùy theo lựa chọn của bạn',
        NEW: {
          title: 'Tôi mới nhập cảnh Hàn Quốc',
          description:
            'Mới nhập cảnh · Những việc đầu tiên như đăng ký người nước ngoài',
        },
        LIVING: {
          title: 'Tôi đang sống ở Hàn Quốc',
          description:
            'Đã đăng ký xong · Quản lý lưu trú và thông tin sinh hoạt',
        },
      },
      entryDate: {
        title: 'Hãy cho biết ngày bạn nhập cảnh Hàn Quốc',
        description:
          'Nếu mới nhập cảnh, chúng tôi sẽ tính hạn đăng ký người nước ngoài và D-day',
        label: 'Ngày nhập cảnh',
        note: 'Nếu không nhớ ngày, bạn có thể bỏ qua. Chúng tôi sẽ chỉ hiển thị thời hạn như "trong vòng OO ngày".',
      },
      purpose: {
        title: 'Mục đích lưu trú chính của bạn?',
        description:
          'Chọn một theo tư cách lưu trú trên thẻ đăng ký người nước ngoài',
        STUDY: {
          title: 'Tôi đến để học',
          description: 'D-2 · D-3 · D-4',
        },
        WORK: {
          title: 'Tôi đến để làm việc',
          description: 'Nhóm E · H-2 · D-7~D-10',
        },
        FAMILY: {
          title: 'Tôi sống cùng gia đình',
          description: 'F-6 · F-1 · F-3 · F-2',
        },
        OTHER: {
          title: 'Khác · Tôi không rõ',
          description: 'F-4 · F-5 · H-1, v.v.',
        },
      },
      residence: {
        title: 'Hãy chọn tất cả thông tin cư trú phù hợp',
        description: 'Có thể chọn nhiều · Không chọn cũng được',
        KIDS: 'Tôi có con',
        CAR: 'Tôi có xe riêng (ô tô · xe máy)',
        HOUSE: 'Tôi có nhà đất riêng (nhà · đất)',
        KOREAN: 'Tôi muốn học tiếng Hàn',
        F4: 'Tôi là kiều bào (F-4)',
      },
      stayExpiry: {
        title: 'Hãy cho biết ngày hết hạn lưu trú',
        description:
          'Chúng tôi sẽ nhắc thời điểm xin gia hạn và D-day · Không biết thì bỏ qua',
        label: 'Ngày hết hạn lưu trú',
        note: 'Bạn có thể xem ở mặt sau thẻ đăng ký người nước ngoài hoặc trên HiKorea.',
        submit: 'Xem màn hình dành cho tôi',
      },
      summary: {
        entryDate: 'Nhập cảnh {{date}}',
        stayExpiry: 'Hết hạn lưu trú {{date}}',
        noResidence: 'Chưa có thông tin cư trú',
        residenceShort: {
          KIDS: 'Có con',
          CAR: 'Có xe riêng',
          HOUSE: 'Có nhà đất riêng',
          KOREAN: 'Học tiếng Hàn',
          F4: 'Kiều bào (F-4)',
        },
      },
      notEntered: 'Chưa nhập',
    },
  },
})
