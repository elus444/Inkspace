import mongoose from "mongoose";

const connectDb = async(): Promise<void>=>{
    try{
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("MONGODB connected");
    }
    catch(error){
        console.error("MONGODB connection failed", error);
        process.exit(1);
    }
}

export default connectDb;