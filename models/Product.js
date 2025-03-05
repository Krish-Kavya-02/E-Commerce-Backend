import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        category : {
            type: [String],
            required: true,
            enum: ['electronics','apparel','cosmetics','footwear','toys','snacks','essentials'],
            default: []
        },
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {timestamps : true}
)

export default mongoose.model('Product',productSchema)
