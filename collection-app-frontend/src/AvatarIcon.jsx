export const AVATAR_OPTIONS = [
  { key: 'avatar1', label: 'Kitap Kurdu' },
  { key: 'avatar2', label: 'Sinefil' },
  { key: 'avatar3', label: 'Anime Otaku' },
  { key: 'avatar4', label: 'Aksiyon Delisi' },
  { key: 'avatar5', label: 'Duygusal Tip' },
  { key: 'avatar6', label: 'Gizem Çözücü' },
]

function AvatarIcon({ avatarKey, size = 72 }) {
  const option = AVATAR_OPTIONS.find(o => o.key === avatarKey) || AVATAR_OPTIONS[0]

  return (
    <img
      src={`/avatars/${option.key}.jpg`}
      alt={option.label}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover'
      }}
    />
  )
}

export default AvatarIcon