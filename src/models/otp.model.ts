import { Schema, model } from 'mongoose';
import { USER_STATUS, PAYMENT_STATUS  } from '../constants/app.constants';
import {  USER_ROLE , ADMIN_ROLE } from '../constants/user.constants';

const OtpSchema = new Schema(
    {
        email: { type: String, required: false, default: null },
        otp: { type: String, required: false, default: '0' },
        isActive: { type: Boolean, default: false },
    }, { timestamps: true, versionKey: false }
)
export default model('otps', OtpSchema)



