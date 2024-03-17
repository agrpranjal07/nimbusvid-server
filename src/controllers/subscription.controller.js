import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    /*
    1-Check for valid ChannelId
    2-If user already subscribed remove it from subsciption database
    3-If not then add him in subscription database
    */
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const channel = await User.findById(channelId)

    if (!channel) {
        throw new ApiError(404, "This channel does not exist")
    }

    const loggedInUser = req.user?._id
    const userSubscribed = await Subscription.findOneAndDelete(
        { subscriber: loggedInUser, channel: channel }
    )

    if (userSubscribed) {
        return res.status(200).json(new ApiResponse(200, "You have been unsubscribed from this channel"))
    }

    if (!userSubscribed) {
        const subscription = await Subscription.create({
            subscriber: loggedInUser,
            channel,
        })

        const createdSubscription = await Subscription.findById(subscription._id)

        if (!createdSubscription) {
            throw new ApiError(500, "something went wrong while subscribing to this channel")
        }

        return res
            .status(201)
            .json(new ApiResponse(200, createdSubscription, "channel subscribed successfully"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    /*
    1- Check for valid channelId
    2- apply pipeline in Subscriber database and match for channelId
    3- add subscriber by applying lookup in user(get subscriber details)
    4- also add total subscriber count 
    5- send res
    */

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    if (req.user?._id.toString() != channelId) {
        throw new ApiError(400, "You are not the owner of this channel to get subscribers list")
    }

    const getSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $facet: {
                subscribers: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "subscriber",
                            foreignField: "_id",
                            as: "subscriber",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1,
                                        createdAt: 1,
                                        updatedAt: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            subscriber: {
                                $first: "$subscriber"
                            }
                        }
                    }
                ],
                subscribersCount: [
                    { $count: "subscribers" }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, getSubscribers[0], "All subscribers fetched successfully"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    /*
    In above algo(getUserChannelSubscribers) replace subsciber with channel and channel with subscriber
    */
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id")
    }

    if (req.user?._id.toString() != subscriberId) {
        throw new ApiError(400, "You are not allowed to get channels subscribed by other users. Please use your own subscriber ID")
    }

    const getSubscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $facet: {
                channelsSubscribedTo: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "channel",
                            foreignField: "_id",
                            as: "channel",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1,
                                        createdAt: 1,
                                        updatedAt: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            channel: {
                                $first: "$channel"
                            }
                        }
                    }
                ],
                channelsSubscribedToCount: [
                    { $count: "channel" }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, getSubscribedChannels[0], "Channel subscribed by the user fetched successfully"))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}