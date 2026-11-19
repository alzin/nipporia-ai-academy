// Loads the 「Claude Code 入門」 course: uploads the 20 lesson videos to S3 and
// creates the course and lessons through the admin API (server must be running).
// Usage: npm run seed:claude-code -- <videos root>   (folder containing lesson-01/out/video.mp4 ...)
// Admin login is read from ADMIN_EMAIL / ADMIN_PASSWORD.
import 'reflect-metadata';
import fs from 'fs';
import path from 'path';
import { S3StorageService } from '../infrastructure/services/S3StorageService';

const API = process.env.SEED_API_URL || 'http://localhost:5000/api';
const FREE_LESSONS = [1];

const LESSONS: Array<[string, string]> = [
  ['Claude Codeってなに？', 'Claude Code がどんな道具で、何を頼めるのかを見ていきます。'],
  ['Claude Codeはどこで使える？', 'ターミナル、エディター、デスクトップアプリ、Web。どこで使っても中身は同じです。'],
  ['使い始めるための準備', '有料プランの用意から、デスクトップアプリのインストール、サインイン、Code タブを開くまで。'],
  ['はじめてのセッションを始めよう', 'フォルダを選んで、モデルを選び、最初のお願いをするまでの流れです。'],
  ['変更を確認して受け入れる', '権限モードの違いと、変更を一つずつ確かめて受け入れる方法です。'],
  ['作業の途中で指示を変える', '停止ボタンで止めて、修正を送り直す方法です。'],
  ['@でファイルを指定して頼む', '入力欄に @ を打って、見てほしいファイルを渡します。'],
  ['画像やファイルを添付して頼む', '+ ボタンやドラッグアンドドロップで、画像や PDF を添付します。'],
  ['/ でコマンドやスキルを呼び出す', 'よく使う作業を、短いコマンドで呼び出します。'],
  ['差分ビューでコメントして直してもらう', '変わった行だけを並べた画面で、行ごとに直してほしい点を伝えます。'],
  ['作業を止めずに、ちょっとした質問をする', 'サイドチャットを使うと、メインの会話を汚さずに質問できます。'],
  ['CLAUDE.md でプロジェクトのルールを伝える', '毎回の説明をファイルに書いておく方法と、短く書くコツです。'],
  ['いくつかの作業を同時に進める', '新しいセッションを開いて、切り替えたり並べたりします。'],
  ['ふりかえりと次の一歩', '第1回から第13回までのおさらいと、次に読むものです。'],
  ['上手な頼み方', '具体的に頼む、確かめ方を渡す、迷ったら質問してもらう。'],
  ['計画してから作ってもらう', 'Plan モードで、作る前に計画を立ててもらいます。'],
  ['ファイルとターミナルをアプリの中で開く', 'ファイルの表示と編集、アプリの中のターミナルを使います。'],
  ['よくある作業を頼む', '知らないコードを理解する、バグを直す、テストを書く。'],
  ['前のセッションを見つけて続ける', 'セッションに名前を付けて、あとから探して続けます。'],
  ['会話が長くなったら', 'コンテキストの考え方と、/context と /compact の使い方です。'],
];

async function api(method: string, p: string, cookie: string, body?: unknown) {
  const res = await fetch(API + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json: any = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${p} -> ${res.status} ${JSON.stringify(json)}`);
  return { json, res };
}

async function main() {
  const root = process.argv[2];
  if (!root || !fs.existsSync(root)) throw new Error('Pass the folder that contains lesson-01 ... lesson-20');
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD');

  const login = await fetch(API + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  if (!login.ok) throw new Error(`login failed: ${login.status}`);
  const cookie = login.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

  const { json: courses } = await api('GET', '/courses', cookie);
  if ((Array.isArray(courses) ? courses : courses?.courses || []).some((c: any) => c.title === 'Claude Code 入門')) {
    console.log('Course 「Claude Code 入門」 already exists; nothing to do.');
    return;
  }

  const s3 = new S3StorageService();
  const urls: string[] = [];
  for (let i = 1; i <= LESSONS.length; i++) {
    const nn = String(i).padStart(2, '0');
    const file = path.join(root, `lesson-${nn}`, 'out', 'video.mp4');
    const up = await s3.uploadCommunityMedia('admin', { buffer: fs.readFileSync(file), filename: 'video.mp4', mimeType: 'video/mp4' },
      'courses/claude-code-intro', `lesson-${nn}`);
    urls.push(up.url);
    console.log(`uploaded lesson-${nn} (${(up.size / 1024 / 1024).toFixed(1)} MB)`);
  }

  const { json: course } = await api('POST', '/admin/courses', cookie, {
    title: 'Claude Code 入門',
    description: 'Claude Code をまったく使ったことがない人のための講座です。1本60〜90秒、全20回。デスクトップアプリの準備から、変更の確かめ方、計画の立て方まで順番に見ていきます。',
    icon: 'CC',
    freeLessonCount: 0,
  });
  const courseId = course.id || course.course?.id;

  for (let i = 0; i < LESSONS.length; i++) {
    const [title, description] = LESSONS[i];
    await api('POST', `/admin/courses/${courseId}/lessons`, cookie, {
      title, description, order: i + 1, lessonType: 'VIDEO', contentUrl: urls[i], isFree: FREE_LESSONS.includes(i + 1),
    });
  }
  console.log(`Created course ${courseId} with ${LESSONS.length} lessons (free: ${FREE_LESSONS.join(', ')}).`);
}

main().catch((e) => { console.error('Failed:', e.message); process.exit(1); });
