import moment from 'moment';

/** A promotion is valid only for its configured inclusive calendar-date window. */
export function isPromotionActive(
  applyPromotion: boolean | null | undefined,
  promotionStart: string | Date | null | undefined,
  promotionEnd: string | Date | null | undefined,
  now = moment()
) {
  if (!applyPromotion || !promotionStart || !promotionEnd) return false;

  return (
    now.isSameOrAfter(moment(promotionStart), 'day') &&
    now.isSameOrBefore(moment(promotionEnd), 'day')
  );
}
