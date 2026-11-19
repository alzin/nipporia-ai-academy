// The API sends English error text. These are the Japanese messages shown on screen.
const AUTH_ERROR_MESSAGES: Array<[RegExp, string]> = [
  [/invalid credentials/i, 'メールアドレスかパスワードが違います。'],
  [/not verified/i, 'メールアドレスの確認がまだです。届いた確認コードを入力してください。'],
  [/inactive/i, 'このアカウントはいま使えません。info@nipporia.com までご連絡ください。'],
  [/user not found/i, 'このメールアドレスのアカウントが見つかりません。'],
  [/already exists/i, 'このメールアドレスはすでに登録されています。ログインしてください。'],
  [/already verified/i, 'このメールアドレスは確認済みです。ログインしてください。'],
  [/invalid verification code/i, '確認コードが違います。もう一度お確かめください。'],
  [/verification code expired/i, '確認コードの有効期限が切れました。新しいコードを送ってください。'],
  [/(invalid|expired).*(reset )?token|token.*(invalid|expired)/i, 'このリンクは使えなくなっています。もう一度パスワードの再設定を申し込んでください。'],
  [/password must be/i, 'パスワードは8文字以上で、大文字・小文字・数字・記号をそれぞれ1つ以上入れてください。'],
  [/too many/i, '短い時間に何度も試したため、いまは受け付けられません。しばらくしてからもう一度お試しください。'],
  [/network error/i, 'サーバーにつながりません。通信環境を確かめて、もう一度お試しください。'],
];

export const toJapaneseAuthError = (
  message: unknown,
  fallback = 'うまくいきませんでした。もう一度お試しください。',
): string => {
  if (typeof message !== 'string' || !message.trim()) return fallback;
  // Already Japanese (contains kana or kanji): show as is.
  if (/[぀-ヿ一-鿿]/.test(message)) return message;
  const hit = AUTH_ERROR_MESSAGES.find(([pattern]) => pattern.test(message));
  return hit ? hit[1] : fallback;
};

// Pulls the error text out of an axios-style error and translates it.
export const authErrorFrom = (error: any, fallback?: string): string =>
  toJapaneseAuthError(
    error?.response?.data?.error || error?.response?.data?.message || error?.message,
    fallback,
  );
