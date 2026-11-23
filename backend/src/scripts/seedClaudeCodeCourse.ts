// Loads the courses: uploads the lesson videos to S3 and creates the courses and
// lessons through the admin API (server must be running). Courses that already exist
// (same title) are not created again; only their lessons' free flags are brought in
// line with `freeLessons` (nothing else is changed). Afterwards run `npm run video:hls`.
// Usage: npm run seed:claude-code -- <videos root>
//        (folder containing lesson-01/out/video.mp4 ..., c2-01/... and c3-01/...)
// Admin login is read from ADMIN_EMAIL / ADMIN_PASSWORD; SEED_API_URL picks the server.
import 'reflect-metadata';
import fs from 'fs';
import path from 'path';
import { S3StorageService } from '../infrastructure/services/S3StorageService';

const API = process.env.SEED_API_URL || 'http://localhost:5000/api';
interface CourseSeed {
  title: string;
  description: string;
  icon: string;
  /** S3 folder: courses/<slug>/lesson-NN.mp4 */
  slug: string;
  /** Local render folders: <root>/<folderPrefix>NN/out/video.mp4 */
  folderPrefix: string;
  /** Lesson numbers anyone can watch (about 30% of the course, spread out, never the final review). */
  freeLessons: number[];
  lessons: Array<[string, string]>;
}

const COURSES: CourseSeed[] = [
  {
    title: 'Claude Code 入門',
    description: 'Claude Code をまったく使ったことがない人のための講座です。1本60〜90秒、全20回。デスクトップアプリの準備から、変更の確かめ方、計画の立て方まで順番に見ていきます。',
    icon: 'CC',
    slug: 'claude-code-intro',
    folderPrefix: 'lesson-',
    freeLessons: [1, 4, 10, 12, 15, 18],
    lessons: [
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
],
  },
  {
    title: 'Claude Code を自分仕様にする',
    description: '「Claude Code 入門」を見終えた人のための講座です。1本60〜90秒、全8回。スキル、コネクタ、プラグイン、権限のルール、サブエージェント、フックを使って、Claude Code を自分の仕事に合わせていきます。',
    icon: 'C2',
    slug: 'claude-code-custom',
    folderPrefix: 'c2-',
    freeLessons: [1, 2, 7],
    lessons: [
      ['自分仕様にする道具の全体図', 'CLAUDE.md、スキル、MCP、サブエージェント、フック、プラグイン。どんなときにどれを足すかを見ていきます。'],
      ['自分のスキルを作る', 'SKILL.md を書いて、/名前 で呼び出せる自分だけの手順を作ります。'],
      ['コネクタでほかのツールとつなぐ', 'カレンダーやチャットなどをつないで、Claude が直接読んだり送ったりできるようにします。'],
      ['プラグインを入れる', 'スキルやフックをまとめたパッケージを入れる方法と、入れる前に確かめることです。'],
      ['権限のルールを決める', 'settings.json に allow / ask / deny を書いて、ツールごとに許可を決めます。'],
      ['サブエージェントに任せる', '別のコンテキストで作業して、要約だけを返してくれる助っ人を使います。'],
      ['フックで自動化する', '決まったタイミングで必ず動くコマンドを、settings.json に書いておきます。'],
      ['最終回：ふりかえりと次の一歩', '第1回から第7回までのおさらいと、どの道具から足すか、次に読むものです。'],
    ],
  },
  {
    title: 'コードを書かずに、自分のサイトを作って公開する',
    description: 'プログラミングの経験がない人のための講座です。1本1〜2分、全11回。Claude Code に頼んで自分のサイトを作り、GitHub Pages でインターネットに公開するまでを順番に見ていきます。例に出てくる弁護士「森野はるか」さんは架空の人物です。',
    icon: 'C3',
    slug: 'no-code-website',
    folderPrefix: 'c3-',
    freeLessons: [1, 2, 6, 9],
    lessons: [
      ['これから作るもの', '完成したページを見ながら、作ってから公開するまでの4つのステップと、準備するものを確かめます。'],
      ['ページを作ってもらう', '空のフォルダを開き、頼み方の全文を貼り付けて、Claude にページを作ってもらいます。'],
      ['確かめて、手直ししてもらう', 'ブラウザとスマホの幅で見て、色や文の直しを頼みます。書いてある内容は自分の目で確かめます。'],
      ['GitHub のアカウントを作る', 'サイトを置く場所として、GitHub のアカウントを作ります。パスワードとパズルは自分で入れます。'],
      ['GitHub Pages で公開する', 'リポジトリを作って index.html をアップロードし、GitHub Pages でインターネットに公開します。'],
      ['HTML と CSS をのぞいてみる', 'index.html の中身を見て、HTML と CSS の役割を知ります。CSS は style.css に分けてもらいます。'],
      ['GitHub とつないで、Claude に公開してもらう', 'GitHub CLI でサインインして、「GitHub に送って」と頼むだけで反映できるようにします。'],
      ['スキルを入れる', 'デザインのスキル ui-ux-pro-max をマーケットプレイスから入れます。入れる前に、出どころと中身を確かめます。'],
      ['スキルでデザインを良くしてもらう', 'スキルを使ってデザインを直してもらい、前と後を比べてから GitHub に送ります。'],
      ['無料の画像を使う', '無料の写真サイトではライセンスを確かめます。画像はフォルダに入れて、Claude に使ってもらいます。'],
      ['最終回：ふりかえりと次の一歩', '第1回から第10回までのおさらいと、次の一歩です。'],
    ],
  },
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

/** Existing course: set isFree on its lessons to match seed.freeLessons. Only isFree is sent. */
async function syncFreeLessons(seed: CourseSeed, course: any, cookie: string) {
  // isFree in the lesson list is computed (flag or order <= freeLessonCount), so it only
  // reflects the stored flag when the course has no free lesson count.
  if (course.freeLessonCount > 0) throw new Error(`「${seed.title}」 uses freeLessonCount=${course.freeLessonCount}; set it to 0 first.`);
  const courseId = course.id;
  const { json } = await api('GET', `/courses/${courseId}/lessons`, cookie);
  const lessons: any[] = Array.isArray(json) ? json : json?.lessons || json?.data || [];
  if (lessons.length !== seed.lessons.length) {
    throw new Error(`「${seed.title}」 has ${lessons.length} lessons, expected ${seed.lessons.length}; not touching it.`);
  }
  for (const lesson of lessons) {
    const expectedTitle = seed.lessons[lesson.order - 1]?.[0];
    if (expectedTitle !== lesson.title) {
      throw new Error(`「${seed.title}」 lesson ${lesson.order} is 「${lesson.title}」, expected 「${expectedTitle}」; not touching it.`);
    }
  }
  let changed = 0;
  for (const lesson of lessons) {
    const want = seed.freeLessons.includes(lesson.order);
    if (Boolean(lesson.isFree) === want) continue;
    await api('PUT', `/admin/lessons/${lesson.id}`, cookie, { isFree: want });
    changed++;
    console.log(`  lesson ${lesson.order} 「${lesson.title}」: isFree -> ${want}`);
  }
  console.log(`Course 「${seed.title}」 already exists; free lessons ${seed.freeLessons.join(', ')} (${changed} changed).`);
}

async function main() {
  const root = process.argv[2];
  if (!root || !fs.existsSync(root)) throw new Error('Pass the folder that contains lesson-01 ... and c2-01 ...');
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD');

  const login = await fetch(API + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  if (!login.ok) throw new Error(`login failed: ${login.status}`);
  const cookie = login.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

  const { json: courses } = await api('GET', '/courses', cookie);
  const existing: any[] = Array.isArray(courses) ? courses : courses?.courses || [];
  const s3 = new S3StorageService();

  for (const seed of COURSES) {
    const found = existing.find((c) => c.title === seed.title);
    if (found) {
      await syncFreeLessons(seed, found, cookie);
      continue;
    }

    const urls: string[] = [];
    for (let i = 1; i <= seed.lessons.length; i++) {
      const nn = String(i).padStart(2, '0');
      const file = path.join(root, `${seed.folderPrefix}${nn}`, 'out', 'video.mp4');
      if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
      const up = await s3.uploadCommunityMedia('admin', { buffer: fs.readFileSync(file), filename: 'video.mp4', mimeType: 'video/mp4' },
        `courses/${seed.slug}`, `lesson-${nn}`);
      urls.push(up.url);
      console.log(`uploaded ${seed.slug}/lesson-${nn} (${(up.size / 1024 / 1024).toFixed(1)} MB)`);
    }

    const { json: course } = await api('POST', '/admin/courses', cookie, {
      title: seed.title,
      description: seed.description,
      icon: seed.icon,
      freeLessonCount: 0,
    });
    const courseId = course.id || course.course?.id;

    for (let i = 0; i < seed.lessons.length; i++) {
      const [title, description] = seed.lessons[i];
      await api('POST', `/admin/courses/${courseId}/lessons`, cookie, {
        title, description, order: i + 1, lessonType: 'VIDEO', contentUrl: urls[i], isFree: seed.freeLessons.includes(i + 1),
      });
    }
    console.log(`Created 「${seed.title}」 (${courseId}) with ${seed.lessons.length} lessons (free: ${seed.freeLessons.join(', ')}).`);
  }
}

main().catch((e) => { console.error('Failed:', e.message); process.exit(1); });
