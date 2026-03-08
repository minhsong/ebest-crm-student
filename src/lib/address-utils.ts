/**
 * Tiền tố địa danh hành chính Việt Nam (bỏ khi hiển thị).
 * Thứ tự ưu tiên: chuỗi dài trước (Thành phố trước Tỉnh).
 */
const PREFIXES = [
  'Thành phố ',
  'Tỉnh ',
  'Quận ',
  'Huyện ',
  'Thị xã ',
  'Phường ',
  'Xã ',
  'Thị trấn ',
];

/**
 * Bỏ tiền tố địa danh (Thành phố, Tỉnh, Phường, Xã, ...) để chỉ hiển thị tên.
 * VD: "Thành phố Hà Nội" → "Hà Nội", "Phường Ba Đình" → "Ba Đình"
 */
export function stripAddressPrefix(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') return fullName;
  let name = fullName.trim();
  for (const prefix of PREFIXES) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length).trim();
      break;
    }
  }
  return name || fullName;
}
