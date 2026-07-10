export const countryContacts = [
  { country: "Sri Lanka", flag: "🇱🇰", displayPhone: "074 1266 855", whatsappNumber: "94741266855" },
  { country: "Dubai", flag: "🇦🇪", displayPhone: "054 370 2924", whatsappNumber: "971543702924" },
  { country: "Qatar", flag: "🇶🇦", displayPhone: "+974 5028 7593", whatsappNumber: "97450287593" },
  { country: "Italy", flag: "🇮🇹", displayPhone: "+39 344 478 8089", whatsappNumber: "393444788089" },
  { country: "Japan", flag: "🇯🇵", displayPhone: "+81 80 6023 4062", whatsappNumber: "818060234062" },
  { country: "Kuwait", flag: "🇰🇼", displayPhone: "+965 41067376", whatsappNumber: "96541067376" },
  { country: "UK", flag: "🇬🇧", displayPhone: "+44 7900 135185", whatsappNumber: "447900135185" },
  { country: "Maldives", flag: "🇲🇻", displayPhone: "+960 938 5835", whatsappNumber: "9609385835" },
  { country: "France", flag: "🇫🇷", displayPhone: "+33 7 69 27 39 16", whatsappNumber: "33769273916" },
  { country: "Canada", flag: "🇨🇦", displayPhone: "+1 (437) 450-4322", whatsappNumber: "14374504322" },
] as const;

export type CountryContact = (typeof countryContacts)[number];
