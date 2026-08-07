// Default user profile data for NOBO ERP
export const DEFAULT_USER = {
  name: "شريف رضا",
  role: "systemAdmin",
  avatarSeed: "Sherif",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sherif",
  email: "sherif@nobo.sa",
  phone: "+966 50 123 4567",
  company: "شركة NOBO التقنية",
};

export const PRESET_AVATARS = [
  "Sherif",
  "Nobo",
  "Ahmed",
  "Sara",
  "Omar",
  "Laila",
];

const STORAGE_KEY = "nobo-user";

export function loadUser() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const avatar = parsed.avatar || buildAvatar(parsed.avatarSeed);
      return { ...DEFAULT_USER, ...parsed, avatar };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_USER };
}

export function saveUser(user) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function buildAvatar(seed) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}
