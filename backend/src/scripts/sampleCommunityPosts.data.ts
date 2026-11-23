// Content of the labeled example threads in the community (「サンプル投稿」).
// Every author is a made-up sample account (names end in （例）). No real learners,
// no real names, no results or testimonials. Facts were checked against
// https://code.claude.com/docs/ja/ (and docs.github.com/ja for GitHub Pages).
// Times are Japan time (JST); the seed script stores them as UTC like the app does.

export interface SampleAuthor {
  key: string;
  name: string;
}

export interface SampleComment {
  author: string; // SampleAuthor.key
  at: string; // JST, 'YYYY-MM-DD HH:MM'
  text: string;
}

// In each thread, comments[0] is the teacher's answer; the comments after it are shown
// as replies under that answer (the UI lists top-level comments newest first).
export interface SampleThread {
  key: string; // stable id suffix, e.g. '01'
  author: string;
  at: string;
  text: string;
  /** File names in src/scripts/sample-media/ */
  media?: string[];
  likedBy: string[];
  comments: SampleComment[];
}

export const SAMPLE_AUTHORS: SampleAuthor[] = [
  { key: 'a', name: '受講者A（例）' },
  { key: 'b', name: '受講者B（例）' },
  { key: 'c', name: '受講者C（例）' },
  { key: 'd', name: '受講者D（例）' },
  { key: 'e', name: '受講者E（例）' },
  { key: 'f', name: '受講者F（例）' },
  { key: 'teacher', name: '講師（例）' },
];

export const SAMPLE_THREADS: SampleThread[] = [
  {
    "key": "01",
    "author": "a",
    "at": "2026-10-29 21:14",
    "text": "Accept edits と Auto の違いがよくわかりません。\n\n入門の第5回を見ました。Manual だと毎回聞かれるので、Accept edits にしようか迷っています。Auto とは何が違うのでしょうか。はじめてなので、どれを選べばいいのかも知りたいです。",
    "likedBy": [
      "b",
      "c",
      "d",
      "e"
    ],
    "comments": [
      {
        "author": "teacher",
        "at": "2026-10-30 09:02",
        "text": "Accept edits は、作業しているフォルダの中のファイル編集を、聞かずに進めるモードです。mkdir や mv のような、よく使うファイル操作のコマンドも聞かずに進めます。それ以外のコマンドは、今までどおり確認が出ます。\n\nAuto は、別のモデルが操作を実行前にチェックして、問題がなさそうなものを進めるモードです。組織の設定や使っているモデルによっては、選べないこともあります。\n\n慣れるまでは Manual か Accept edits がおすすめです。「+12 -1」の表示と差分ビューで、変わったところを見てから進めましょう。私も最初はこの進め方でした。"
      },
      {
        "author": "a",
        "at": "2026-10-30 12:40",
        "text": "ありがとうございます。まずは Accept edits にして、差分を見るくせをつけます。"
      },
      {
        "author": "c",
        "at": "2026-10-31 19:05",
        "text": "私も同じところで迷っていました。助かります。"
      }
    ]
  },
  {
    "key": "02",
    "author": "b",
    "at": "2026-11-02 22:31",
    "text": "会話が長くなってきました。/compact と /clear はどう使い分けますか？\n\n同じセッションで、何日か作業を続けています。入門の第20回で /compact を知りましたが、/clear との違いがまだあいまいです。",
    "likedBy": [
      "a",
      "d",
      "f"
    ],
    "comments": [
      {
        "author": "teacher",
        "at": "2026-11-03 08:47",
        "text": "/compact は、ここまでの会話を要約して、同じ会話を続けます。/clear は、空の状態から新しい会話を始めます。\n\n同じ作業を続けるなら /compact。まったく別の作業に移るなら /clear です。\n\n「/compact API の変更点を残して」のように一言そえると、要約で何を残すかを指示できます。ちなみに、コンテキストがいっぱいになると、Claude は自動で会話を要約して作業を続けます。"
      },
      {
        "author": "b",
        "at": "2026-11-03 21:10",
        "text": "/context でどれくらい使っているかを見てから、決めるようにします。"
      }
    ]
  },
  {
    "key": "03",
    "author": "d",
    "at": "2026-11-05 20:18",
    "text": "作業中にちょっと聞きたいことがあるとき、止めないとだめですか？\n\nClaude がファイルを直している途中で、用語の意味を聞きたくなりました。停止ボタンを押すと作業が止まってしまうので、迷っています。",
    "likedBy": [
      "a",
      "b",
      "c",
      "e",
      "f"
    ],
    "comments": [
      {
        "author": "teacher",
        "at": "2026-11-06 07:55",
        "text": "/btw を使うと、作業を止めずにサイドチャットで質問できます。メインのセッションの内容をふまえて答えてくれますが、質問と答えはメインの会話には残りません。入門の第11回で紹介しています。"
      },
      {
        "author": "d",
        "at": "2026-11-06 22:03",
        "text": "試してみました。メインの作業はそのまま進んでいて、助かりました。"
      },
      {
        "author": "e",
        "at": "2026-11-07 13:26",
        "text": "サイドチャットで、ファイルの編集まで頼めますか？"
      },
      {
        "author": "teacher",
        "at": "2026-11-07 18:12",
        "text": "サイドチャットは、質問に答えるためのものです。編集してほしいことは、メインの会話で頼んでください。"
      }
    ]
  },
  {
    "key": "04",
    "author": "c",
    "at": "2026-11-08 23:02",
    "text": "作ったスキルが / の一覧に出てきません。\n\n自分仕様の第2回を見ながら、~/.claude/skills/daily-report/SKILL.md を作りました。入力欄に / を打っても、daily-report が出てきません。",
    "likedBy": [
      "a",
      "f"
    ],
    "comments": [
      {
        "author": "teacher",
        "at": "2026-11-09 09:20",
        "text": "次の3つを見てみてください。\n\n1. 場所が ~/.claude/skills/daily-report/SKILL.md になっているか。skills の下にフォルダを1つ作り、その中に SKILL.md を置きます。\n2. ファイル名が SKILL.md（大文字）になっているか。\n3. 名前が SKILL.md.txt のようになっていないか。Windows は拡張子を隠すことがあります。\n\n場所が合っていれば、たいていは再起動しなくても読み込まれます。それでも出てこないときは、/reload-skills を試してください。"
      },
      {
        "author": "c",
        "at": "2026-11-09 21:48",
        "text": "SKILL.md.txt になっていました……。直したら出てきました。"
      },
      {
        "author": "f",
        "at": "2026-11-10 08:15",
        "text": "Windows だと拡張子が見えないんですよね。私も同じことがありました。"
      }
    ]
  },
  {
    "key": "05",
    "author": "e",
    "at": "2026-11-10 21:37",
    "text": "CLAUDE.md に「編集したら整形して」と書いたのに、ときどき忘れられます。\n\nコードを編集したら、毎回 prettier で整形してほしいです。CLAUDE.md に書いておけば大丈夫だと思っていました。",
    "likedBy": [
      "b",
      "c",
      "d"
    ],
    "comments": [
      {
        "author": "teacher",
        "at": "2026-11-11 08:30",
        "text": "CLAUDE.md に書いたことは Claude への指示なので、毎回必ず守られるとはかぎりません。毎回かならず動かしたいなら、フックを使います。\n\nsettings.json の hooks に、PostToolUse（ツールを使ったあと）のフックを書きます。Edit|Write にマッチしたときに prettier を動かす形です。自分仕様の第7回の例と同じですね。\n\n書き方に自信がなければ、Claude に「編集のあとに prettier で整形するフックを作って」と頼んでも大丈夫です。"
      },
      {
        "author": "e",
        "at": "2026-11-12 20:52",
        "text": "フックにしてから、毎回そろうようになりました。"
      },
      {
        "author": "a",
        "at": "2026-11-13 12:07",
        "text": "Windows でも同じ書き方で動きますか？"
      },
      {
        "author": "teacher",
        "at": "2026-11-13 17:45",
        "text": "ドキュメントの例は jq を使うシェルのコマンドなので、Windows では書き方が変わることがあります。Claude に「Windows で動く形にして」とそえて頼むのが早いです。"
      }
    ]
  },
  {
    "key": "06",
    "author": "f",
    "at": "2026-11-12 22:11",
    "text": ".env を Claude に読まれないようにしたいです。\n\nAPI のキーを入れた .env があります。CLAUDE.md に「.env は読まないで」と書いておけば十分でしょうか。",
    "likedBy": [
      "a",
      "b",
      "c",
      "d",
      "e"
    ],
    "comments": [
      {
        "author": "teacher",
        "at": "2026-11-13 09:05",
        "text": "しっかり止めたいなら、権限のルールで deny を設定します。プロジェクトの .claude/settings.json の permissions に、deny として \"Read(./.env)\" を書きます。Code タブでは /permissions が使えないので、ファイルを直接編集してください。\n\nルールは deny → ask → allow の順に見られます。deny に当てはまったものは止まります。CLAUDE.md の指示と違って、こちらは Claude Code が守らせるルールです。\n\nただ、これでどんな方法でも読めなくなるわけではありません。Read のルールでは止められない読み方があることも、ドキュメントに書かれています。キーは、なるべくプロジェクトの外に置いておくと安心です。"
      },
      {
        "author": "f",
        "at": "2026-11-13 21:30",
        "text": ".claude/settings.json はチームと共有されると聞きました。自分だけの設定にしたいときは、どうしますか？"
      },
      {
        "author": "teacher",
        "at": "2026-11-14 08:12",
        "text": ".claude/settings.local.json に書きます。そのプロジェクトで、自分だけに効く設定ファイルです。"
      }
    ]
  },
  {
    "key": "07",
    "author": "b",
    "at": "2026-11-14 21:56",
    "text": "サブエージェントとスキルは、どう使い分けますか？\n\n自分仕様の第2回と第6回を見て、どちらも「Claude に仕事を任せるもの」に見えてしまいました。",
    "likedBy": [
      "c",
      "e",
      "f"
    ],
    "comments": [
      {
        "author": "teacher",
        "at": "2026-11-15 10:03",
        "text": "スキルは手順書のようなものです。読み込まれると、いまの会話の中でその手順にそって作業します。\n\nサブエージェントは、別のコンテキストで作業して、結果の要約だけをメインの会話に返します。調べものが多くて、途中のやりとりでメインの会話をふくらませたくないときに向いています。\n\n組み込みの Explore は、コードを探して読むための、読み取り専用のサブエージェントです。"
      },
      {
        "author": "b",
        "at": "2026-11-15 22:40",
        "text": "「Explore で、設定ファイルを読んでいる場所を探して」と頼んだら、要約だけが返ってきました。違いがわかりました。"
      },
      {
        "author": "d",
        "at": "2026-11-16 12:18",
        "text": "サブエージェントを使うと、使用量は別に数えられますか？"
      },
      {
        "author": "teacher",
        "at": "2026-11-16 17:02",
        "text": "いいえ。サブエージェントの分も、メインの会話と同じ使用量の上限に数えられます。"
      }
    ]
  },
  {
    "key": "08",
    "author": "d",
    "at": "2026-11-16 20:44",
    "text": "GitHub Pages で公開したのに 404 が出ます。\n\nSettings → Pages で設定して、表示された URL を開いたら 404 と出ました。画面を貼ります。",
    "likedBy": [
      "a",
      "b",
      "e"
    ],
    "comments": [
      {
        "author": "teacher",
        "at": "2026-11-17 08:40",
        "text": "設定した直後だと、反映まで最大10分ほどかかることがあります。少し待ってから、開き直してみてください。\n\nそれでも 404 なら、リポジトリのいちばん上に index.html があるか、ファイル名が小文字の index.html になっているかを確かめてください。"
      },
      {
        "author": "d",
        "at": "2026-11-17 21:15",
        "text": "ファイル名が Index.html になっていました。小文字にしたら表示されました！"
      },
      {
        "author": "a",
        "at": "2026-11-18 07:58",
        "text": "私のときは、10分ほど待ったら表示されました。"
      }
    ],
    "media": [
      "sample-404.png"
    ]
  },
  {
    "key": "09",
    "author": "e",
    "at": "2026-11-18 22:26",
    "text": "スマホで見ると、見出しが画面からはみ出します。\n\nパソコンではきれいに見えるのに、スマホの幅にすると見出しが右にはみ出します。スクリーンショットを貼ります。",
    "likedBy": [
      "a",
      "c",
      "d",
      "f"
    ],
    "comments": [
      {
        "author": "teacher",
        "at": "2026-11-19 09:14",
        "text": "このスクリーンショットを Claude に添付して、「スマホの幅（375px くらい）で見出しが画面からはみ出します。はみ出さないように直してください」と頼んでみてください。画像があると、どこの話かが伝わりやすくなります。\n\n直ったら、ブラウザでスマホの幅にして、もう一度見て確かめましょう。"
      },
      {
        "author": "e",
        "at": "2026-11-19 21:33",
        "text": "添付して頼んだら直りました。差分ビューで、CSS の変わったところも見られました。"
      },
      {
        "author": "c",
        "at": "2026-11-20 12:41",
        "text": "375px は何の数字ですか？"
      },
      {
        "author": "teacher",
        "at": "2026-11-20 18:05",
        "text": "画面の横幅のピクセル数です。小さめのスマホの幅として、確かめるときの目安にしています。"
      }
    ],
    "media": [
      "sample-phone-overflow.png"
    ]
  },
  {
    "key": "10",
    "author": "f",
    "at": "2026-11-20 21:49",
    "text": "入れた写真が表示されません。\n\n無料の写真サイトから画像をもらって、Claude に「images フォルダの画像をトップに入れて」と頼みました。パソコンでは表示されるのに、公開したページでは写真の場所に代わりの文字が出ます。",
    "likedBy": [
      "a",
      "b",
      "c",
      "d",
      "e"
    ],
    "comments": [
      {
        "author": "teacher",
        "at": "2026-11-21 08:55",
        "text": "よくある原因は2つです。\n\n1. 画像のファイルを GitHub に送っていない。\n2. ファイル名の大文字と小文字が違う（Photo.JPG と photo.jpg など）。パソコンでは同じファイルとして開けても、公開したサイトでは別のファイルとして扱われることがあります。\n\nClaude に「images フォルダの画像も GitHub に送って」「HTML に書いたファイル名と、実際のファイル名が合っているか確かめて」と頼んでみてください。"
      },
      {
        "author": "f",
        "at": "2026-11-21 20:27",
        "text": "ファイル名が Photo.JPG でした。Claude に合わせてもらって送り直したら、表示されました。"
      },
      {
        "author": "b",
        "at": "2026-11-22 11:36",
        "text": "写真のライセンスは、どこで確かめていますか？"
      },
      {
        "author": "teacher",
        "at": "2026-11-22 17:20",
        "text": "写真サイトのライセンスのページで、商用で使えるか、クレジットの表記がいるかを確かめてください。サイト作りの講座の第10回でもふれていますが、人の顔が写った写真は使わないほうが安心です。"
      }
    ],
    "media": [
      "sample-missing-image.png"
    ]
  }
];
