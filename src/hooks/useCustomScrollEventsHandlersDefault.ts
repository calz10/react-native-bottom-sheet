import { scrollTo, useWorkletCallback } from 'react-native-reanimated';
import { useBottomSheetInternal } from './useBottomSheetInternal';
import { ANIMATION_STATE, SCROLLABLE_STATE, SHEET_STATE } from '../constants';
import type {
  ScrollEventsHandlersHookType,
  ScrollEventHandlerCallbackType,
} from '../types';

export type ScrollEventContextType = {
  initialContentOffsetY: number;
  shouldLockInitialPosition: boolean;
  scrollY?: number
};

export const useCustomScrollEventsHandlersDefault: ScrollEventsHandlersHookType = (
  scrollableRef,
  scrollableContentOffsetY,
  scrollY,
) => {
  // hooks
  const {
    animatedSheetState,
    animatedScrollableState,
    animatedAnimationState,
    animatedScrollableContentOffsetY: rootScrollableContentOffsetY,
  } = useBottomSheetInternal();

  //#region callbacks
  const handleOnScroll: ScrollEventHandlerCallbackType<ScrollEventContextType> =
    useWorkletCallback(
      (e: any, context: any) => {

        if (animatedScrollableState.value !== SCROLLABLE_STATE.LOCKED) {
            scrollY.value = e.contentOffset.y
        }

        /**
         * if sheet position is extended or fill parent, then we reset
         * `shouldLockInitialPosition` value to false.
         */
        if (
          animatedSheetState.value === SHEET_STATE.EXTENDED ||
          animatedSheetState.value === SHEET_STATE.FILL_PARENT
        ) {
          context.shouldLockInitialPosition = false;
        }


        if (animatedScrollableState.value === SCROLLABLE_STATE.LOCKED) {
          const lockPosition = context.shouldLockInitialPosition
            ? context.initialContentOffsetY ?? 0
            : 0;
          // @ts-ignore
          scrollTo(scrollableRef, 0, lockPosition, false);
          scrollableContentOffsetY.value = lockPosition;
          return;
        }
      },
      [
        scrollableRef,
        scrollableContentOffsetY,
        animatedScrollableState,
        animatedSheetState,
      ]
    );
  const handleOnBeginDrag: ScrollEventHandlerCallbackType<ScrollEventContextType> =
    useWorkletCallback(
      ({ contentOffset: { y } }, context) => {
        scrollableContentOffsetY.value = y;
        rootScrollableContentOffsetY.value = y;
        context.initialContentOffsetY = y;

        /**
         * if sheet position not extended or fill parent and the scrollable position
         * not at the top, then we should lock the initial scrollable position.
         */
        if (
          animatedSheetState.value !== SHEET_STATE.EXTENDED &&
          animatedSheetState.value !== SHEET_STATE.FILL_PARENT &&
          y > 0
        ) {
          context.shouldLockInitialPosition = true;
        } else {
          context.shouldLockInitialPosition = false;
        }
      },
      [
        scrollableContentOffsetY,
        animatedSheetState,
        rootScrollableContentOffsetY,
      ]
    );
  const handleOnEndDrag: ScrollEventHandlerCallbackType<ScrollEventContextType> =
    useWorkletCallback(
      ({ contentOffset: { y } }, context) => {
        if (animatedScrollableState.value === SCROLLABLE_STATE.LOCKED) {
          const lockPosition = context.shouldLockInitialPosition
            ? context.initialContentOffsetY ?? 0
            : 0;
          // @ts-ignore
          scrollTo(scrollableRef, 0, lockPosition, false);
          scrollableContentOffsetY.value = lockPosition;
          return;
        }
        if (animatedAnimationState.value !== ANIMATION_STATE.RUNNING) {
          scrollableContentOffsetY.value = y;
          rootScrollableContentOffsetY.value = y;
        }
      },
      [
        scrollableRef,
        scrollableContentOffsetY,
        animatedAnimationState,
        animatedScrollableState,
        rootScrollableContentOffsetY,
      ]
    );
  const handleOnMomentumEnd: ScrollEventHandlerCallbackType<ScrollEventContextType> =
    useWorkletCallback(
      ({ contentOffset: { y } }, context) => {
        if (animatedScrollableState.value === SCROLLABLE_STATE.LOCKED) {
          const lockPosition = context.shouldLockInitialPosition
            ? context.initialContentOffsetY ?? 0
            : 0;
          // @ts-ignore
          scrollTo(scrollableRef, 0, lockPosition, false);
          scrollableContentOffsetY.value = 0;
          return;
        }
        if (animatedAnimationState.value !== ANIMATION_STATE.RUNNING) {
          scrollableContentOffsetY.value = y;
          rootScrollableContentOffsetY.value = y;
        }
      },
      [
        scrollableContentOffsetY,
        scrollableRef,
        animatedAnimationState,
        animatedScrollableState,
        rootScrollableContentOffsetY,
      ]
    );
  //#endregion

  return {
    handleOnScroll,
    handleOnBeginDrag,
    handleOnEndDrag,
    handleOnMomentumEnd,
  };
};
