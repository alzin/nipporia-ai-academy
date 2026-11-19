import { ValidationResult, Slide } from '../types/slide.types';

export const validateAnswer = (
  slideId: string,
  userAnswer: any,
  interactiveType: string,
  slide: Slide
): ValidationResult => {
  if (!userAnswer && interactiveType !== 'quiz') {
    return {
      isValid: false,
      message: '答えを入力してから答え合わせをしてください。',
      type: 'warning'
    };
  }

  switch (interactiveType) {
    case 'quiz':
      const quizContent = slide.content.content;

      if (quizContent?.type === 'single-choice') {
        if (typeof userAnswer !== 'number') {
          return {
            isValid: false,
            message: '答えを選んでから答え合わせをしてください。',
            type: 'warning'
          };
        }
      } else if (quizContent?.type === 'multiple-choice') {
        if (!userAnswer || !Array.isArray(userAnswer) || userAnswer.length === 0) {
          return {
            isValid: false,
            message: '答えを1つ以上選んでください。',
            type: 'warning'
          };
        }
      }
      break;

    case 'drag-drop':
      const requiredItems = slide.content.content.items?.length || 0;
      const answeredItems = Object.keys(userAnswer || {}).length;
      if (answeredItems < requiredItems) {
        return {
          isValid: false,
          message: `${requiredItems}個すべてを組み合わせてください（いま${answeredItems}個）。`,
          type: 'warning'
        };
      }
      break;

    case 'fill-blanks':
      const totalBlanks = slide.content.content.items?.reduce((total: number, item: any) => {
        return total + (item.sentence?.split('___').length - 1 || 0);
      }, 0) || 0;
      const filledBlanks = Object.keys(userAnswer || {}).length;
      if (filledBlanks < totalBlanks) {
        return {
          isValid: false,
          message: `${totalBlanks}か所すべてを埋めてください（いま${filledBlanks}か所）。`,
          type: 'warning'
        };
      }
      break;

    case 'sentence-builder':
      const requiredWords = slide.content.content.items?.[0]?.words?.length || 0;
      if ((userAnswer?.length || 0) < requiredWords) {
        return {
          isValid: false,
          message: `${requiredWords}個の言葉をすべて使って文を作ってください。`,
          type: 'warning'
        };
      }
      break;

    case 'sorting':
      const sortItems = userAnswer?.length || 0;
      const requiredSort = slide.content.content.items?.length || 0;
      if (sortItems < requiredSort) {
        return {
          isValid: false,
          message: `${requiredSort}個すべてを順番に並べてください。`,
          type: 'warning'
        };
      }
      break;

    case 'hotspot':
      const requiredClicks = slide.content.content.items?.length || 0;
      const actualClicks = userAnswer?.length || 0;
      if (actualClicks < requiredClicks) {
        return {
          isValid: false,
          message: `${requiredClicks}か所すべてをクリックしてください（いま${actualClicks}か所）。`,
          type: 'warning'
        };
      }
      break;

    case 'matching':
      const requiredConnections = slide.content.content.items?.length || 0;
      const actualConnections = Object.keys(userAnswer || {}).length;
      if (actualConnections < requiredConnections) {
        return {
          isValid: false,
          message: `${requiredConnections}組すべてをつないでください（いま${actualConnections}組）。`,
          type: 'warning'
        };
      }
      break;

    case 'timeline':
      const requiredEvents = slide.content.content.items?.length || 0;
      const arrangedEvents = userAnswer?.length || 0;
      if (arrangedEvents < requiredEvents) {
        return {
          isValid: false,
          message: `${requiredEvents}個すべてを並べてください（いま${arrangedEvents}個）。`,
          type: 'warning'
        };
      }
      break;

    case 'flashcard':
      const totalCards = slide.content.content.items?.length || 0;
      const reviewedCards = Object.keys(userAnswer || {}).length;
      if (reviewedCards < totalCards) {
        return {
          isValid: false,
          message: `${totalCards}枚すべてのカードを確認してください（いま${reviewedCards}枚）。`,
          type: 'warning'
        };
      }
      break;

  }

  return {
    isValid: true,
    message: '正解です。',
    type: 'success'
  };
};