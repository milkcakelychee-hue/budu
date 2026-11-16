// ข้อความบนหน้าจอทั้งหมด · ตาม APP_SPEC.md หัวข้อ 6 ทุกตัวอักษร (ร่างคำ แก้ได้ที่ไฟล์นี้ที่เดียว)
// ค่าใน {} เติมด้วยฟังก์ชัน t()

export const S = {
  logo: 'BuDu',

  // วันที่บนหัวหน้า: {วัน} {วันที่} {เดือน}
  weekdays: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
  months: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],

  // เริ่มต้นใช้
  welcomeTitle: 'ยินดีต้อนรับสู่ BuDu',
  welcomeBody: 'เก็บแต้มความดีของเราสองคน ทำดีได้แต้ม แต้มสะสมไปแลกรางวัลได้ ข้อมูลซิงก์ถึงกันด้วยรหัสจับคู่ ไม่ต้องสมัครบัญชี',
  welcomeInstall: 'ก่อนเริ่ม กดปุ่มแชร์ใน Safari แล้วเลือก "เพิ่มไปยังหน้าจอโฮม" จากนั้นเปิดจากไอคอนบนหน้าโฮมเพื่อจับคู่',
  welcomeStart: 'เริ่มเลย',
  welcomeRejoin: 'เคยใช้แล้ว? เข้าอีกครั้ง',
  roleTitle: 'คุณคือใคร',
  roleAdminName: 'ปรายฟ้า',
  roleAdminDesc: 'ผู้ดูแลแต้ม — ให้แต้ม หักแต้ม และยืนยันรายการ',
  rolePartnerName: 'เตย',
  rolePartnerDesc: 'แฟน — สะสมแต้มและแลกรางวัล',
  next: 'ต่อไป',
  pairTitle: 'รหัสจับคู่ของเรา',
  pairDesc: 'ให้แฟนกรอกรหัสนี้ในแอปของเขา',
  pairCopy: 'คัดลอกรหัส',
  pairWaiting: 'รอแฟนเข้ามา...',
  pairDone: 'จับคู่สำเร็จ',
  enterApp: 'เข้าแอป',
  joinTitle: 'กรอกรหัสจับคู่',
  joinButton: 'จับคู่',
  joinWrong: 'รหัสไม่ถูกต้อง ลองตรวจอีกครั้ง',
  joinRoleTaken: 'บทบาทนี้มีคนใช้แล้ว ถ้าเคยใช้แอปนี้ ให้กด เข้าอีกครั้ง',
  rejoinTitle: 'เข้าด้วยรหัสเดิม',
  rejoinButton: 'เข้าอีกครั้ง',

  // แถบล่าง
  navDeduct: 'หักแต้ม',
  navRewards: 'รางวัล',
  navToday: 'วันนี้', // ปุ่มกลาง ไม่มีป้าย (ใช้เป็น aria-label)
  navStats: 'สถิติ',
  navSettings: 'ตั้งค่า',

  // วันนี้
  greeting: 'สวัสดี {name}',
  balanceLabel: 'แต้มสะสม',
  balanceTarget: 'อีก {n} แต้ม แลก {reward} ได้',
  balanceAllAffordable: 'แต้มพอแลกได้ทุกรางวัลแล้ว',
  balanceZero: 'ยังไม่มีแต้ม',
  viewRewards: 'ดูรางวัล',
  routinesTitle: 'กิจวัตรวันนี้',
  addActivityLink: '+ เพิ่มกิจกรรม',
  streakDays: 'ติดต่อกัน {n} วัน',
  perTime: 'ได้ต่อครั้ง',
  perTimeValue: '+{n} แต้ม',
  bonusLabel: 'ครบ 7 วัน ได้อีก',
  bonusValue: '+{b} แต้ม',
  dotsCount: '{n}/7',
  daysToBonus: 'อีก {n} วันรับโบนัส +{b}',
  giveToday: 'ให้แต้มวันนี้ +{n}',
  sendForConfirm: 'ทำแล้ว ส่งให้ยืนยัน +{n}',
  doneToday: 'ทำแล้ววันนี้',
  pending: 'รอยืนยัน',
  pendingTitle: 'รอยืนยัน',
  pendingPoints: '+{n} แต้ม',
  couponRequest: '{name}ขอใช้คูปอง',
  couponGiven: 'ให้รางวัลแล้ว',
  couponNotUsed: 'ยังไม่ใช้',
  confirm: 'ยืนยัน',
  reject: 'ไม่ผ่าน',
  todayEmptyAdmin: 'ยังไม่มีกิจกรรม เพิ่มกิจกรรมแรกเพื่อเริ่มให้แต้ม',
  todayEmptyAdminButton: 'เพิ่มกิจกรรม',
  todayEmptyPartner: 'ยังไม่มีกิจกรรม รอให้ผู้ดูแลเพิ่มก่อนนะ',

  // toast
  toastGiven: 'ให้ +{n} แต้มแล้ว',
  toastSent: 'ส่งให้ยืนยันแล้ว',
  toastDeducted: 'หัก −{n} แต้มแล้ว',
  toastRedeemed: 'แลกรางวัลแล้ว',

  // หักแต้ม
  deductTitle: 'หักแต้ม',
  deductWeekTotal: 'สัปดาห์นี้โดนหักรวม',
  deductWeekMeta: '{n} ครั้ง · สัปดาห์ก่อน −{m}',
  deductItems: 'เรื่องที่หักแต้ม',
  deductWeekCount: 'สัปดาห์นี้ {n} ครั้ง',
  deductHistory: 'ประวัติการโดนหักแต้ม',
  deductConfirmTitle: 'หักแต้มเรื่องนี้?',
  deductConfirmButton: 'หัก {n} แต้ม',
  cancel: 'ยกเลิก',
  deductEmpty: 'ยังไม่มีกิจกรรมหักแต้ม',
  deductEmptyButton: '+ เพิ่มกิจกรรมหักแต้ม',
  deductEmptyPartner: 'ยังไม่โดนหักแต้ม', // ผู้ใช้กำหนด 16 พ.ย. 2569

  // รางวัล
  rewardsTitle: 'รางวัล',
  couponsTab: 'คูปอง',
  redeem: 'แลกรางวัล',
  needMore: 'ต้องการอีก {n} แต้ม',
  redeemConfirm: 'แลก {reward} ด้วย {n} แต้ม?',
  redeemNow: 'แลกเลย',
  printing: 'กำลังพิมพ์คูปอง…',
  viewCoupon: 'ดูคูปอง',
  close: 'ปิด',
  rewardsEmpty: 'ยังไม่มีรางวัล',
  rewardsEmptyHint: 'เพิ่มรางวัลแรกในตั้งค่า',
  rewardsEmptyButton: 'จัดการรางวัล', // ผู้ใช้กำหนด 16 พ.ย. 2569
  couponsEmpty: 'ยังไม่มีคูปอง',
  points: 'แต้ม',

  // คูปอง
  couponHeader: 'BuDu · คูปอง',
  couponActive: 'ยังไม่ใช้',
  couponRequested: 'รอผู้ดูแลยืนยัน',
  couponUsed: 'ใช้แล้ว',
  redeemedAt: 'แลกเมื่อ',
  usedAt: 'ใช้เมื่อ',
  couponShowHint: 'โชว์หน้านี้ให้ผู้ดูแลเพื่อรับรางวัล',
  couponUse: 'ใช้คูปองนี้',
  couponSent: 'ส่งให้ผู้ดูแลยืนยันแล้ว',
  couponMarkUsed: 'ใช้แล้ว',
  couponMarkUsedConfirm: 'ทำเครื่องหมายว่าให้รางวัลแล้ว? ย้อนกลับไม่ได้',

  // สถิติ
  statsTitle: 'สถิติ',
  statsWeekly: 'แต้มรายสัปดาห์',
  statsEarned: 'ได้',
  statsDeducted: 'ถูกหัก',
  statsStreaks: 'streak ของแต่ละกิจกรรม',
  statsBadge: 'อีก {n} วัน · โบนัส +{b}',
  statsBadgeDone: 'ครบรอบ +{b}',
  statsThisWeek: 'สัปดาห์นี้',
  statsAllHistory: 'ดูประวัติทั้งหมด',
  statsEmpty: 'ยังไม่มีข้อมูล ลองให้แต้มสักรายการก่อน',

  // ประวัติ
  historyTitle: 'ประวัติ',
  kindEarn: 'ให้แต้ม',
  kindDeduct: 'หักแต้ม',
  kindBonus: 'โบนัส streak',
  kindRedeem: 'แลกรางวัล',
  statusPending: 'รอยืนยัน',
  statusRejected: 'ไม่ผ่าน',
  statusCancelled: 'ยกเลิกแล้ว',
  cancelEntry: 'ยกเลิกรายการ',
  cancelEntryConfirm: 'ยกเลิกรายการนี้? แต้มจะถูกปรับกลับ',
  historyEmpty: 'ยังไม่มีรายการ',

  // ตั้งค่า
  settingsTitle: 'ตั้งค่า',
  profile: 'โปรไฟล์',
  pairCode: 'รหัสจับคู่',
  manageActivities: 'จัดการกิจกรรม',
  manageRewards: 'จัดการรางวัล',
  exportData: 'ส่งออกข้อมูล',
  signOut: 'ออกจากเครื่องนี้',
  about: 'เกี่ยวกับแอป',
  signOutConfirm: 'ออกจากเครื่องนี้? ข้อมูลของเรายังอยู่ เข้าใหม่ได้ด้วยรหัสจับคู่',

  // ฟอร์มกิจกรรม
  activityAdd: 'เพิ่มกิจกรรม',
  activityEdit: 'แก้กิจกรรม',
  activityName: 'ชื่อกิจกรรม',
  activityNamePh: 'เช่น นอนก่อน 23.30',
  kindLabel: 'ชนิด',
  kindEarnOpt: 'ให้แต้ม',
  kindDeductOpt: 'หักแต้ม',
  pointsPerTime: 'แต้มต่อครั้ง',
  bonus7: 'โบนัสครบ 7 วัน',
  deductPerTime: 'แต้มที่หักต่อครั้ง',
  icon: 'ไอคอน',
  streakToggle: 'นับ streak',
  hideActivity: 'ซ่อนกิจกรรมนี้',
  save: 'บันทึก',
  bonusListLabel: 'โบนัส 7 วัน +{b}',
  activitiesEmpty: 'ยังไม่มีกิจกรรม', // สถานะว่างหน้าจัดการกิจกรรม (ตามภาพออกแบบ)
  hiddenBadge: 'ซ่อน',

  // ฟอร์มรางวัล
  rewardAdd: 'เพิ่มรางวัล',
  rewardEdit: 'แก้รางวัล',
  rewardName: 'ชื่อรางวัล',
  rewardNamePh: 'เช่น Sushiro ฟรี 1 มื้อ',
  rewardCost: 'แต้มที่ใช้แลก',
  hideReward: 'ซ่อนรางวัลนี้',
  deleteReward: 'ลบรางวัลนี้',
  deleteRewardTitle: 'ลบรางวัลนี้?',
  deleteRewardBody: '{reward} จะหายจากรายการรางวัล คูปองที่แลกไปแล้วยังอยู่',
  deleteRewardButton: 'ลบรางวัล',

  // ระบบ
  offline: 'ไม่มีอินเทอร์เน็ต ดูได้อย่างเดียว บันทึกไม่ได้',
  genericError: 'ทำไม่สำเร็จ ลองใหม่อีกครั้ง',
};

export function t(key, vars = {}) {
  const s = S[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}

// "จันทร์ 16 พฤศจิกายน" ตามเวลาไทย
export function thaiDate(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', weekday: 'short', day: 'numeric', month: 'numeric' })
    .formatToParts(d).map(x => [x.type, x.value]));
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return `${S.weekdays[wd]} ${p.day} ${S.months[Number(p.month) - 1]}`;
}
