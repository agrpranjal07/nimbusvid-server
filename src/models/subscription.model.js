import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
    type: Schema.Types.ObjectId, // user who is subscribing to the channel
    ref: "User"
},
    channel: {
    type: Schema.Types.ObjectId, // user to whom  the subscriber is subscribing
    ref: "User"
}
},{timestamps: true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)