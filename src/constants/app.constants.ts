const jwtSecret = process.env.SECRET || 'secret';

const USER_STATUS = {
  APPROVED: 'APPROVED',
  PENDING: 'PENDING',
  DECLINED: 'DECLINED'
}

const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
}

export {
  USER_STATUS,
  jwtSecret,
  PAYMENT_STATUS,
};
