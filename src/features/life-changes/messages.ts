import { defineMessages } from '@/shared/i18n/define-messages'

export const lifeChangeMessages = defineMessages({
  ko: {
    lifeChanges: {
      trigger: '생활 변화',
      pickerTitle: '요즘 무슨 일이 있나요?',
      pickerHint: '고르면 그때 할 일을 기한과 함께 알려 드려요',
      close: '닫기',
      registered: '등록한 날짜 {{date}}',
      backHome: '홈으로 돌아가기',
      invalidDate: '날짜를 올바르게 입력해 주세요.',
      futureMove: '이사일은 오늘까지 입력할 수 있어요.',
      dateChanged:
        '날짜를 바꾸면 이전 날짜의 완료 상태는 새 날짜에 적용되지 않아요.',
      save: '날짜 저장',
      saved: '날짜를 저장했어요.',
      tasks: '할 일 {{count}}개',
      noTasks: '이 생활 변화와 관련된 할 일이 없어요.',
      delete: '등록 삭제',
      confirmDelete:
        '이 생활 변화를 삭제할까요? 관련 할 일이 체크리스트에서 사라져요.',
      types: {
        'LC-01': {
          title: '이사했어요',
          date: '이사한 날을 알려 주세요',
        },
        'LC-02': {
          title: '직장을 바꿨어요',
          date: '직장을 바꾼 날을 알려 주세요',
        },
        'LC-03': {
          title: '아이가 학교에 가요',
          date: '아이의 입학일을 알려 주세요',
        },
        'LC-04': {
          title: '차를 샀어요',
          date: '차를 산 날을 알려 주세요',
        },
        'LC-05': {
          title: '아기가 태어났어요',
          date: '아기가 태어난 날을 알려 주세요',
        },
        'LC-06': {
          title: '가족이 한국에 와요',
          date: '가족의 입국일을 알려 주세요',
        },
        'LC-07': {
          title: '고향에 다녀와요',
          date: '출국일을 알려 주세요',
        },
        'LC-08': {
          title: '이름·여권이 바뀌었어요',
          date: '이름이나 여권을 변경한 날을 알려 주세요',
        },
      },
    },
    errors: {
      INVALID_LIFE_CHANGE_CODE: '지원하지 않는 생활 변화 유형이에요.',
      LIFE_CHANGE_NOT_FOUND: '생활 변화 기록을 찾을 수 없어요.',
    },
  },
  en: {
    lifeChanges: {
      trigger: 'Life changes',
      pickerTitle: 'What’s changed recently?',
      pickerHint: 'Choose a change to see what to do and when.',
      close: 'Close',
      registered: 'Date on record: {{date}}',
      backHome: 'Back to home',
      invalidDate: 'Enter a valid date.',
      futureMove: 'The move date must be today or earlier.',
      dateChanged:
        'Completed tasks for the old date won’t carry over to the new date.',
      save: 'Save date',
      saved: 'Date saved.',
      tasks: 'Tasks ({{count}})',
      noTasks: 'There are no tasks for this change.',
      delete: 'Delete record',
      confirmDelete:
        'Delete this change? Its tasks will disappear from your checklist.',
      types: {
        'LC-01': {
          title: 'I moved',
          date: 'When did you move?',
        },
        'LC-02': {
          title: 'I changed jobs',
          date: 'When did you change jobs?',
        },
        'LC-03': {
          title: 'My child is starting school',
          date: 'When does your child start school?',
        },
        'LC-04': {
          title: 'I bought a car',
          date: 'When did you buy the car?',
        },
        'LC-05': {
          title: 'I had a baby',
          date: 'When was your baby born?',
        },
        'LC-06': {
          title: 'My family is coming to Korea',
          date: 'When will your family arrive?',
        },
        'LC-07': {
          title: 'I’m visiting my home country',
          date: 'When are you leaving Korea?',
        },
        'LC-08': {
          title: 'My name or passport changed',
          date: 'When did your name or passport change?',
        },
      },
    },
    errors: {
      INVALID_LIFE_CHANGE_CODE: 'This type of life change is unavailable.',
      LIFE_CHANGE_NOT_FOUND: 'This life change record could not be found.',
    },
  },
  zh: {
    lifeChanges: {
      trigger: '生活变化',
      pickerTitle: '最近有什么变化？',
      pickerHint: '选择后即可查看相关待办事项和截止日期。',
      close: '关闭',
      registered: '已登记日期 {{date}}',
      backHome: '返回首页',
      invalidDate: '请输入有效日期。',
      futureMove: '搬家日期不能晚于今天。',
      dateChanged: '更改日期后，原日期的完成状态不会带到新日期。',
      save: '保存日期',
      saved: '日期已保存。',
      tasks: '待办事项 {{count}} 项',
      noTasks: '此生活变化暂无相关待办事项。',
      delete: '删除记录',
      confirmDelete: '确定删除这条记录吗？相关待办事项将从清单中移除。',
      types: {
        'LC-01': {
          title: '我搬家了',
          date: '您是哪天搬家的？',
        },
        'LC-02': {
          title: '我换工作了',
          date: '您是哪天换工作的？',
        },
        'LC-03': {
          title: '孩子要入学了',
          date: '孩子哪天入学？',
        },
        'LC-04': {
          title: '我买车了',
          date: '您是哪天买车的？',
        },
        'LC-05': {
          title: '宝宝出生了',
          date: '宝宝是哪天出生的？',
        },
        'LC-06': {
          title: '家人要来韩国',
          date: '家人哪天入境？',
        },
        'LC-07': {
          title: '我要回国探亲',
          date: '您哪天离开韩国？',
        },
        'LC-08': {
          title: '姓名或护照变更了',
          date: '您的姓名或护照是哪天变更的？',
        },
      },
    },
    errors: {
      INVALID_LIFE_CHANGE_CODE: '不支持此生活变化类型。',
      LIFE_CHANGE_NOT_FOUND: '找不到该生活变化记录。',
    },
  },
  vi: {
    lifeChanges: {
      trigger: 'Thay đổi trong cuộc sống',
      pickerTitle: 'Gần đây bạn có thay đổi gì?',
      pickerHint: 'Chọn một thay đổi để xem việc cần làm và thời hạn.',
      close: 'Đóng',
      registered: 'Ngày đã đăng ký: {{date}}',
      backHome: 'Về trang chủ',
      invalidDate: 'Hãy nhập ngày hợp lệ.',
      futureMove: 'Ngày chuyển nhà phải là hôm nay hoặc trước đó.',
      dateChanged:
        'Trạng thái hoàn thành của ngày cũ sẽ không được chuyển sang ngày mới.',
      save: 'Lưu ngày',
      saved: 'Đã lưu ngày.',
      tasks: 'Việc cần làm ({{count}})',
      noTasks: 'Không có việc cần làm cho thay đổi này.',
      delete: 'Xóa bản ghi',
      confirmDelete:
        'Bạn muốn xóa thay đổi này? Các việc liên quan sẽ biến mất khỏi danh sách.',
      types: {
        'LC-01': {
          title: 'Tôi đã chuyển nhà',
          date: 'Bạn chuyển nhà vào ngày nào?',
        },
        'LC-02': {
          title: 'Tôi đã đổi việc',
          date: 'Bạn đổi việc vào ngày nào?',
        },
        'LC-03': {
          title: 'Con tôi sắp đi học',
          date: 'Con bạn nhập học ngày nào?',
        },
        'LC-04': {
          title: 'Tôi đã mua xe',
          date: 'Bạn mua xe vào ngày nào?',
        },
        'LC-05': {
          title: 'Tôi mới sinh con',
          date: 'Em bé chào đời vào ngày nào?',
        },
        'LC-06': {
          title: 'Gia đình tôi sắp đến Hàn Quốc',
          date: 'Gia đình bạn nhập cảnh ngày nào?',
        },
        'LC-07': {
          title: 'Tôi sắp về thăm quê',
          date: 'Bạn rời Hàn Quốc ngày nào?',
        },
        'LC-08': {
          title: 'Tên hoặc hộ chiếu của tôi đã thay đổi',
          date: 'Bạn đổi tên hoặc hộ chiếu vào ngày nào?',
        },
      },
    },
    errors: {
      INVALID_LIFE_CHANGE_CODE: 'Loại thay đổi này không được hỗ trợ.',
      LIFE_CHANGE_NOT_FOUND: 'Không tìm thấy bản ghi thay đổi này.',
    },
  },
})
