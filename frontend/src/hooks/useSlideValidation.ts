import { useState, useEffect } from 'react';
import { Slide } from '../types/slide.types';
import { InteractiveContent } from '../types/interactive.types';

export const useSlideValidation = (slides: Slide[]) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const validateSlide = (index: number, slide: Slide) => {
    const errors: string[] = [];

    // Basic validation
    // if (!slide.content.title?.trim() && slide.content.type !== 'code') {
    //   errors.push('Title is required');
    // }

    // Type-specific validation
    switch (slide.content.type) {
      case 'image':
        if (!slide.content.content?.url?.trim()) {
          errors.push('画像の URL を入力してください');
        }
        break;

      case 'video':
        if (!slide.content.content?.url?.trim()) {
          errors.push('動画の URL を入力してください');
        }
        break;

      case 'quiz':
        if (!slide.content.content?.question?.trim()) {
          errors.push('問題文を入力してください');
        }
        if ((slide.content.content?.type === 'single-choice' || slide.content.content?.type === 'multiple-choice') &&
          (!slide.content.content?.options ||
            slide.content.content.options.some((opt: string) => !opt.trim()))) {
          errors.push('選択肢をすべて入力してください');
        }
        if (slide.content.content?.type === 'single-choice' &&
          (slide.content.content?.correctAnswer === undefined || slide.content.content?.correctAnswer === null)) {
          errors.push('正解を選んでください');
        }
        if (slide.content.content?.type === 'multiple-choice' &&
          (!slide.content.content?.correctAnswers ||
            slide.content.content.correctAnswers.length === 0)) {
          errors.push('正解を1つ以上選んでください');
        }
        break;

      case 'interactive':
        const interactiveContent = slide.content.content as InteractiveContent;
        if (!interactiveContent?.instruction?.trim()) {
          errors.push('説明文を入力してください');
        }
        if (!interactiveContent?.items?.length) {
          errors.push('項目を1つ以上追加してください');
        }
        break;

      case 'code':
        if (!slide.content.content?.code?.trim()) {
          errors.push('コードを入力してください');
        }
        break;
    }

    setValidationErrors(prev => ({
      ...prev,
      [index]: errors
    }));

    return errors;
  };

  const validateAllSlides = () => {
    slides.forEach((slide, index) => {
      validateSlide(index, slide);
    });
  };

  useEffect(() => {
    validateAllSlides();
  }, [slides]);

  const getTotalErrors = () => {
    return Object.values(validationErrors).reduce((acc, errors) => acc + errors.length, 0);
  };

  const hasErrors = (index: number) => {
    return (validationErrors[index] || []).length > 0;
  };

  return {
    validationErrors,
    validateSlide,
    validateAllSlides,
    getTotalErrors,
    hasErrors,
  };
};