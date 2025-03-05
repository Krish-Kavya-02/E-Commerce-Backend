import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}`)
        console.log(`\nMongo DB connected DB Host:${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection error: ", error);
        process.exit(1)
    }
}

export default connectDB