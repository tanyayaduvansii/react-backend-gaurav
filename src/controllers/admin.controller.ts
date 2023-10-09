import { Route, Controller, Tags, Post, Body, Get, Security, Query } from 'tsoa'
import { IResponse } from '../utils/interfaces.util';
import { Request, Response } from 'express'
import { findOne, getById, upsert, getAll } from '../helpers/db.helpers';
import { verifyHash, signToken, genHash } from '../utils/common.util';
import { validateChangePassword, validateForgotPassword, validateProfile, validateResetPassword, validateAdmin } from '../validations/admin.validator';
import adminModel from '../models/admin.model';
import logger from '../configs/logger.config';
import { sendEmail } from '../configs/nodemailer';
import { readHTMLFile } from '../services/utils';
import path from 'path';
import handlebar from 'handlebars'

@Tags('Admin')
@Route('api/admin')
export default class AdminController extends Controller {
    req: Request;
    res: Response;
    userId: string
    constructor(req: Request, res: Response) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : ''
    }

    /**
     * Get user login
     */
    @Post("/login")
    public async login(@Body() request: { email: string, password: string }): Promise<IResponse> {
        try {
            const { email, password } = request;
            const validatedUser = validateAdmin({ email, password });
            if (validatedUser.error) {
                throw new Error(validatedUser.error.message)
            }
            const exists = await findOne(adminModel, { email });
            if (!exists) {
                throw new Error('Admin doesn\'t exists!');
            }
            // check if blocked
            if (exists.isBlocked) {
                throw new Error('Admin is not approved yet!');
            }

            const isValid = await verifyHash(password, exists.password);
            if (!isValid) {
                throw new Error('Password seems to be incorrect');
            }
            const token = await signToken(exists._id)
            delete exists.password
            return {
                data: { ...exists, token },
                error: '',
                message: 'Login Success',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }

    /**
 * Save a user
 */
    @Post("/sign-up")
    public async save(@Body() request: { email: string, firstName: string, lastName: string, password: string }): Promise<IResponse> {
        try {
            const { firstName, lastName, email, password } = request;
            const validatedProfile = validateProfile({ firstName, lastName, email, password });
            if (validatedProfile.error) {
                throw new Error(validatedProfile.error.message)
            }
            // check if user exists
            const exists = await findOne(adminModel, { email });
            if (exists) {
                throw new Error(`Email ${email} is already registered with us`)
            }
            const hashed = await genHash(password);
            const saveResponse = await upsert(adminModel, { firstName, lastName, email, password: hashed })
            // create a temp token
            const token = await signToken(saveResponse._id, { purpose: 'temp' }, '1hr')
            return {
                data: { ...saveResponse.toObject(), token },
                error: '',
                message: 'User registered successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }

    /**
    * Forgot password api endpoint
    */
    @Post("/forgotPassword")
    public async forgotPassword(@Body() request: { email: string, mode: string }): Promise<IResponse> {
        try {
            const { email, mode } = request;
            const validatedForgotPassword = validateForgotPassword({ email });
            if (validatedForgotPassword.error) {
                throw new Error(validatedForgotPassword.error.message)
            }
            // check if user exists
            const exists = await findOne(adminModel, { email });
            if (!exists) {
                throw new Error('Invalid User')
            }
            //   sign a token with userid & purpose
            const token = await signToken(exists._id, { purpose: 'reset' }, '1h')
            //   send an email
            const html = await readHTMLFile(path.join(__dirname, '../', 'template', 'reset-password.html'))
            const template = handlebar.compile(html)

            let url;
            if(mode === 'DEV') {
                url = 'https://ico-godpanel.staging.block-brew.com/';
            }
            else {
                url = 'https://ico-godpanel.block-brew.com/'
            }

            await sendEmail(process.env.EMAIL_NOTIFICATION_ADDRESS, 'Reset Your Password', email, template({ link: `${url}reset-password?resetId=${token}` }))
            return {
                data: {},
                error: '',
                message: 'Password reset Link successfully sent to ' + email,
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }

    /**
* Forgot password api endpoint
*/
    @Security('Bearer')
    @Post("/resetPassword")
    public async resetPassword(@Body() request: { password: string }): Promise<IResponse> {
        try {
            const { password } = request;
            const validatedResetPassword = validateResetPassword({ password });
            if (validatedResetPassword.error) {
                throw new Error(validatedResetPassword.error.message)
            }
            const hashed = await genHash(password)
            const updated = await upsert(adminModel, { password: hashed }, this.userId)

            return {
                data: {},
                error: '',
                message: 'Password reset successfully!',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }


    /**
* Change Password endpoint
*/
    @Security('Bearer')
    @Post("/changePassword")
    public async changePassword(@Body() request: { oldPassword: string, newPassword: string }): Promise<IResponse> {
        try {
            const { oldPassword, newPassword } = request;
            const validatedChangePassword = validateChangePassword({ oldPassword, newPassword });;
            if (validatedChangePassword.error) {
                throw new Error(validatedChangePassword.error.message)
            }
            const exists = await getById(adminModel, this.userId)
            if (!exists) {
                throw new Error('Invalid Admin')
            }
            const isValid = await verifyHash(oldPassword, exists.password);
            if (!isValid) {
                throw new Error('Password is incorrect')
            }
            const hashed = await genHash(newPassword)
            const updated = await upsert(adminModel, { password: hashed }, this.userId)

            return {
                data: {},
                error: '',
                message: 'Password changed successfully!',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }

    /**
     * Get user info
     */
    @Security('Bearer')
    @Get("/me")
    public async me(): Promise<IResponse> {
        try {
            //   check for a valid id
            const getResponse = await getById(adminModel, this.userId);

            // const result = await adminModel.findById({_id:this.userId})

            // console.log(result,"resss")
            return {
                data: getResponse || {},
                error: '',
                message: 'Admin info fetched Successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }

    /**
    * Update admin
    */
    @Security('Bearer')
    @Post("/update")
    public async update(@Body() request: { email: string, firstName: string, lastName: string }): Promise<IResponse> {
        try {
            const { firstName, lastName, email } = request;

            // check if user exists
            const exists = await findOne(adminModel, { _id: this.userId });

            if (!exists) {
                throw new Error('Invalid Admin')
            }

            if (email) {
                const emailExists = await findOne(adminModel, { _id: { $ne: this.userId }, email: email });
                if (emailExists) {
                    throw new Error(`Email ${email} is already registered with us`)
                }
            }

            var payload: { [k: string]: any } = {};
            if (firstName)
                payload.firstName = firstName;

            if (lastName)
                payload.lastName = lastName;

            if (email)
                payload.email = email;



            const saveResponse = await upsert(adminModel, payload, this.userId)
            // create a temp token
            return {
                data: saveResponse,
                error: '',
                message: 'Admin successfully updated!',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }

}


