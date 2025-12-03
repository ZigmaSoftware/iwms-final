import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      common: {
        appName: "Integrated Waste Management System",
        language_en: "English",
        language_ta: "Tamil",
        logout: "Logout",
      },
      login: {
        title: "Welcome Back",
        subtitle: "Sign in to access your workspace",
        username: "Username",
        username_placeholder: "sathya",
        password: "Password",
        password_placeholder: "********",
        forgot_password: "Forgot Password?",
        sign_in: "Sign In",
        authenticating: "Authenticating…",
        left_title: "Transforming City Operations",
        left_text:
          "Experience a cleaner, faster workflow designed for modern field operations.",
        rnd_shortcuts_label: "R&D shortcuts",
        rnd_dashboard: "Open dashboard (dummy)",
        rnd_admin: "Open admin (dummy)",
      },
      dashboard: {
        header: "Operations Dashboard",
        subheader:
          "Real-time view of waste collection, workforce, and citizen touchpoints.",
        kpi_collections: "Total Collections Today",
        kpi_efficiency: "Collection Efficiency",
        kpi_grievances: "Citizen Grievances Open",
        kpi_workforce: "Active Workforce",
        kpi_delta_collections: "+12 vs yesterday",
        kpi_delta_efficiency: "+3% this week",
        kpi_delta_grievances: "-5 in last 24h",
        kpi_delta_workforce: "On duty now",
        tab_routes: "Route performance",
        tab_grievances: "Citizen grievances",
        tab_analytics: "Weekly analytics",
        routes_card_title: "Route performance",
        grievances_card_title: "Citizen grievances risk view",
        analytics_card_title: "Weekly operating snapshot",
        refresh: "Refresh data",
        live_sync: "Live sync enabled",
        no_charts_placeholder:
          "Plug your charts here (Recharts or similar). Placeholder to validate flow.",
      },
      admin: {
        header: "Admin & Master Control",
        subheader:
          "Configure core master data and keep every module aligned.",
        global_settings: "Global settings",
        module_geo: "Geo Masters",
        module_geo_desc:
          "Continents, countries, cities, wards, zones.",
        module_staff: "Staff & Workforce",
        module_staff_desc: "Staff master and workforce mapping.",
        module_fleet: "Transport & Fleet",
        module_fleet_desc: "Vehicle master and fleet categorisation.",
        module_access: "User Access",
        module_access_desc: "User creation and role-based access.",
        configure: "Configure",
        pending_title: "Pending configuration items",
        pending_tag: "Admin view",
        table_module: "Module / Definition",
        table_owner: "Owner",
        table_status: "Status",
        status_not_started: "Not started",
        status_in_progress: "In progress",
        status_planned: "Planned",
      },
    },
  },
  ta: {
    translation: {
      common: {
        appName: "ஒன்றுபட்ட கழிவு மேலாண்மை அமைப்பு",
        language_en: "ஆங்கிலம்",
        language_ta: "தமிழ்",
        logout: "லாக் அவுட்",
      },
      login: {
        title: "மீண்டும் வரவேற்கிறோம்",
        subtitle: "உங்கள் பணியிடத்தை அணுக உள்நுழைக",
        username: "பயனர் பெயர்",
        username_placeholder: "aakash",
        password: "கடவுச்சொல்",
        password_placeholder: "********",
        forgot_password: "கடவுச்சொல்லை மறந்துவிட்டீர்களா?",
        sign_in: "உள்நுழை",
        authenticating: "உறுதி செய்கிறோம்…",
        left_title: "நகர செயல்பாடுகளை மாற்றும் தீர்வு",
        left_text:
          "தள செயல்பாடுகளுக்காக வடிவமைக்கப்பட்ட விரைவான மற்றும் சுத்தமான பணிச் சுழற்சியை அனுபவிக்கவும்.",
        rnd_shortcuts_label: "R&D விரைவு அணுகல்",
        rnd_dashboard: "டாஷ்போர்டுக்கு செல்ல (டம்மி)",
        rnd_admin: "நிர்வாகத்திற்கு செல்ல (டம்மி)",
      },
      dashboard: {
        header: "செயல்பாட்டு டாஷ்போர்டு",
        subheader:
          "கழிவு சேகரிப்பு, பணியாளர்கள் மற்றும் குடிமக்கள் தொடர்புகளின் நேரடி காட்சி.",
        kpi_collections: "இன்றைய மொத்த சேகரிப்புகள்",
        kpi_efficiency: "சேகரிப்பு திறன்",
        kpi_grievances: "திறந்த புகார்கள்",
        kpi_workforce: "செயலில் உள்ள பணியாளர்கள்",
        kpi_delta_collections: "நேற்றை விட +12",
        kpi_delta_efficiency: "இந்த வாரம் +3%",
        kpi_delta_grievances: "கடைசி 24மணிநேரத்தில் -5",
        kpi_delta_workforce: "தற்போது பணியில்",
        tab_routes: "ரூட் செயல்திறன்",
        tab_grievances: "குடிமக்கள் புகார்கள்",
        tab_analytics: "வாராந்திர பகுப்பாய்வு",
        routes_card_title: "ரூட் செயல்திறன்",
        grievances_card_title: "குடிமக்கள் புகார்கள் அபாயக் காட்சி",
        analytics_card_title: "வாராந்திர செயல்பாட்டு சுருக்கம்",
        refresh: "தரவுகளை புதுப்பிக்க",
        live_sync: "நேரடி ஒத்திசைவு இயக்கத்தில் உள்ளது",
        no_charts_placeholder:
          "இங்கே உங்கள் சார்ட்களை இணைக்கவும். தற்போது சோதனைக்கான இடம்தான்.",
      },
      admin: {
        header: "நிர்வாகம் & மாஸ்டர் கட்டுப்பாடு",
        subheader:
          "அடிப்படை மாஸ்டர் தரவை ஒருமுறை அமைத்தால் அனைத்து மாட்யூல்கள் ஒத்திசைவு பெறும்.",
        global_settings: "சார்வதேச அமைப்புகள்",
        module_geo: "புவியியல் மாஸ்டர்கள்",
        module_geo_desc:
          "கண்டம், நாடு, நகரம், வார்டு, மண்டலம் உள்ளிட்டவை.",
        module_staff: "பணியாளர் & வொர்க்ஃபோர்ஸ்",
        module_staff_desc: "பணியாளர் மாஸ்டர் மற்றும் பணியாளர் ஒதுக்கீடு.",
        module_fleet: "போக்குவரத்து & வாகனங்கள்",
        module_fleet_desc: "வாகன மாஸ்டர் மற்றும் வகைப்பாடு.",
        module_access: "பயனர் அணுகல்",
        module_access_desc: "பயனர் உருவாக்கம் மற்றும் ரோல் அடிப்படையிலான அணுகல்.",
        configure: "அமைப்பு செய்",
        pending_title: "நிலுவை உள்ள அமைப்புகள்",
        pending_tag: "நிர்வாக பார்வை",
        table_module: "மாட்யூல் / வரையறை",
        table_owner: "பெறுப்பாளர்",
        table_status: "நிலை",
        status_not_started: "தொடங்கவில்லை",
        status_in_progress: "நடைபெறுகிறது",
        status_planned: "திட்டமிடப்பட்டது",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "ta"],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
