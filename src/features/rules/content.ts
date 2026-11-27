import type { Localized, RuleEntry, RuleFaq } from './rules'

/**
 * Fixed 생활 수칙 text (FE-only, team decision 2026-11-25).
 * Every statement was checked on the official page listed in `sources`
 * on the date below. Items that could not be confirmed were left out.
 */
export const rulesCheckedOn = '2026-11-25'

const l = (ko: string, en: string, zh: string, vi: string): Localized => ({
  ko,
  en,
  zh,
  vi,
})

const siheung = (mId: string, section = 'portal') =>
  `https://www.siheung.go.kr/${section}/contents.do?mId=${mId}`

const resourceDept = l(
  '시흥시 자원순환과 031-310-2254',
  'Siheung Resource Circulation Division 031-310-2254',
  '始兴市资源循环科 031-310-2254',
  'Phòng Tuần hoàn Tài nguyên Siheung 031-310-2254',
)

const residentTaxSummary = l(
  '7월 1일 기준 시흥시에 주소(외국인은 체류지)를 둔 개인은 원칙적으로 8월 16~31일에 주민세를 내요. 기초생활수급자, 일정 요건에 해당하는 미성년자·세대원 등은 제외돼요. 7월 1일에 외국인등록 후 1년이 지나지 않은 외국인도 제외돼요.',
  'Individuals whose address (or registered place of stay for foreign residents) is in Siheung on 1 July generally pay resident tax from 16 to 31 August. Basic livelihood benefit recipients and certain minors and household members are exempt. Foreign residents who registered less than one year before 1 July are also exempt.',
  '截至7月1日住址（外国人为居留地）在始兴市的个人，原则上于8月16日至31日缴纳居民税。基础生活保障领取者及符合条件的未成年人、家庭成员等免缴。截至7月1日办理外国人登记未满一年的外国人也免缴。',
  'Cá nhân có địa chỉ tại Siheung (nơi lưu trú đối với người nước ngoài) vào ngày 1/7 thường nộp thuế cư trú từ 16 đến 31/8. Người hưởng trợ cấp bảo đảm sinh hoạt cơ bản và một số người chưa thành niên, thành viên hộ gia đình được miễn. Người nước ngoài đăng ký chưa đủ một năm tính đến ngày 1/7 cũng được miễn.',
)

export const ruleEntries: RuleEntry[] = [
  // ---- 기초 질서 ----
  {
    code: 'order-noise',
    category: 'order',
    title: l(
      '층간소음',
      'Noise between floors',
      '楼层噪音',
      'Tiếng ồn giữa các tầng',
    ),
    summary: l(
      '공동주택에서 소음 갈등이 생기면 관리사무소에 먼저 알리고, 해결되지 않으면 층간소음 이웃사이센터에 상담을 신청해요.',
      'If noise causes trouble in an apartment, tell the management office first. If it continues, ask the Floor Noise Neighbor Center for counseling.',
      '公寓发生噪音纠纷时，请先告知管理处；仍未解决可向楼层噪音邻里中心申请咨询。',
      'Khi có mâu thuẫn về tiếng ồn ở nhà chung cư, hãy báo ban quản lý trước. Nếu chưa giải quyết được, hãy đăng ký tư vấn tại Trung tâm láng giềng về tiếng ồn giữa các tầng.',
    ),
    points: [
      l(
        '법령상 낮은 06:00~22:00, 밤은 22:00~06:00이며 밤에는 소음 기준이 더 엄격해요.',
        'By law, daytime is 06:00–22:00 and night is 22:00–06:00. The noise limits are stricter at night.',
        '法规上白天为06:00~22:00，夜间为22:00~06:00，夜间噪音标准更严格。',
        'Theo luật, ban ngày là 06:00–22:00 và ban đêm là 22:00–06:00. Ban đêm áp dụng tiêu chuẩn tiếng ồn nghiêm ngặt hơn.',
      ),
      l(
        '뛰는 소리 같은 직접충격 소음과 TV·음향기기 소리 같은 공기전달 소음이 기준에 들어가요.',
        'The limits cover impact noise such as running and airborne noise such as TV or speakers.',
        '标准包括跑跳等直接撞击噪音，以及电视、音响等空气传播噪音。',
        'Tiêu chuẩn gồm tiếng ồn va chạm như chạy nhảy và tiếng ồn truyền qua không khí như TV, loa.',
      ),
      l(
        '이 기준은 처벌 기준이 아니라 다툼을 화해·조정할 때 쓰는 기준이에요.',
        'These limits are not for punishment. They are used to settle disputes.',
        '该标准不是处罚标准，而是用于调解纠纷的标准。',
        'Tiêu chuẩn này không dùng để xử phạt mà dùng để hòa giải tranh chấp.',
      ),
      l(
        '센터는 전화 상담 → 방문 상담 → 소음 측정 순서로 도와줘요. 아파트·연립·다세대가 대상이에요.',
        'The center helps in this order: phone counseling, a visit, then noise measurement. It covers apartments, row houses and multi-household houses.',
        '中心按电话咨询→上门咨询→噪音测量的顺序提供帮助，适用于公寓、联排住宅和多户住宅。',
        'Trung tâm hỗ trợ theo thứ tự: tư vấn qua điện thoại → tư vấn tại nhà → đo tiếng ồn. Áp dụng cho chung cư, nhà liên kế và nhà nhiều hộ.',
      ),
    ],
    facts: {
      law: l(
        '공동주택 층간소음의 범위와 기준에 관한 규칙',
        'Rules on the Scope and Standards of Floor Noise in Multi-unit Housing',
        '《共同住宅楼层噪音范围与标准规则》',
        'Quy tắc về phạm vi và tiêu chuẩn tiếng ồn giữa các tầng trong nhà chung cư',
      ),
      contact: l(
        '층간소음 이웃사이센터 1661-2642 (평일 09:00~18:00)',
        'Floor Noise Neighbor Center 1661-2642 (weekdays 09:00–18:00)',
        '楼层噪音邻里中心 1661-2642（工作日 09:00~18:00）',
        'Trung tâm láng giềng về tiếng ồn 1661-2642 (ngày thường 09:00–18:00)',
      ),
    },
    sources: [
      {
        name: '층간소음 이웃사이센터 업무절차',
        url: 'https://floor.noiseinfo.or.kr/floornoise/home/guide/process.do',
      },
      {
        name: '공동주택 층간소음의 범위와 기준에 관한 규칙 별표 (법제처)',
        url: 'https://law.go.kr/flDownload.do?flSeq=123539983',
      },
    ],
  },
  {
    code: 'order-smoking',
    category: 'order',
    title: l('금연구역', 'No-smoking areas', '禁烟区', 'Khu vực cấm hút thuốc'),
    summary: l(
      '금연구역에서 담배를 피우면 과태료를 내요. 어린이집·유치원·학교 주변 30m도 금연구역이에요.',
      'Smoking in a no-smoking area means a fine. The area within 30 m of daycare centers, kindergartens and schools is also no-smoking.',
      '在禁烟区吸烟会被罚款。托儿所、幼儿园、学校周边30米内也是禁烟区。',
      'Hút thuốc trong khu vực cấm sẽ bị phạt tiền. Khu vực trong vòng 30 m quanh nhà trẻ, mẫu giáo và trường học cũng cấm hút thuốc.',
    ),
    points: [
      l(
        '2024년 8월 17일부터 어린이집·유치원·초중고 경계 30m 이내가 금연구역이에요.',
        'Since 17 August 2024, the area within 30 m of daycare centers, kindergartens and schools is a no-smoking area.',
        '自2024年8月17日起，托儿所、幼儿园、中小学边界30米以内为禁烟区。',
        'Từ ngày 17/8/2024, khu vực trong vòng 30 m quanh nhà trẻ, mẫu giáo và trường phổ thông là khu vực cấm hút thuốc.',
      ),
      l(
        '공중이용시설 같은 금연구역에서 피우면 과태료 10만 원이에요.',
        'Smoking in a no-smoking area such as a public facility can bring a fine of 100,000 won.',
        '在公共设施等禁烟区吸烟将被处以10万韩元罚款。',
        'Hút thuốc ở khu vực cấm như nơi công cộng có thể bị phạt 100.000 won.',
      ),
    ],
    facts: {
      penalty: l(
        '과태료 10만 원 (학교 주변 30m: 10만 원 이하)',
        'Fine of 100,000 won (near schools: up to 100,000 won)',
        '罚款10万韩元（学校周边30米：10万韩元以下）',
        'Phạt 100.000 won (gần trường học: tối đa 100.000 won)',
      ),
      law: l(
        '국민건강증진법',
        'National Health Promotion Act',
        '《国民健康增进法》',
        'Luật Nâng cao Sức khỏe Quốc dân',
      ),
    },
    sources: [
      {
        name: '보건복지부 보도자료 — 어린이집·학교 주변에서는 금연',
        url: 'https://mohw.go.kr/board.es?act=view&bid=0027&list_no=1482759&mid=a10503000000',
      },
      {
        name: '정책브리핑 — 금연구역 과태료 10만 원',
        url: 'https://www.korea.kr/news/policyNewsView.do?newsId=148859253',
      },
    ],
  },

  // ---- 쓰레기 ----
  {
    code: 'waste-general',
    category: 'waste',
    title: l(
      '생활 쓰레기 (종량제 봉투)',
      'Household waste (volume-rate bags)',
      '生活垃圾（计量收费袋）',
      'Rác sinh hoạt (túi tính phí theo lượng)',
    ),
    summary: l(
      '일반 쓰레기는 흰색, 소각용 쓰레기는 분홍색 종량제 봉투에 담아 일~금요일 저녁 6시부터 다음 날 새벽 6시 사이에 집 앞에 내놓아요.',
      'Put general waste in a white bag and burnable waste in a pink bag. Leave them in front of your home between 6 p.m. and 6 a.m., Sunday to Friday.',
      '一般垃圾装白色计量袋，焚烧类垃圾装粉色计量袋，于周日至周五晚6点至次日早6点放在自家门前。',
      'Rác thông thường cho vào túi trắng, rác đốt được cho vào túi hồng. Để trước nhà từ 18 giờ đến 6 giờ sáng hôm sau, từ Chủ nhật đến thứ Sáu.',
    ),
    points: [
      l(
        '흰색 봉투: 휴지, 영수증, 동물 뼈, 달걀 껍데기, 조개껍데기 등.',
        'White bag: tissues, receipts, animal bones, eggshells, shells and similar.',
        '白色袋：纸巾、收据、动物骨头、蛋壳、贝壳等。',
        'Túi trắng: khăn giấy, hóa đơn, xương động vật, vỏ trứng, vỏ sò…',
      ),
      l(
        '분홍색 봉투: 고무, 가죽, 이불, 베개, 이물질이 묻은 비닐·스티로폼 등.',
        'Pink bag: rubber, leather, blankets, pillows, and dirty vinyl or styrofoam.',
        '粉色袋：橡胶、皮革、被子、枕头、沾有异物的塑料和泡沫等。',
        'Túi hồng: cao su, da, chăn, gối, nilon hoặc xốp bị bẩn…',
      ),
      l(
        '깨진 유리는 조금이면 신문지에 싸서 흰색 봉투에, 많으면 불연성 마대에 담아요.',
        'Wrap a little broken glass in newspaper and put it in the white bag. Put a lot of it in a non-combustible sack.',
        '少量碎玻璃用报纸包好放入白色袋，大量时装入不燃物麻袋。',
        'Ít mảnh kính vỡ thì gói bằng giấy báo rồi bỏ vào túi trắng; nhiều thì cho vào bao đựng rác không cháy.',
      ),
      l(
        '음식물이나 재활용품을 섞으면 수거하지 않아요. 봉투는 마트·편의점 등 판매소에서 사요.',
        'Bags mixed with food waste or recyclables are not collected. Buy bags at shops such as supermarkets and convenience stores.',
        '混有厨余垃圾或可回收物的袋子不予收运。计量袋可在超市、便利店等销售点购买。',
        'Túi có lẫn rác thực phẩm hoặc đồ tái chế sẽ không được thu gom. Mua túi ở siêu thị, cửa hàng tiện lợi.',
      ),
      l(
        '일요일에는 수거하지 않아요.',
        'There is no collection on Sunday.',
        '周日不收运。',
        'Không thu gom vào Chủ nhật.',
      ),
    ],
    facts: {
      when: l(
        '일~금요일 18:00~다음 날 06:00',
        'Sunday–Friday, 18:00–06:00',
        '周日至周五 18:00~次日06:00',
        'Chủ nhật–thứ Sáu, 18:00–06:00',
      ),
      where: l(
        '내 집 앞, 내 상가 앞',
        'In front of your own home or shop',
        '自家门前、自家店铺门前',
        'Trước nhà hoặc cửa hàng của mình',
      ),
      penalty: l(
        '무단투기 100만 원 이하 과태료 (예: 비닐봉지에 담아 버리면 20만 원, 배출 장소 위반 1차 10만 원)',
        'Illegal dumping: fine up to 1,000,000 won (e.g. 200,000 won for dumping in a plastic bag; 100,000 won for the wrong place the first time)',
        '乱扔垃圾最高罚款100万韩元（如装在塑料袋丢弃罚20万韩元，首次违反投放地点罚10万韩元）',
        'Vứt rác trái phép: phạt đến 1.000.000 won (ví dụ: bỏ rác trong túi nilon 200.000 won; sai nơi để lần đầu 100.000 won)',
      ),
      law: l(
        '폐기물관리법 제8조·제15조·제68조, 시흥시 폐기물관리 조례',
        'Wastes Control Act Articles 8, 15 and 68; Siheung waste ordinance',
        '《废弃物管理法》第8条、第15条、第68条，始兴市废弃物管理条例',
        'Luật Quản lý Chất thải Điều 8, 15, 68; quy định về chất thải của Siheung',
      ),
      contact: resourceDept,
    },
    sources: [
      { name: '시흥시 생활쓰레기 배출 요령', url: siheung('0703010100') },
      { name: '시흥시 무단투기 과태료 부과기준', url: siheung('0703011000') },
    ],
  },
  {
    code: 'waste-food',
    category: 'waste',
    title: l('음식물 쓰레기', 'Food waste', '厨余垃圾', 'Rác thực phẩm'),
    summary: l(
      '노란색 음식물 종량제 봉투, 칩을 꽂은 전용 용기, 또는 RFID 기기로 일~금요일에 내요. 물기를 빼고 이물질은 빼요.',
      'Use a yellow food waste bag, a bin with a chip, or an RFID machine, Sunday to Friday. Drain the water and take out anything that is not food.',
      '用黄色厨余计量袋、插卡专用桶或RFID设备，于周日至周五投放。请沥干水分并去除杂物。',
      'Dùng túi rác thực phẩm màu vàng, thùng có gắn chip hoặc máy RFID, từ Chủ nhật đến thứ Sáu. Hãy để ráo nước và bỏ vật lạ ra.',
    ),
    points: [
      l(
        '비닐, 병뚜껑, 이쑤시개, 호일, 빨대는 빼고, 통무·통배추처럼 큰 것은 잘게 썰어요.',
        'Remove vinyl, bottle caps, toothpicks, foil and straws. Cut large items like whole radishes or cabbages into small pieces.',
        '去除塑料、瓶盖、牙签、锡纸、吸管；整个萝卜、白菜等大块要切碎。',
        'Bỏ nilon, nắp chai, tăm, giấy bạc, ống hút. Cắt nhỏ đồ to như củ cải, bắp cải nguyên.',
      ),
      l(
        '일반 쓰레기로 버리는 것: 굵은 뼈·털, 조개·게 껍데기, 생선뼈, 달걀 껍데기, 호두·밤 껍데기, 복숭아·감 씨, 파 뿌리, 옥수수 껍질·대, 한약 찌꺼기, 티백.',
        'These go in general waste: large bones and hair, shells of clams or crabs, fish bones, eggshells, walnut or chestnut shells, peach or persimmon seeds, green onion roots, corn husks and cobs, herbal medicine dregs, tea bags.',
        '以下按一般垃圾处理：粗骨头和毛、贝壳和蟹壳、鱼骨、蛋壳、核桃和栗子壳、桃核和柿子籽、葱根、玉米皮和玉米芯、中药渣、茶包。',
        'Những thứ sau bỏ vào rác thông thường: xương to và lông, vỏ sò, vỏ cua, xương cá, vỏ trứng, vỏ óc chó, vỏ hạt dẻ, hạt đào, hạt hồng, rễ hành, vỏ và lõi ngô, bã thuốc Bắc, túi trà.',
      ),
      l(
        '복어 내장은 분홍색 소각용 봉투에 넣어요.',
        'Put pufferfish guts in the pink bag for burnable waste.',
        '河豚内脏放入粉色焚烧类垃圾袋。',
        'Nội tạng cá nóc cho vào túi hồng dành cho rác đốt được.',
      ),
    ],
    facts: {
      when: l('일~금요일', 'Sunday–Friday', '周日至周五', 'Chủ nhật–thứ Sáu'),
      contact: l(
        '시흥시 자원순환과 031-310-2362',
        'Siheung Resource Circulation Division 031-310-2362',
        '始兴市资源循环科 031-310-2362',
        'Phòng Tuần hoàn Tài nguyên Siheung 031-310-2362',
      ),
    },
    sources: [{ name: '시흥시 음식물쓰레기', url: siheung('0703010200') }],
  },
  {
    code: 'waste-recycle',
    category: 'waste',
    title: l(
      '분리수거 (페트병·캔·비닐)',
      'Recycling (PET bottles, cans, vinyl)',
      '分类回收（塑料瓶·易拉罐·塑料袋）',
      'Phân loại tái chế (chai nhựa, lon, nilon)',
    ),
    summary: l(
      '내용물을 비우고 헹군 뒤, 라벨·뚜껑·테이프 같은 다른 재질은 떼고 종류별로 나눠서 내요.',
      'Empty and rinse items, remove labels, caps and tape made of other materials, and sort them by type.',
      '倒空并冲洗后，撕掉标签、瓶盖、胶带等其他材质，按种类分开投放。',
      'Đổ hết, tráng sạch, bóc nhãn, nắp, băng dính khác chất liệu rồi phân loại theo từng loại.',
    ),
    points: [
      l(
        '투명 페트병은 라벨을 떼고 눌러서 내요. 단독주택은 목·금요일에 내요.',
        'Remove the label from clear PET bottles and crush them. Detached houses put them out on Thursday and Friday.',
        '透明塑料瓶撕掉标签后压扁投放。独栋住宅在周四、周五投放。',
        'Chai nhựa trong suốt bóc nhãn rồi ép dẹt. Nhà riêng bỏ vào thứ Năm và thứ Sáu.',
      ),
      l(
        '플라스틱, 캔, 유리병, 비닐은 씻어서 일~금요일에 내요. 아파트는 단지의 전용 수거함에 내요.',
        'Wash plastic, cans, glass bottles and vinyl and put them out Sunday to Friday. Apartments use the complex’s own bins.',
        '塑料、易拉罐、玻璃瓶、塑料袋洗净后于周日至周五投放。公寓投放到小区专用回收箱。',
        'Nhựa, lon, chai thủy tinh, nilon rửa sạch rồi bỏ từ Chủ nhật đến thứ Sáu. Chung cư bỏ vào thùng thu gom riêng của khu.',
      ),
      l(
        '종이팩은 펼쳐서 헹구고 말린 뒤 일반 종이와 따로 내요. 깨진 유리·도자기는 재활용품이 아니에요.',
        'Open, rinse and dry paper cartons and keep them apart from other paper. Broken glass and ceramics are not recyclable.',
        '纸盒展开、冲洗、晾干后与普通纸张分开投放。碎玻璃和陶瓷不属于可回收物。',
        'Hộp giấy mở ra, tráng, phơi khô rồi để riêng với giấy thường. Kính vỡ và đồ gốm không phải đồ tái chế.',
      ),
      l(
        '폐건전지와 형광등은 주요 거점에 있는 전용 수거함에 넣어요.',
        'Put used batteries and fluorescent lamps in the special bins at main collection points.',
        '废电池和荧光灯放入主要地点的专用回收箱。',
        'Pin cũ và bóng đèn huỳnh quang bỏ vào thùng thu gom riêng ở các điểm chính.',
      ),
    ],
    facts: {
      contact: l(
        '시흥시 자원순환과 031-310-2363',
        'Siheung Resource Circulation Division 031-310-2363',
        '始兴市资源循环科 031-310-2363',
        'Phòng Tuần hoàn Tài nguyên Siheung 031-310-2363',
      ),
    },
    sources: [
      { name: '시흥시 재활용품', url: siheung('0703010300') },
      { name: '시흥시 생활쓰레기 배출 요령', url: siheung('0703010100') },
    ],
  },
  {
    code: 'waste-bulky',
    category: 'waste',
    title: l(
      '대형 폐기물 (가구·매트리스·가전)',
      'Large items (furniture, mattresses, appliances)',
      '大件垃圾（家具·床垫·家电）',
      'Rác cồng kềnh (đồ nội thất, nệm, đồ điện)',
    ),
    summary: l(
      '스마트클린 시흥에서 신청하고 수수료를 내거나, 판매소에서 납부필증 스티커를 사서 붙여 내요.',
      'Apply and pay on Smart Clean Siheung, or buy a fee sticker at a shop and attach it to the item.',
      '在“智能清洁始兴”网站申请并缴费，或在销售点购买缴费贴纸贴在物品上。',
      'Đăng ký và trả phí trên Smart Clean Siheung, hoặc mua tem nộp phí ở cửa hàng rồi dán lên đồ.',
    ),
    points: [
      l(
        '스마트클린 시흥(smartclean.siheung.go.kr)은 앱 설치 없이 본인 인증 후 PC·휴대폰으로 신청해요.',
        'Smart Clean Siheung (smartclean.siheung.go.kr) works on a PC or phone after identity verification. No app is needed.',
        '“智能清洁始兴”(smartclean.siheung.go.kr)无需安装应用，身份认证后可用电脑或手机申请。',
        'Smart Clean Siheung (smartclean.siheung.go.kr) dùng trên máy tính hoặc điện thoại sau khi xác minh danh tính, không cần cài ứng dụng.',
      ),
      l(
        '신청 후 접수번호·품목·결제 금액을 종이에 적어 물건에 붙여요.',
        'After applying, write the receipt number, item and amount paid on paper and attach it to the item.',
        '申请后将受理编号、物品、缴费金额写在纸上贴到物品上。',
        'Sau khi đăng ký, ghi số tiếp nhận, tên đồ và số tiền đã trả lên giấy rồi dán lên đồ.',
      ),
      l(
        '수수료는 품목별 수수료표를 따라요. 표에 없는 품목은 비슷한 품목 기준이에요.',
        'The fee follows the fee table by item. Items not on the table use the fee of a similar item.',
        '费用按物品收费表计算，表中没有的物品按类似物品收费。',
        'Phí theo bảng phí từng loại đồ; đồ không có trong bảng tính theo đồ tương tự.',
      ),
      l(
        '냉장고·세탁기·에어컨·TV 같은 폐가전은 무상 방문수거를 신청할 수 있어요 (1599-0903, www.15990903.or.kr).',
        'Old appliances such as refrigerators, washing machines, air conditioners and TVs can be picked up for free (1599-0903, www.15990903.or.kr).',
        '冰箱、洗衣机、空调、电视等废旧家电可申请免费上门回收（1599-0903，www.15990903.or.kr）。',
        'Đồ điện cũ như tủ lạnh, máy giặt, máy lạnh, TV có thể đăng ký thu gom miễn phí tại nhà (1599-0903, www.15990903.or.kr).',
      ),
    ],
    facts: {
      contact: l(
        '시흥시 자원순환과 031-310-2254 (평일 09:30~18:00)',
        'Siheung Resource Circulation Division 031-310-2254 (weekdays 09:30–18:00)',
        '始兴市资源循环科 031-310-2254（工作日 09:30~18:00）',
        'Phòng Tuần hoàn Tài nguyên Siheung 031-310-2254 (ngày thường 09:30–18:00)',
      ),
    },
    sources: [
      { name: '시흥시 대형폐기물 신청안내', url: siheung('0712020000') },
      { name: '스마트클린 시흥', url: 'https://smartclean.siheung.go.kr/' },
    ],
  },

  // ---- 교통 ----
  {
    code: 'traffic-parking',
    category: 'traffic',
    title: l(
      '주정차 금지 구역',
      'No-parking zones',
      '禁止停车区域',
      'Khu vực cấm dừng đỗ xe',
    ),
    summary: l(
      '소화전, 교차로 모퉁이, 버스정류소, 횡단보도, 어린이보호구역, 인도에 차를 세우면 주민 신고로도 과태료가 나와요.',
      'Parking at fire hydrants, intersection corners, bus stops, crosswalks, school zones or sidewalks can be fined, even from a resident’s report.',
      '在消防栓、路口转角、公交站、人行横道、儿童保护区、人行道停车，即使是居民举报也会被罚款。',
      'Đỗ xe ở trụ cứu hỏa, góc ngã tư, trạm xe buýt, vạch qua đường, khu vực bảo vệ trẻ em hoặc vỉa hè có thể bị phạt, kể cả khi người dân báo cáo.',
    ),
    points: [
      l(
        '소화전 5m 이내, 교차로 모퉁이 5m 이내, 버스정류소 10m 이내, 횡단보도 위, 초등학교 정문 앞 어린이보호구역, 인도가 신고 대상이에요.',
        'Reportable spots: within 5 m of a fire hydrant, within 5 m of an intersection corner, within 10 m of a bus stop, on a crosswalk, in the school zone at an elementary school’s main gate, and on sidewalks.',
        '举报对象：消防栓5米内、路口转角5米内、公交站10米内、人行横道上、小学正门前儿童保护区、人行道。',
        'Có thể bị báo cáo: trong vòng 5 m trụ cứu hỏa, 5 m góc ngã tư, 10 m trạm xe buýt, trên vạch qua đường, khu bảo vệ trẻ em trước cổng trường tiểu học, và trên vỉa hè.',
      ),
      l(
        '1분 넘게 세워 두면 주민이 안전신문고 앱으로 1분 간격 사진 2장을 찍어 신고할 수 있어요.',
        'If a car stays more than 1 minute, residents can report it with two photos taken 1 minute apart in the Safety e-Report app.',
        '停车超过1分钟，居民可用“安全申报”应用拍摄间隔1分钟的2张照片举报。',
        'Nếu xe đỗ quá 1 phút, người dân có thể báo cáo bằng 2 ảnh chụp cách nhau 1 phút qua ứng dụng Safety e-Report.',
      ),
    ],
    facts: {
      penalty: l(
        '승용차 기준 4만 원(교차로·버스정류소·횡단보도·인도), 8만 원(소화전), 12만 원(어린이보호구역)',
        'For cars: 40,000 won (corner, bus stop, crosswalk, sidewalk), 80,000 won (fire hydrant), 120,000 won (school zone)',
        '小汽车：4万韩元（路口、公交站、人行横道、人行道），8万韩元（消防栓），12万韩元（儿童保护区）',
        'Xe con: 40.000 won (góc ngã tư, trạm xe buýt, vạch qua đường, vỉa hè), 80.000 won (trụ cứu hỏa), 120.000 won (khu bảo vệ trẻ em)',
      ),
      law: l(
        '도로교통법 제32조',
        'Road Traffic Act Article 32',
        '《道路交通法》第32条',
        'Luật Giao thông Đường bộ Điều 32',
      ),
    },
    sources: [
      {
        name: '정책브리핑 — 6대 불법 주정차 주민신고',
        url: 'https://www.korea.kr/news/policyNewsView.do?newsId=148918697',
      },
      {
        name: '행정안전부 보도자료 — 인도 주정차 주민신고 (2023.8.1. 시행)',
        url: 'https://m.korea.kr/briefing/pressReleaseView.do?newsId=156582031',
      },
    ],
  },
  {
    code: 'traffic-alert',
    category: 'traffic',
    title: l(
      '주정차 단속 알림 (휘슬)',
      'Parking enforcement alerts (Whistle)',
      '违停执法提醒（Whistle）',
      'Thông báo kiểm tra đỗ xe (Whistle)',
    ),
    summary: l(
      '시흥시는 2026년 4월 1일부터 주정차 단속 사전알림을 휘슬 앱으로 운영해요.',
      'Since 1 April 2026, Siheung sends advance parking enforcement alerts through the Whistle app.',
      '始兴市自2026年4月1日起通过Whistle应用提供违停执法提前提醒。',
      'Từ ngày 1/4/2026, Siheung gửi thông báo trước về kiểm tra đỗ xe qua ứng dụng Whistle.',
    ),
    points: [
      l(
        '고정형 단속 알림은 정상 제공되고, 주행형 단속 알림은 현재 제공되지 않아요.',
        'Alerts from fixed cameras work normally. Alerts from patrol vehicles are not available now.',
        '固定式执法提醒正常提供，巡逻车执法提醒目前暂停。',
        'Thông báo từ camera cố định hoạt động bình thường; thông báo từ xe tuần tra hiện chưa có.',
      ),
    ],
    facts: {
      contact: l(
        '휘슬 고객센터 1599-6270 / 시흥시 교통행정과 031-310-5160',
        'Whistle 1599-6270 / Siheung Traffic Administration Division 031-310-5160',
        'Whistle客服 1599-6270 / 始兴市交通行政科 031-310-5160',
        'Whistle 1599-6270 / Phòng Hành chính Giao thông Siheung 031-310-5160',
      ),
    },
    sources: [
      {
        name: '시흥시 주·정차 민원 서비스 — 사전알림',
        url: 'https://www.siheung.go.kr/car/inst/sbas_agre_aply.gs',
      },
    ],
  },

  // ---- 세금 ----
  {
    code: 'tax-resident',
    category: 'tax',
    title: l(
      '주민세 (개인분)',
      'Resident tax (individual)',
      '居民税（个人部分）',
      'Thuế cư trú (cá nhân)',
    ),
    summary: residentTaxSummary,
    points: [
      l(
        '외국인은 주소 대신 출입국관리법상 체류지를 기준으로 해요.',
        'For foreigners, the place of stay under the Immigration Act is used instead of an address.',
        '外国人以《出入境管理法》规定的居留地代替住址为准。',
        'Với người nước ngoài, nơi cư trú theo Luật Xuất nhập cảnh được dùng thay cho địa chỉ.',
      ),
      l(
        '시흥시는 외국인 세대주에게 한국어·영어·중국어 고지서를 보내요. 내지 않으면 비자 연장 제한 같은 불이익이 있을 수 있어요.',
        'Siheung sends bills in Korean, English and Chinese to foreign heads of household. Not paying can lead to disadvantages such as limits on visa extension.',
        '始兴市向外国人户主寄送韩、英、中文缴费通知书。未缴纳可能会受到限制签证延期等不利影响。',
        'Siheung gửi giấy báo thuế bằng tiếng Hàn, Anh, Trung cho chủ hộ người nước ngoài. Không nộp có thể bị bất lợi như hạn chế gia hạn visa.',
      ),
    ],
    facts: {
      when: l('8월 16일~31일', '16–31 August', '8月16日~31日', '16–31/8'),
      law: l(
        '지방세법 제75조',
        'Local Tax Act Article 75',
        '《地方税法》第75条',
        'Luật Thuế Địa phương Điều 75',
      ),
      contact: l(
        '시흥시 시세관리과 031-310-2089',
        'Siheung City Tax Management Division 031-310-2089',
        '始兴市市税管理科 031-310-2089',
        'Phòng Quản lý Thuế Siheung 031-310-2089',
      ),
    },
    sources: [
      { name: '시흥시 주민세', url: siheung('0402010600', 'economy') },
      {
        name: '국가법령정보센터 — 지방세법 제75조',
        url: 'https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1030540701',
      },
      {
        name: '시흥시 보도자료 — 외국인 납세자 맞춤형 주민세 고지서 발송',
        url: 'https://www.siheung.go.kr/media/bbs/view.do?mId=0100000000&bIdx=177130&ptIdx=82',
      },
    ],
  },
  {
    code: 'tax-property',
    category: 'tax',
    title: l('재산세', 'Property tax', '财产税', 'Thuế tài sản'),
    summary: l(
      '6월 1일 소유자를 기준으로 해요. 주택 외 건축물은 7월, 토지는 9월에 내요. 주택분은 7월과 9월에 나눠 내지만 연간 본세가 10만 원 이하면 7월에 전액 내요.',
      'Tax is based on ownership on 1 June. Non-residential buildings are billed in July and land in September. Homeowners pay in July and September, except when the annual base property tax on the home is 100,000 won or less, in which case the full amount is due in July.',
      '按6月1日的所有权确定纳税人。非住宅建筑物在7月缴纳，土地在9月缴纳。住宅在7月和9月分两期缴纳；如果住宅全年财产税本金不超过10万韩元，则在7月一次缴清。',
      'Thuế được xác định theo quyền sở hữu vào ngày 1/6. Công trình không phải nhà ở nộp vào tháng 7, đất nộp vào tháng 9. Thuế nhà ở nộp vào tháng 7 và tháng 9; nếu tiền thuế gốc cả năm không quá 100.000 won thì nộp toàn bộ vào tháng 7.',
    ),
    points: [
      l(
        '7월(16~31일): 주택분의 절반과 주택 외 건축물분. 주택분 연간 본세가 10만 원 이하이면 7월에 전액 내요.',
        'July (16–31): half of the home’s property tax and all tax on buildings other than homes. If the annual base property tax on the home is 100,000 won or less, the full amount is due in July.',
        '7月（16~31日）：缴纳住宅财产税的一半及非住宅建筑物的全部税额。住宅全年财产税本金不超过10万韩元时，在7月一次缴清。',
        'Tháng 7 (16–31): nộp một nửa thuế nhà ở và toàn bộ thuế công trình không phải nhà ở. Nếu tiền thuế gốc cả năm của nhà ở không quá 100.000 won thì nộp toàn bộ vào tháng 7.',
      ),
      l(
        '9월(16~30일): 주택 세금의 나머지 절반과 토지.',
        'September (16–30): the other half of the housing tax and land.',
        '9月（16~30日）：住宅税额的另一半及土地。',
        'Tháng 9 (16–30): nửa còn lại của thuế nhà ở và đất.',
      ),
    ],
    facts: {
      when: l(
        '7월 16~31일, 9월 16~30일',
        '16–31 July, 16–30 September',
        '7月16~31日、9月16~30日',
        '16–31/7, 16–30/9',
      ),
      contact: l(
        '시흥시 시세관리과 재산세팀 031-310-2081',
        'Siheung City Tax Management Division, property tax 031-310-2081',
        '始兴市市税管理科财产税组 031-310-2081',
        'Phòng Quản lý Thuế Siheung, tổ thuế tài sản 031-310-2081',
      ),
    },
    sources: [{ name: '시흥시 재산세', url: siheung('0402010800', 'economy') }],
  },
  {
    code: 'tax-car',
    category: 'tax',
    title: l('자동차세', 'Car tax', '汽车税', 'Thuế ô tô'),
    summary: l(
      '자동차를 가진 사람이 6월과 12월에 나눠서 내요. 1년치를 미리 내면 할인돼요.',
      'Car owners pay it in June and December. Paying the whole year in advance gives a discount.',
      '拥有汽车的人于6月和12月分两次缴纳。提前缴纳全年税额可享受减免。',
      'Chủ xe nộp chia làm hai lần vào tháng 6 và tháng 12. Nộp trước cả năm sẽ được giảm.',
    ),
    points: [
      l(
        '1기분(1~6월분)은 6월 16~30일, 2기분(7~12월분)은 12월 16~31일에 내요.',
        'The first half (January–June) is paid 16–30 June, the second half (July–December) 16–31 December.',
        '第1期（1~6月）于6月16~30日缴纳，第2期（7~12月）于12月16~31日缴纳。',
        'Kỳ 1 (tháng 1–6) nộp 16–30/6, kỳ 2 (tháng 7–12) nộp 16–31/12.',
      ),
      l(
        '연납: 미리 한 번에 내면 남은 기간 세금의 5%를 빼 줘요. 1월·3월·6월·9월 16일부터 신청해요.',
        'Annual payment: paying in advance takes 5% off the tax for the remaining period. Apply from the 16th of January, March, June or September.',
        '年缴：提前一次缴纳可减免剩余期间税额的5%，可于1月、3月、6月、9月16日起申请。',
        'Nộp cả năm: nộp trước một lần được giảm 5% thuế của thời gian còn lại. Đăng ký từ ngày 16 tháng 1, 3, 6 hoặc 9.',
      ),
    ],
    facts: {
      when: l(
        '6월 16~30일, 12월 16~31일',
        '16–30 June, 16–31 December',
        '6月16~30日、12月16~31日',
        '16–30/6, 16–31/12',
      ),
      contact: l(
        '시흥시 시세관리과 031-310-2093',
        'Siheung City Tax Management Division 031-310-2093',
        '始兴市市税管理科 031-310-2093',
        'Phòng Quản lý Thuế Siheung 031-310-2093',
      ),
    },
    sources: [
      { name: '시흥시 자동차세', url: siheung('0402010900', 'economy') },
    ],
  },
  {
    code: 'tax-payment',
    category: 'tax',
    title: l(
      '세금 내는 방법과 가산세',
      'How to pay and late fees',
      '缴税方法与滞纳金',
      'Cách nộp thuế và tiền phạt chậm nộp',
    ),
    summary: l(
      '위택스·스마트위택스 앱이나 고지서의 가상계좌로 내요. 기한을 넘기면 3%가 더 붙어요.',
      'Pay on Wetax, the Smart Wetax app, or the virtual account on the bill. After the due date, 3% is added.',
      '可通过Wetax网站、Smart Wetax应用或通知书上的虚拟账户缴纳。逾期加收3%。',
      'Nộp qua Wetax, ứng dụng Smart Wetax hoặc tài khoản ảo trên giấy báo. Quá hạn sẽ cộng thêm 3%.',
    ),
    points: [
      l(
        '위택스에서는 계좌이체·신용카드·간편결제를 쓸 수 있어요 (00:30~23:30).',
        'Wetax accepts bank transfer, credit card and simple payment (00:30–23:30).',
        'Wetax支持转账、信用卡和简易支付（00:30~23:30）。',
        'Wetax nhận chuyển khoản, thẻ tín dụng và thanh toán nhanh (00:30–23:30).',
      ),
      l(
        '가상계좌는 00:30~22:00에 이체할 수 있고, 다른 은행에서 보내면 수수료는 내는 사람이 부담해요.',
        'Virtual accounts accept transfers 00:30–22:00. Transfers from another bank may cost you a fee.',
        '虚拟账户可于00:30~22:00转账，从其他银行转账的手续费由缴纳人承担。',
        'Tài khoản ảo nhận chuyển khoản 00:30–22:00; chuyển từ ngân hàng khác thì người nộp chịu phí.',
      ),
      l(
        '세금이 45만 원 이상이면 기한 후 한 달마다 0.66%가 최대 60개월까지 더 붙어요.',
        'If the tax is 450,000 won or more, 0.66% is added every month after the due date, for up to 60 months.',
        '税额在45万韩元以上的，逾期后每月加收0.66%，最长60个月。',
        'Nếu thuế từ 450.000 won trở lên, mỗi tháng quá hạn cộng thêm 0,66%, tối đa 60 tháng.',
      ),
    ],
    facts: {
      contact: l(
        '시흥시 징수과 031-310-3069',
        'Siheung Tax Collection Division 031-310-3069',
        '始兴市征收科 031-310-3069',
        'Phòng Thu thuế Siheung 031-310-3069',
      ),
    },
    sources: [
      { name: '시흥시 인터넷 납부', url: siheung('0402020300', 'economy') },
      { name: '시흥시 납부지연가산세', url: siheung('0402011100', 'economy') },
      {
        name: '위택스 납부하기',
        url: 'https://www.wetax.go.kr/tcp/wtg/J040104M01.do',
      },
    ],
  },

  // ---- 생활 편의 ----
  {
    code: 'living-siru',
    category: 'living',
    title: l(
      '시흥화폐 시루',
      'Siheung local currency “Siru”',
      '始兴货币“Siru”',
      'Tiền địa phương Siheung “Siru”',
    ),
    summary: l(
      '시흥시 지역화폐예요. 살 때 8~10% 할인 혜택이 있어요.',
      'Siheung’s local currency. You get an 8–10% discount when you buy it.',
      '始兴市的地区货币，购买时可享受8~10%的优惠。',
      'Tiền địa phương của Siheung. Khi mua được ưu đãi 8–10%.',
    ),
    points: [
      l(
        '종이 상품권은 시흥시 안의 농협·새마을금고·신협에서 사요.',
        'Buy paper vouchers at NongHyup, MG Saemaul Geumgo or Shinhyup branches in Siheung.',
        '纸质商品券可在始兴市内的农协、新村金库、信协购买。',
        'Phiếu giấy mua tại NongHyup, MG Saemaul Geumgo hoặc Shinhyup ở Siheung.',
      ),
      l(
        '모바일은 ‘지역상품권 chak’ 앱을 설치해서 써요.',
        'For mobile, install the “chak” local voucher app.',
        '手机支付请安装“地区商品券chak”应用。',
        'Dùng trên điện thoại bằng cách cài ứng dụng “chak”.',
      ),
    ],
    facts: {
      contact: l(
        '시흥시 소상공인과 031-310-3545',
        'Siheung Small Business Division 031-310-3545',
        '始兴市小商工人科 031-310-3545',
        'Phòng Tiểu thương Siheung 031-310-3545',
      ),
    },
    sources: [{ name: '시흥화폐 시루', url: siheung('0504060000', 'economy') }],
  },
  {
    code: 'living-bike',
    category: 'living',
    title: l(
      '자전거 대여소',
      'Bicycle rental',
      '自行车租赁点',
      'Điểm cho thuê xe đạp',
    ),
    summary: l(
      '정왕역과 월곶역 자전거 대여소에서 신분증을 보여 주고 빌린 뒤, 같은 곳에 그날 반납해요.',
      'Rent a bike at the Jeongwang or Wolgot station rental office with your ID and return it there the same day.',
      '在正往站或月串站自行车租赁点出示身份证租借，当天归还到原租赁点。',
      'Thuê xe đạp tại điểm ga Jeongwang hoặc Wolgot bằng giấy tờ tùy thân và trả lại đúng nơi đó trong ngày.',
    ),
    points: [
      l(
        '사진이 있는 신분증(여권 포함)과 휴대폰이 필요해요. 신분증이 없으면 빌릴 수 없어요.',
        'Bring a photo ID (a passport is fine) and your phone. Without ID you cannot rent.',
        '需要带照片的身份证件（含护照）和手机，没有证件无法租借。',
        'Cần giấy tờ có ảnh (kể cả hộ chiếu) và điện thoại. Không có giấy tờ thì không thuê được.',
      ),
      l(
        '정왕역점: 월~금 07:00~20:00 (031-433-0101). 월곶역점: 수~일 08:30~20:30 (031-435-0201).',
        'Jeongwang Station: Mon–Fri 07:00–20:00 (031-433-0101). Wolgot Station: Wed–Sun 08:30–20:30 (031-435-0201).',
        '正往站点：周一至周五 07:00~20:00（031-433-0101）。月串站点：周三至周日 08:30~20:30（031-435-0201）。',
        'Ga Jeongwang: thứ Hai–thứ Sáu 07:00–20:00 (031-433-0101). Ga Wolgot: thứ Tư–Chủ nhật 08:30–20:30 (031-435-0201).',
      ),
      l(
        '운영 기간이 정해져 있어요 (2026년은 3월~11월). 해마다 시흥시 안내를 확인하세요.',
        'They open only for a set period (March–November in 2026). Check Siheung’s notice each year.',
        '有固定运营期间（2026年为3月~11月），请每年查看始兴市通知。',
        'Chỉ mở trong thời gian nhất định (năm 2026: tháng 3–11). Hãy xem thông báo của Siheung mỗi năm.',
      ),
    ],
    facts: {
      contact: l(
        '시흥시 도로시설과 031-310-3146',
        'Siheung Road Facilities Division 031-310-3146',
        '始兴市道路设施科 031-310-3146',
        'Phòng Cơ sở Hạ tầng Đường bộ Siheung 031-310-3146',
      ),
    },
    sources: [{ name: '시흥시 자전거 대여소', url: siheung('0517030200') }],
  },

  // ---- 교육·상담 ----
  {
    code: 'support-1345',
    category: 'support',
    title: l(
      '외국인종합안내센터 1345',
      'Immigration Contact Center 1345',
      '外国人综合服务中心 1345',
      'Trung tâm hỗ trợ người nước ngoài 1345',
    ),
    summary: l(
      '체류·비자 같은 생활 문의를 20개 언어로 상담해요. 국번 없이 1345로 전화해요.',
      'Ask about stay, visas and daily life in 20 languages. Call 1345 without an area code.',
      '可用20种语言咨询居留、签证等生活问题。直接拨打1345，无需区号。',
      'Tư vấn về lưu trú, visa và đời sống bằng 20 ngôn ngữ. Gọi 1345, không cần mã vùng.',
    ),
    points: [
      l(
        '평일 09:00~22:00에 운영하고, 18시 이후에는 한국어·영어·중국어만 돼요.',
        'Open weekdays 09:00–22:00. After 18:00, only Korean, English and Chinese are available.',
        '工作日09:00~22:00运营，18点后仅提供韩语、英语和中文服务。',
        'Hoạt động ngày thường 09:00–22:00; sau 18:00 chỉ có tiếng Hàn, Anh và Trung.',
      ),
      l(
        '해외에서는 +82-2-1345로 걸어요.',
        'From abroad, call +82-2-1345.',
        '在海外请拨打 +82-2-1345。',
        'Từ nước ngoài, gọi +82-2-1345.',
      ),
    ],
    facts: {
      contact: l('1345', '1345', '1345', '1345'),
    },
    sources: [
      {
        name: '법무부 외국인종합안내센터',
        url: 'https://www.immigration.go.kr/immigration/1530/subview.do',
      },
    ],
  },
  {
    code: 'support-welfare-center',
    category: 'support',
    title: l(
      '시흥시외국인복지센터',
      'Siheung Foreign Residents Welfare Center',
      '始兴市外国人福利中心',
      'Trung tâm Phúc lợi Người nước ngoài Siheung',
    ),
    summary: l(
      '정왕동에서 외국인 주민을 위한 상담·교육·복지·문화 프로그램을 운영해요.',
      'Runs counseling, education, welfare and culture programs for foreign residents in Jeongwang-dong.',
      '在正往洞为外国人居民提供咨询、教育、福利和文化项目。',
      'Tổ chức tư vấn, giáo dục, phúc lợi và văn hóa cho cư dân nước ngoài tại Jeongwang-dong.',
    ),
    points: [
      l(
        '평일 09:00~18:00 (점심 12:00~13:00), 토요일은 쉬어요.',
        'Weekdays 09:00–18:00 (lunch 12:00–13:00). Closed on Saturday.',
        '工作日09:00~18:00（午休12:00~13:00），周六休息。',
        'Ngày thường 09:00–18:00 (nghỉ trưa 12:00–13:00), nghỉ thứ Bảy.',
      ),
    ],
    facts: {
      where: l(
        '경기도 시흥시 공단1대로259번길 5 (정왕동)',
        '5 Gongdan 1-daero 259beon-gil, Siheung (Jeongwang-dong)',
        '京畿道始兴市工团1大路259号街5（正往洞）',
        '5 Gongdan 1-daero 259beon-gil, Siheung (Jeongwang-dong)',
      ),
      contact: l(
        '031-434-0411',
        '031-434-0411',
        '031-434-0411',
        '031-434-0411',
      ),
    },
    sources: [{ name: '시흥시외국인복지센터', url: 'https://www.shmwc.or.kr' }],
  },
  {
    code: 'support-family',
    category: 'support',
    title: l(
      '다누리콜센터·가족센터',
      'Danuri Call Center and Family Center',
      'Danuri呼叫中心·家庭中心',
      'Tổng đài Danuri và Trung tâm Gia đình',
    ),
    summary: l(
      '다문화가족은 다누리콜센터(1577-1366)에서 365일 24시간 15개 언어로 상담받을 수 있어요.',
      'Multicultural families can get counseling in 15 languages, 24 hours a day, every day, at the Danuri Call Center (1577-1366).',
      '多元文化家庭可通过Danuri呼叫中心（1577-1366）全年24小时以15种语言接受咨询。',
      'Gia đình đa văn hóa được tư vấn bằng 15 ngôn ngữ, 24 giờ mỗi ngày, cả năm tại Tổng đài Danuri (1577-1366).',
    ),
    points: [
      l(
        '다누리콜센터는 생활 정보, 3자 통화 통역, 폭력 피해 긴급 지원, 가족 상담을 해요.',
        'Danuri offers daily-life information, three-way interpreting calls, emergency help for violence victims and family counseling.',
        'Danuri提供生活信息、三方通话翻译、暴力受害紧急支援和家庭咨询。',
        'Danuri cung cấp thông tin đời sống, phiên dịch qua cuộc gọi ba bên, hỗ trợ khẩn cấp cho nạn nhân bạo lực và tư vấn gia đình.',
      ),
      l(
        '시흥시 가족센터는 결혼이민자와 중도입국 자녀에게 3월~12월 한국어 교육을 해요.',
        'Siheung Family Center teaches Korean to marriage migrants and children who came to Korea later, from March to December.',
        '始兴市家庭中心于3月至12月为结婚移民者和中途入境子女提供韩语教育。',
        'Trung tâm Gia đình Siheung dạy tiếng Hàn cho người nhập cư kết hôn và con nhập cảnh giữa chừng từ tháng 3 đến tháng 12.',
      ),
    ],
    facts: {
      where: l(
        '시흥시 가족센터: 시흥시 정왕천로449번길 51',
        'Siheung Family Center: 51 Jeongwangcheon-ro 449beon-gil, Siheung',
        '始兴市家庭中心：始兴市正往川路449号街51',
        'Trung tâm Gia đình Siheung: 51 Jeongwangcheon-ro 449beon-gil, Siheung',
      ),
      contact: l(
        '다누리콜센터 1577-1366 / 시흥시 가족센터 031-319-7997',
        'Danuri 1577-1366 / Siheung Family Center 031-319-7997',
        'Danuri 1577-1366 / 始兴市家庭中心 031-319-7997',
        'Danuri 1577-1366 / Trung tâm Gia đình Siheung 031-319-7997',
      ),
    },
    sources: [
      {
        name: '다누리 — 다누리콜센터 안내',
        url: 'https://www.liveinkorea.kr/portal/KOR/page/contents.do?menuSeq=6652&pageSeq=161',
      },
      {
        name: '시흥시 가족센터 오시는 길',
        url: 'https://shcity.familynet.or.kr/center/lay1/program/S295T315C321/center_info/view.do',
      },
      { name: '시흥시 다문화가족 지원사업', url: siheung('0205020000') },
    ],
  },
  {
    code: 'support-work',
    category: 'support',
    title: l(
      '일자리·근로 상담',
      'Work and job counseling',
      '工作·劳动咨询',
      'Tư vấn việc làm và lao động',
    ),
    summary: l(
      '외국인 근로자의 고용·생활 고충은 외국인력상담센터(1577-0071)에서 상담해요.',
      'Foreign workers can get help with work and daily-life problems at the Foreign Workforce Counseling Center (1577-0071).',
      '外国人劳动者的雇佣和生活困扰可向外国人力咨询中心（1577-0071）咨询。',
      'Lao động nước ngoài được tư vấn về việc làm và đời sống tại Trung tâm Tư vấn Nhân lực Nước ngoài (1577-0071).',
    ),
    points: [
      l(
        '시흥고용센터 외국인력팀은 별관(마유로418번길 10, 310호)에 있어요. 평일 09:00~18:00.',
        'The foreign workforce team of Siheung Employment Center is in the annex (10 Mayu-ro 418beon-gil, room 310). Weekdays 09:00–18:00.',
        '始兴就业中心外国人力组位于别馆（马游路418号街10，310室），工作日09:00~18:00。',
        'Tổ nhân lực nước ngoài của Trung tâm Việc làm Siheung ở tòa phụ (10 Mayu-ro 418beon-gil, phòng 310). Ngày thường 09:00–18:00.',
      ),
    ],
    facts: {
      contact: l(
        '외국인력상담센터 1577-0071 / 시흥고용센터 외국인력팀 031-496-1922',
        'Foreign Workforce Counseling Center 1577-0071 / Siheung Employment Center foreign workforce team 031-496-1922',
        '外国人力咨询中心 1577-0071 / 始兴就业中心外国人力组 031-496-1922',
        'Trung tâm Tư vấn Nhân lực Nước ngoài 1577-0071 / Tổ nhân lực nước ngoài, Trung tâm Việc làm Siheung 031-496-1922',
      ),
    },
    sources: [
      {
        name: '한국산업인력공단 외국인력상담센터',
        url: 'https://www.hrdkorea.or.kr/1/3/3/4',
      },
      {
        name: '시흥고용센터 찾아오시는 길',
        url: 'https://www.work.go.kr/siheung/ctrIntro/guideMap/guideMap.do',
      },
    ],
  },
]

/**
 * 자주 묻는 질문. The first five are Figma M06 "TOP 5" (answers repeat checked
 * facts from the rule); the rest are listed under "전체 보기".
 */
export const ruleFaqs: RuleFaq[] = [
  {
    rule: 'waste-food',
    question: l(
      '음식물 쓰레기는 어디에 버려요?',
      'Where do I throw away food waste?',
      '厨余垃圾扔在哪里？',
      'Rác thực phẩm bỏ ở đâu?',
    ),
    answer: l(
      '노란색 음식물 봉투나 칩을 꽂은 전용 용기, RFID 기기에 일~금요일에 내요. 뼈·조개껍데기·달걀 껍데기는 일반 쓰레기예요.',
      'Use a yellow food waste bag, a bin with a chip or an RFID machine, Sunday to Friday. Bones, shells and eggshells are general waste.',
      '周日至周五投放到黄色厨余袋、插卡专用桶或RFID设备。骨头、贝壳、蛋壳属于一般垃圾。',
      'Bỏ vào túi rác thực phẩm màu vàng, thùng có chip hoặc máy RFID từ Chủ nhật đến thứ Sáu. Xương, vỏ sò, vỏ trứng là rác thông thường.',
    ),
  },
  {
    rule: 'waste-bulky',
    question: l(
      '가구·매트리스는 어떻게 버려요?',
      'How do I throw away furniture or a mattress?',
      '家具、床垫怎么扔？',
      'Bỏ đồ nội thất, nệm như thế nào?',
    ),
    answer: l(
      '스마트클린 시흥에서 신청해 수수료를 내거나, 판매소에서 납부필증 스티커를 사서 붙여요. 냉장고·세탁기 같은 폐가전은 1599-0903으로 무상 수거를 신청해요.',
      'Apply and pay on Smart Clean Siheung, or buy a fee sticker at a shop and attach it. For old appliances like refrigerators or washing machines, call 1599-0903 for free pickup.',
      '在“智能清洁始兴”申请缴费，或在销售点购买缴费贴纸贴上。冰箱、洗衣机等废旧家电拨打1599-0903申请免费回收。',
      'Đăng ký và trả phí trên Smart Clean Siheung, hoặc mua tem nộp phí ở cửa hàng rồi dán. Đồ điện cũ như tủ lạnh, máy giặt gọi 1599-0903 để thu gom miễn phí.',
    ),
  },
  {
    rule: 'traffic-alert',
    question: l(
      '주정차 단속 알림은 어떻게 받아요?',
      'How do I get parking enforcement alerts?',
      '如何接收违停执法提醒？',
      'Làm sao nhận thông báo kiểm tra đỗ xe?',
    ),
    answer: l(
      '시흥시는 2026년 4월 1일부터 휘슬 앱으로 사전알림을 보내요. 문의는 휘슬 고객센터 1599-6270이에요.',
      'Since 1 April 2026, Siheung sends advance alerts through the Whistle app. Whistle help line: 1599-6270.',
      '始兴市自2026年4月1日起通过Whistle应用发送提前提醒。咨询：Whistle客服 1599-6270。',
      'Từ ngày 1/4/2026, Siheung gửi thông báo trước qua ứng dụng Whistle. Hỗ trợ: 1599-6270.',
    ),
  },
  {
    rule: 'tax-resident',
    question: l(
      '주민세는 누가 내요?',
      'Who pays the resident tax?',
      '谁需要缴纳居民税？',
      'Ai phải nộp thuế cư trú?',
    ),
    answer: residentTaxSummary,
  },
  {
    rule: 'order-noise',
    question: l(
      '이웃 소음 문제는 어디에 물어봐요?',
      'Who can help with noise from neighbors?',
      '邻居噪音问题向哪里咨询？',
      'Hỏi ở đâu khi hàng xóm gây ồn?',
    ),
    answer: l(
      '아파트라면 관리사무소에 먼저 알리고, 해결되지 않으면 층간소음 이웃사이센터 1661-2642(평일 09:00~18:00)에 상담을 신청해요.',
      'In an apartment, tell the management office first. If that does not solve it, call the Floor Noise Neighbor Center at 1661-2642 (weekdays 09:00–18:00).',
      '住公寓的话先告知管理处，仍未解决可拨打楼层噪音邻里中心1661-2642（工作日09:00~18:00）申请咨询。',
      'Nếu ở chung cư, hãy báo ban quản lý trước. Nếu chưa giải quyết được, gọi Trung tâm láng giềng về tiếng ồn 1661-2642 (ngày thường 09:00–18:00).',
    ),
  },
  // ---- 전체 보기: one question per remaining rule ----
  // The answer is the rule's checked summary, so no new facts are added.
  fromRule(
    'order-smoking',
    l(
      '담배는 어디서 피우면 안 돼요?',
      'Where am I not allowed to smoke?',
      '哪里不能吸烟？',
      'Không được hút thuốc ở đâu?',
    ),
  ),
  fromRule(
    'waste-general',
    l(
      '일반 쓰레기는 언제, 어떻게 내놓아요?',
      'When and how do I put out general waste?',
      '一般垃圾什么时候、怎么扔？',
      'Bỏ rác thông thường khi nào và như thế nào?',
    ),
  ),
  fromRule(
    'waste-recycle',
    l(
      '페트병·캔·비닐은 어떻게 분리배출해요?',
      'How do I sort PET bottles, cans and plastic bags?',
      'PET瓶、易拉罐、塑料袋怎么分类投放？',
      'Phân loại chai nhựa, lon và túi ni lông như thế nào?',
    ),
  ),
  fromRule(
    'traffic-parking',
    l(
      '어디에 차를 세우면 과태료가 나와요?',
      'Where will I get a fine for parking?',
      '车停在哪里会被罚款？',
      'Đỗ xe ở đâu thì bị phạt tiền?',
    ),
  ),
  fromRule(
    'tax-property',
    l(
      '재산세는 언제 내요?',
      'When do I pay property tax?',
      '财产税什么时候缴？',
      'Khi nào nộp thuế tài sản?',
    ),
  ),
  fromRule(
    'tax-car',
    l(
      '자동차세는 언제 내요?',
      'When do I pay car tax?',
      '汽车税什么时候缴？',
      'Khi nào nộp thuế ô tô?',
    ),
  ),
  fromRule(
    'tax-payment',
    l(
      '세금은 어떻게 내고, 늦으면 어떻게 돼요?',
      'How do I pay taxes, and what if I pay late?',
      '税怎么缴？晚缴会怎样？',
      'Nộp thuế thế nào và nếu nộp trễ thì sao?',
    ),
  ),
  fromRule(
    'living-siru',
    l(
      '시흥화폐 시루는 뭐예요?',
      'What is Siru, the Siheung local currency?',
      '始兴地区货币Siru是什么？',
      'Siru, tiền địa phương của Siheung là gì?',
    ),
  ),
  fromRule(
    'living-bike',
    l(
      '자전거는 어디서 빌려요?',
      'Where can I rent a bicycle?',
      '在哪里租自行车？',
      'Thuê xe đạp ở đâu?',
    ),
  ),
  fromRule(
    'support-1345',
    l(
      '체류·비자는 어디에 물어봐요?',
      'Where can I ask about my stay or visa?',
      '居留、签证问题向哪里咨询？',
      'Hỏi về lưu trú, thị thực ở đâu?',
    ),
  ),
  fromRule(
    'support-welfare-center',
    l(
      '외국인 주민을 돕는 곳이 시흥에 있어요?',
      'Is there a place in Siheung that helps foreign residents?',
      '始兴有帮助外国居民的地方吗？',
      'Ở Siheung có nơi hỗ trợ cư dân nước ngoài không?',
    ),
  ),
  fromRule(
    'support-family',
    l(
      '다문화가족은 어디서 상담받아요?',
      'Where can multicultural families get counseling?',
      '多文化家庭在哪里咨询？',
      'Gia đình đa văn hóa được tư vấn ở đâu?',
    ),
  ),
  fromRule(
    'support-work',
    l(
      '일하다 생긴 고민은 어디에 물어봐요?',
      'Where can I ask about problems at work?',
      '工作中遇到的问题向哪里咨询？',
      'Hỏi ở đâu khi gặp khó khăn trong công việc?',
    ),
  ),
]

/** A FAQ whose answer is the rule's own checked summary. */
function fromRule(rule: string, question: Localized): RuleFaq {
  const entry = ruleEntries.find((item) => item.code === rule)
  if (!entry) throw new Error(`Unknown rule for FAQ: ${rule}`)
  return { rule, question, answer: entry.summary }
}
