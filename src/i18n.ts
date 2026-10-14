export type Lang = 'ja' | 'en'
export const T = {
  ja: {
    title: 'さくら抹茶の庭', sub: '小さな習慣で、庭が育つ。', garden: '庭', list: 'きょうのこと', add: '追加',
    placeholder: '例：水を一杯のむ', habit: '毎日の習慣', todo: 'きょうのToDo', plant: '育つ植物',
    streak: (n: number) => `${n}日連続`, best: (n: number) => `最長 ${n}日`, empty: 'まだ何もありません。小さなことから始めましょう。',
    summary: 'きょうのまとめ', sound: 'やさしい音', on: 'オン', off: 'オフ', del: '削除', undo: '取り消す',
    plants: (n: number) => `庭の植物 ${n}本`, today: (d: number, t: number) => `きょうは ${t}個中 ${d}個できました`,
    msgs: ['ゆっくりで大丈夫。ひとつ芽が出ればじゅうぶんです。', 'いい調子。庭がよろこんでいます。', 'あと少し。今日の庭がもうすぐ満開です。', '全部できました！今日の庭は満開です 🌸'],
    seasons: { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }, times: { dawn: '朝', day: '昼', dusk: '夕方', night: '夜' },
    names: { sakura: '桜', moss: '苔', bamboo: '竹', matcha: '茶の木', peony: '芍薬', fern: 'しだ' },
    foot: 'Universe 74 · 無料・広告なし・ログインなし。データはこの端末の中だけ。', streakAll: (n: number) => `庭の連続 ${n}日`,
    grown: '育ちました！',
  },
  en: {
    title: 'Sakura Matcha Garden', sub: 'Tiny habits, growing garden.', garden: 'Garden', list: 'Today', add: 'Add',
    placeholder: 'e.g. Drink a glass of water', habit: 'Daily habit', todo: 'To-do for today', plant: 'Grows a',
    streak: (n: number) => `${n}-day streak`, best: (n: number) => `best ${n}`, empty: 'Nothing here yet. Start with something tiny.',
    summary: "Today's summary", sound: 'Soft sound', on: 'On', off: 'Off', del: 'Delete', undo: 'Undo',
    plants: (n: number) => `${n} plants in the garden`, today: (d: number, t: number) => `${d} of ${t} done today`,
    msgs: ['No rush. One sprout is plenty.', 'Nice rhythm. The garden is happy.', 'Almost there. Today’s garden is nearly in full bloom.', 'All done! Full bloom today 🌸'],
    seasons: { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' }, times: { dawn: 'Morning', day: 'Day', dusk: 'Evening', night: 'Night' },
    names: { sakura: 'Sakura', moss: 'Moss', bamboo: 'Bamboo', matcha: 'Tea bush', peony: 'Peony', fern: 'Fern' },
    foot: 'Universe 74 · Free, no ads, no login. Your data stays on this device.', streakAll: (n: number) => `Garden streak ${n} days`,
    grown: 'Grown!',
  },
}
