import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            unique: true,
        },
        address: {
            type: String,
            required: true,
        },
        role : {
            type: String,
            required: true,
            enum: ['buyer','seller','admin'],
            default: 'buyer'
        },
        accountBalance: { 
            type: Number, 
            default: 0 
        }
    },
    {timestamps : true}
)

export default mongoose.model('User',userSchema)
