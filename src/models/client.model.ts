import { Schema, model } from 'mongoose';
import { USER_STATUS, PAYMENT_STATUS  } from '../constants/app.constants';
import {  USER_ROLE , ADMIN_ROLE } from '../constants/user.constants';

const ClientSchema = new Schema(
    {
        role: { type: Number, enum: [ADMIN_ROLE, USER_ROLE], default: USER_ROLE },
        email: { type: String, required: false, default: null },
        name: { type: String, required: false, minLength: 2, default: null },
        password: { type: String, minLength: 4, maxLength: 80, default: null },
        phone: { type: String, required: true },
        isBlocked: { type: Boolean, default: false },
        status: { type: String, enum: [USER_STATUS.PENDING, USER_STATUS.APPROVED, USER_STATUS.DECLINED], default: USER_STATUS.PENDING }
    }, { timestamps: true, versionKey: false }
)
export default model('client', ClientSchema)



