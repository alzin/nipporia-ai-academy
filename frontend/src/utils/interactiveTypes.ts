import React from 'react';
import {
  TouchApp,
  LinearScale,
  CompareArrows,
  SortByAlpha,
  Timeline,
  SwapHoriz,
  Category,
} from '@mui/icons-material';
import { InteractiveTypeConfig } from '../types/interactive.types';

export const interactiveTypes: InteractiveTypeConfig[] = [
  {
    value: 'drag-drop',
    label: 'ドラッグ＆ドロップ',
    icon: React.createElement(TouchApp),
    description: '項目をドラッグして正しい場所に置きます',
    example: 'コマンドを、それぞれの役割の枠に入れる',
    difficulty: 'Easy',
    color: '#AE4A24'
  },
  {
    value: 'fill-blanks',
    label: '穴埋め',
    icon: React.createElement(LinearScale),
    description: '文の空いているところに言葉を入れます',
    example: '「___ でファイルを指定して頼む」の空欄を埋める',
    difficulty: 'Medium',
    color: '#3C5A80'
  },
  {
    value: 'matching',
    label: '組み合わせ',
    icon: React.createElement(CompareArrows),
    description: '関係のある項目どうしを線でつなぎます',
    example: '権限モードと、その説明をつなぐ',
    difficulty: 'Easy',
    color: '#5F5B54'
  },
  {
    value: 'sorting',
    label: '並べ替え',
    icon: React.createElement(SortByAlpha),
    description: '項目を正しい順に並べます',
    example: 'Claude Code の操作を正しい順に並べる',
    difficulty: 'Medium',
    color: '#8F3B1B'
  },
  {
    value: 'hotspot',
    label: 'ホットスポット',
    icon: React.createElement(TouchApp),
    description: '画像の決まった場所をクリックします',
    example: 'アプリの画面で停止ボタンの場所をクリックする',
    difficulty: 'Easy',
    color: '#3C5A80'
  },
  {
    value: 'timeline',
    label: '年表',
    icon: React.createElement(Timeline),
    description: '出来事を起きた順に並べます',
    example: 'AI ツールの登場を年代順に並べる',
    difficulty: 'Hard',
    color: '#5F5B54'
  },
  {
    value: 'flashcard',
    label: 'フラッシュカード',
    icon: React.createElement(SwapHoriz),
    description: 'カードをめくって答えを確かめます',
    example: 'スラッシュコマンドと、その働き',
    difficulty: 'Easy',
    color: '#AE4A24'
  },
  {
    value: 'sentence-builder',
    label: '文の組み立て',
    icon: React.createElement(Category),
    description: '言葉のブロックを並べて文を作ります',
    example: 'Claude への頼み方を、ブロックを並べて組み立てる',
    difficulty: 'Hard',
    color: '#8F3B1B'
  }
];

const difficultyLabels: Record<InteractiveTypeConfig['difficulty'], string> = {
  Easy: 'やさしい',
  Medium: 'ふつう',
  Hard: 'むずかしい',
};

export const getDifficultyLabel = (difficulty?: InteractiveTypeConfig['difficulty']): string =>
  difficulty ? difficultyLabels[difficulty] : '';

const defaultInstructions: Record<string, string> = {
  'drag-drop': '項目をドラッグして、正しい場所に置いてください。',
  'fill-blanks': '空欄に入る言葉を入れてください。',
  matching: '関係のある項目どうしをつないでください。',
  sorting: '項目を正しい順に並べてください。',
  hotspot: '画像の正しい場所をクリックしてください。',
  timeline: '出来事を起きた順に並べてください。',
  flashcard: 'カードをめくって、答えを確かめてください。',
  'sentence-builder': 'ブロックを並べて、文を作ってください。',
};

export const getInteractiveTypeConfig = (type: string): InteractiveTypeConfig | undefined => {
  return interactiveTypes.find(t => t.value === type);
};

export const getDefaultInstruction = (type: string): string => {
  return defaultInstructions[type] || '問題に答えてください。';
};
