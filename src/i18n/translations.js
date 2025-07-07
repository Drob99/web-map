/**
 * @module translations
 * @description Centralized translation management following Single Responsibility Principle
 */

/**
 * Number translations for different languages
 * @type {Object<string, Object<string, string>>}
 */
export const numberTranslations = {
    EN: {
      0: "0", 1: "1", 2: "2", 3: "3", 4: "4",
      5: "5", 6: "6", 7: "7", 8: "8", 9: "9",
    },
    ZN: {
      0: "0", 1: "1", 2: "2", 3: "3", 4: "4",
      5: "5", 6: "6", 7: "7", 8: "8", 9: "9",
    },
    AR: {
      0: "٠", 1: "١", 2: "٢", 3: "٣", 4: "٤",
      5: "٥", 6: "٦", 7: "٧", 8: "٨", 9: "٩",
    },
  };
  
  /**
   * Terminal translations
   * @type {Object<string, Object<string, string>>}
   */
  export const terminalTranslations = {
    EN: {
      Terminals: "Terminals",
      "Terminal 1": "Terminal 1",
      "Terminal 2": "Terminal 2",
      "Terminal 3": "Terminal 3",
      "Terminal 4": "Terminal 4",
      "Terminal 5": "Terminal 5",
    },
    AR: {
      Terminals: "الصالات",
      "Terminal 1": "صالة 1",
      "Terminal 2": "صالة 2",
      "Terminal 3": "صالة 3",
      "Terminal 4": "صالة 4",
      "Terminal 5": "صالة 5",
    },
    ZN: {
      Terminals: "端子",
      "Terminal 1": "终端 1",
      "Terminal 2": "终端 2",
      "Terminal 3": "终端 3",
      "Terminal 4": "终端 4",
      "Terminal 5": "终端 5",
    },
  };
  
  /**
   * Category translations
   * @type {Object<string, Object<string, string>>}
   */
  export const categoryTranslations = {
    EN: {
      Shops: "Shops",
      Dine: "Dine",
      Services: "Services",
      "Parking & Transportation": "Parking & Transportation",
      Baggage: "Baggage",
      Checkin: "Checkin",
      "Check-in": "Check-in",
      "Self Services": "Self Services",
      "Banks - ATM - Exchange": "Banks - ATM - Exchange",
      "Boarding Gates": "Boarding Gates",
      Lounges: "Lounges",
      Assistance: "Assistance",
      "Ask me Counters": "Ask me Counters",
      "Mother services": "Mother services",
      "Medical Services": "Medical Services",
      "Security & Customs": "Security & Customs",
      Airlines: "Airlines",
      Toilets: "Toilets",
      "Prayer Rooms": "Prayer Rooms",
      "Airport Entrances": "Airport Entrances",
      "Airport Exit gates": "Airport Exit gates",
      "Arrival Gates": "Arrival Gates",
      Elevators: "Elevators",
      Escalators: "Escalators",
      Stairs: "Stairs",
      Others: "Others",
    },
    AR: {
      Shops: "المتاجر",
      Dine: "المطاعم والمشروبات",
      Services: "الخدمات",
      "Parking & Transportation": "مواقف السيارات والنقل",
      Baggage: "الأمتعة",
      Checkin: "تسجيل الوصول",
      "Check-in": "تسجيل الوصول",
      "Self Services": "الخدمات الذاتية",
      "Banks - ATM - Exchange": "البنوك - الصراف الآلي - الصرافة",
      "Boarding Gates": "بوابات الصعود",
      Lounges: "الصالات",
      Assistance: "مساعدة الاحتياجات الخاصة",
      "Ask me Counters": "كاونترات اسألني",
      "Mother services": "خدمات الأمومة",
      "Medical Services": "الخدمات الطبية",
      "Security & Customs": "الأمن والجمارك",
      Airlines: "خطوط الطيران",
      Toilets: "دورات المياه",
      "Prayer Rooms": "مصلى",
      "Airport Entrances": "بوابات دخول المطار",
      "Airport Exit gates": "بوابات الخروج من المطار",
      "Arrival Gates": "بوابات الوصول",
      Elevators: "المصاعد",
      Escalators: "سلم كهربائي",
      Stairs: "درج",
      Others: "أخرى",
    },
    ZN: {
      Shops: "商店",
      Dine: "用餐",
      Services: "服务",
      "Parking & Transportation": "停车和交通",
      Baggage: "行李",
      Checkin: "值机",
      "Check-in": "值机",
      "Self Services": "自助服务",
      "Banks - ATM - Exchange": "银行 - ATM - 兑换",
      "Boarding Gates": "登机口",
      Lounges: "休息室",
      Assistance: "特殊协助",
      "Ask me Counters": "咨询柜台",
      "Mother services": "母婴服务",
      "Medical Services": "医疗服务",
      "Security & Customs": "安检与海关",
      Airlines: "航空公司",
      Toilets: "洗手间",
      "Prayer Rooms": "祈禱室",
      "Airport Entrances": "机场入口",
      "Airport Exit gates": "机场出口大门",
      "Arrival Gates": "到达登机口",
      Elevators: "电梯",
      Escalators: "自动扶梯",
      Stairs: "楼梯",
      Others: "其他的",
    },
  };
  
  /**
   * Static UI translations
   * @type {Object<string, Object<string, string>>}
   */
  export const staticTranslations = {
    EN: {
      Back: "Back",
      Search: "Search",
      Categories: "Categories",
      Languages: "Languages",
      "Nearby Places": "Nearby Places",
      "Choose starting point": "Choose starting point",
      "Choose destination point": "Choose destination point",
      "Get directions": "Get directions",
      Close: "Close",
      meter: "meter",
      sec: "sec",
      min: "min",
      Km: "Km",
    },
    AR: {
      Back: "رجوع",
      Search: "بحث",
      Categories: "الفئات",
      Languages: "اللغات",
      "Nearby Places": "الأماكن القريبة",
      "Choose starting point": "اختر نقطة البداية",
      "Choose destination point": "اختر نقطة الوصول",
      "Get directions": "الحصول على الاتجاهات",
      Close: "إغلاق",
      meter: "متر",
      sec: "ثانية",
      min: "دقيقة",
      Km: "كيلومتر",
    },
    ZN: {
      Back: "返回",
      Search: "搜索",
      Categories: "类别",
      Languages: "语言",
      "Nearby Places": "附近地点",
      "Choose starting point": "选择起点",
      "Choose destination point": "选择目的地",
      "Get directions": "获取路线",
      Close: "关闭",
      meter: "仪表",
      sec: "第二",
      min: "分钟",
      Km: "公里",
    },
  };
  
  /**
   * Floor name translations
   * @type {Object<string, Object<string, string>>}
   */
  export const floorTranslations = {
    EN: {
      "-5": "Basement 5th Floor",
      "-4": "Basement 4th Floor",
      "-3": "Basement 3rd Floor",
      "-2": "Basement 2nd Floor",
      "-1": "Basement Floor",
      "0": "Ground Floor",
      "1": "First Floor",
      "2": "Second Floor",
      "3": "Third Floor",
      "4": "Fourth Floor",
      "5": "Fifth Floor",
    },
    AR: {
      "-5": "الدور السفلي الخامس",
      "-4": "الدور السفلي الرابع",
      "-3": "الدور السفلي الثالث",
      "-2": "الدور السفلي الثاني",
      "-1": "الدور السفلي الأول",
      "0": "الدور الأرضي",
      "1": "الدور الأول",
      "2": "الدور الثاني",
      "3": "الدور الثالث",
      "4": "الدور الرابع",
      "5": "الدور الخامس",
    },
    ZN: {
      "-5": "地下五层",
      "-4": "地下四层",
      "-3": "地下三层",
      "-2": "地下二层",
      "-1": "地下一层",
      "0": "底楼",
      "1": "一楼",
      "2": "二楼",
      "3": "三楼",
      "4": "四楼",
      "5": "五楼",
    },
  };