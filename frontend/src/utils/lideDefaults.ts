import { InteractiveContent } from '../types/interactive.types';
import { SlideContent } from '../types/slide.types';

export const getDefaultContent = (type: SlideContent['type']): SlideContent => {
  switch (type) {
    case 'text':
      return {
        type: 'text',
        content: '',
        title: '',
        subtitle: ''
      };

    case 'image':
      return {
        type: 'image',
        content: { url: '', alt: '', caption: '' },
        title: ''
      };

    case 'video':
      return {
        type: 'video',
        content: { url: '' },
        title: ''
      };

    case 'quiz':
      return {
        type: 'quiz',
        content: {
          question: '',
          type: 'single-choice',
          options: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'],
          correctAnswer: 0,
          correctAnswers: [0], // For multiple choice
          explanation: '',
        },
        title: ''
      };

    case 'interactive':
      return {
        type: 'interactive',
        content: {
          type: 'drag-drop',
          instruction: '項目をドラッグして、正しい場所に置いてください。',
          items: [],
          settings: {},
          feedback: {
            correct: '正解です。',
            incorrect: 'ちがいます。もう一度考えてみましょう。'
          }
        } as InteractiveContent,
        title: '',
      };

    case 'code':
      return {
        type: 'code',
        content: {
          code: '// ここにコードを入力します\nconsole.log("Hello, World!");',
          language: 'javascript'
        },
        title: '',
      };

    default:
      return {
        type: 'text',
        content: '',
        title: '',
        subtitle: ''
      };
  }
};

export const getDefaultInteractiveItem = (type: string, itemIndex?: number) => {
  const id = Date.now() + Math.random();

  switch (type) {
    case 'drag-drop':
      return { id, text: '', target: '', category: '' };

    case 'fill-blanks':
      return { id, sentence: '___ でファイルを指定します', blanks: ['@'], translation: '' };

    case 'matching':
      return { id, left: '', right: '', pair: id };

    case 'sorting':
      return { id, text: '', correctOrder: 0 };

    case 'hotspot': {
      // Vary positions for multiple hotspots
      const positions = [
        { x: 25, y: 25 },
        { x: 75, y: 25 },
        { x: 50, y: 50 },
        { x: 25, y: 75 },
        { x: 75, y: 75 }
      ];
      const pos = positions[(itemIndex || 0) % positions.length];
      return { id, x: pos.x, y: pos.y, label: '', feedback: '', imageUrl: '' };
    }

    case 'timeline':
      return { id, event: '', date: '', description: '' };

    case 'flashcard':
      return { id, front: '', back: '', category: 'vocabulary' };

    case 'sentence-builder':
      return { id, words: [''], correctOrder: [], translation: '' };

    default:
      return { id, text: '' };
  }
};
export const slideTypeLabels: Record<string, string> = {
  text: 'テキスト',
  image: '画像',
  video: '動画',
  quiz: 'クイズ',
  interactive: 'インタラクティブ',
  code: 'コード',
};

export const getSlideTypeLabel = (type: string): string => slideTypeLabels[type] || type;
